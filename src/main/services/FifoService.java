package br.com.cristalmaster.services;

/**
 * Regra de negócio FIFO (primeiro a entrar, primeiro a sair).
 * Esta primeira versão apenas compara o lote que o sistema esperava com o lote
 * que o operador selecionou. Ainda não descobre sozinha qual lote deveria sair,
 * nem verifica validade ou saldo, nem registra a tentativa bloqueada.
 */
public class FifoService {

    /**
     * Valida se a saída do lote respeita o FIFO.
     *
     * @param loteEsperado    código do lote que deveria sair primeiro
     * @param loteSelecionado código do lote que o operador escolheu
     * @return "FIFO OK", "FIFO VIOLADO" ou "Erro: lote inválido"
     */
    public String validarSaida(String loteEsperado, String loteSelecionado) {

        // Caso de erro: algum código não foi informado (nulo, vazio ou só espaços).
        // O vazio é o que o ControleDemo gera quando o usuário só aperta Enter.
        if (loteEsperado == null || loteSelecionado == null
                || loteEsperado.isBlank() || loteSelecionado.isBlank()) {
            return "Erro: lote inválido";
        }

        // Caso normal: o operador pegou exatamente o lote esperado.
        if (loteEsperado.equals(loteSelecionado)) {
            return "FIFO OK";
        }

        // Caso de anomalia: o lote escolhido é diferente do esperado (fora de ordem).
        return "FIFO VIOLADO";
    }
}