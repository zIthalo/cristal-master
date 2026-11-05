package br.com.cristalmaster.exceptions;

/** O item procurado não existe (ex.: lote com QR desconhecido). Vira HTTP 404. */
public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
