package br.com.cristalmaster.controllers;

import br.com.cristalmaster.models.Movimentacao;
import br.com.cristalmaster.repositories.MovimentacaoRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Aula 08: expõe as últimas movimentações (saídas aprovadas e tentativas bloqueadas)
 * para a tela mostrar em tempo real o que o simulador está fazendo.
 *
 * GET /api/movimentacoes?limite=15  ->  200 com a lista, mais recente primeiro.
 */
@RestController
@RequestMapping("/api/movimentacoes")
public class MovimentacaoController {

    private final MovimentacaoRepository repository;

    public MovimentacaoController(MovimentacaoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Movimentacao> listarUltimas(@RequestParam(defaultValue = "15") int limite) {
        int quantidade = Math.max(1, Math.min(limite, 100)); // entre 1 e 100
        // Ordena pelo id (maior = mais recente). Usa o findAll(Pageable) que o JpaRepository já oferece.
        return repository.findAll(PageRequest.of(0, quantidade, Sort.by(Sort.Direction.DESC, "id")))
                .getContent();
    }
}
