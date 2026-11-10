package br.com.cristalmaster.dtos;

/** Resposta (200 OK) de uma saída de estoque aprovada pela regra FIFO. */
public record SaidaResponse(String codigoQr, Integer quantidadeRetirada, Integer saldoAtual, String fifo) {
}
