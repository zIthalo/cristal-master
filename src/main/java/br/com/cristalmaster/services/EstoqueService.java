package br.com.cristalmaster.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.cristalmaster.dtos.LoteRequest;
import br.com.cristalmaster.dtos.SaidaRequest;
import br.com.cristalmaster.dtos.SaidaResponse;
import br.com.cristalmaster.exceptions.RecursoNaoEncontradoException;
import br.com.cristalmaster.exceptions.RegraNegocioException;
import br.com.cristalmaster.models.Lote;
import br.com.cristalmaster.models.Movimentacao;
import br.com.cristalmaster.repositories.LoteRepository;
import br.com.cristalmaster.repositories.MovimentacaoRepository;

/**
 * Regras de negócio do estoque: cadastro de lotes e saída de material com validação FIFO.
 * Reaproveita o FifoService para decidir se o lote escolhido é o esperado.
 */
@Service
public class EstoqueService {

    private final LoteRepository loteRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    // Mantém o FifoService como está (também usado pelo ControleDemo, sem Spring).
    private final FifoService fifo = new FifoService();

    public EstoqueService(LoteRepository loteRepository, MovimentacaoRepository movimentacaoRepository) {
        this.loteRepository = loteRepository;
        this.movimentacaoRepository = movimentacaoRepository;
    }

    /** Cadastra um lote novo (entrada). Lança RegraNegocioException (400) se violar alguma regra. */
    public Lote cadastrarLote(LoteRequest req) {
        if (!req.validade().isAfter(req.dataEntrada())) {
            throw new RegraNegocioException("A validade deve ser posterior à data de entrada");
        }
        if (loteRepository.existsByCodigoQr(req.codigoQr())) {
            throw new RegraNegocioException("Já existe um lote com o código " + req.codigoQr());
        }
        if (loteRepository.existsByFileiraAndQtdAtualGreaterThan(req.fileira(), 0)) {
            throw new RegraNegocioException("A fileira " + req.fileira() + " já está ocupada por outro lote");
        }
        Lote lote = new Lote();
        lote.setCodigoQr(req.codigoQr());
        lote.setProduto(req.produto());
        lote.setFileira(req.fileira());
        lote.setQtdInicial(req.quantidade());
        lote.setQtdAtual(req.quantidade());
        lote.setDataEntrada(req.dataEntrada());
        lote.setValidade(req.validade());
        return loteRepository.save(lote);
    }

    /**
     * Registra a saída de material de um lote lido no QR Code.
     * Bloqueia (400) e registra a tentativa se: o lote estiver vencido, a quantidade passar do saldo
     * ou o lote não for o esperado pelo FIFO. Lote desconhecido gera 404.
     * noRollbackFor: o registro da tentativa bloqueada é gravado mesmo com a exceção.
     */
    @Transactional(noRollbackFor = RegraNegocioException.class)
    public SaidaResponse registrarSaida(SaidaRequest req) {
        Lote lote = loteRepository.findByCodigoQr(req.codigoQr())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Lote não encontrado: " + req.codigoQr()));

        int saldo = lote.getQtdAtual() == null ? 0 : lote.getQtdAtual();
        LocalDate hoje = LocalDate.now();

        // 1) Lote vencido não sai.
        if (lote.getValidade() != null && lote.getValidade().isBefore(hoje)) {
            throw bloquear(lote, req.quantidade(), "Lote vencido em " + lote.getValidade());
        }
        // 2) Não pode retirar mais do que o saldo.
        if (req.quantidade() > saldo) {
            throw bloquear(lote, req.quantidade(), "Quantidade acima do saldo do lote (saldo atual: " + saldo + ")");
        }
        // 3) FIFO: o esperado é o lote mais antigo do mesmo produto, com saldo e dentro da validade.
        Lote esperado = loteRepository
                .findFirstByProdutoAndQtdAtualGreaterThanAndValidadeGreaterThanEqualOrderByDataEntradaAscIdAsc(
                        lote.getProduto(), 0, hoje)
                .orElse(lote);
        String resultado = fifo.validarSaida(esperado.getCodigoQr(), lote.getCodigoQr());
        if (!"FIFO OK".equals(resultado)) {
            throw bloquear(lote, req.quantidade(), "FIFO violado: o lote esperado é " + esperado.getCodigoQr()
                    + " (fileira " + esperado.getFileira() + ")");
        }

        // Aprovado: baixa o saldo e registra a movimentação na hora.
        lote.setQtdAtual(saldo - req.quantidade());
        loteRepository.save(lote);
        registrar("SAIDA", lote, req.quantidade(), null);
        return new SaidaResponse(lote.getCodigoQr(), req.quantidade(), lote.getQtdAtual(), resultado);
    }

    /**
     * Lote que deve sair primeiro de cada produto (o mais antigo, com saldo e dentro da validade).
     * Usa a mesma regra do registrarSaida, para a tela mostrar ao operador o lote certo antes da retirada.
     */
    public List<Lote> proximosPorProduto() {
        LocalDate hoje = LocalDate.now();
        Map<String, Lote> proximos = new LinkedHashMap<>();
        for (Lote l : loteRepository.findAllByOrderByDataEntradaAscIdAsc()) {
            boolean disponivel = l.getProduto() != null
                    && l.getQtdAtual() != null && l.getQtdAtual() > 0
                    && l.getValidade() != null && !l.getValidade().isBefore(hoje);
            if (disponivel) {
                proximos.putIfAbsent(l.getProduto(), l);
            }
        }
        return new ArrayList<>(proximos.values());
    }

    // Grava a tentativa bloqueada e devolve a exceção para ser lançada por quem chamou.
    private RegraNegocioException bloquear(Lote lote, Integer quantidade, String motivo) {
        registrar("TENTATIVA_BLOQUEADA", lote, quantidade, motivo);
        return new RegraNegocioException(motivo);
    }

    private void registrar(String tipo, Lote lote, Integer quantidade, String motivo) {
        Movimentacao m = new Movimentacao();
        m.setTipo(tipo);
        m.setCodigoQr(lote.getCodigoQr());
        m.setQuantidade(quantidade);
        m.setMotivo(motivo);
        m.setDataHora(LocalDateTime.now());
        movimentacaoRepository.save(m);
    }
}
