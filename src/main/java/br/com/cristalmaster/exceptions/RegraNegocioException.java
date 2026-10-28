package br.com.cristalmaster.exceptions;

/** Violação de regra de negócio (ex.: FIFO violado, lote vencido, saldo insuficiente). Vira HTTP 400. */
public class RegraNegocioException extends RuntimeException {

    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
