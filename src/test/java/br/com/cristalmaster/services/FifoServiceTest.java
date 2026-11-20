package br.com.cristalmaster.services;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

/** Testa a regra FIFO pura (sem Spring e sem banco). */
class FifoServiceTest {

    private final FifoService fifo = new FifoService();

    @Test
    void mesmoLoteEstaOk() {
        assertEquals("FIFO OK", fifo.validarSaida("LOT201", "LOT201"));
    }

    @Test
    void loteDiferenteViolaOFifo() {
        assertEquals("FIFO VIOLADO", fifo.validarSaida("LOT201", "LOT202"));
    }

    @Test
    void codigoVazioOuNuloEInvalido() {
        assertEquals("Erro: lote inválido", fifo.validarSaida("LOT201", " "));
        assertEquals("Erro: lote inválido", fifo.validarSaida(null, "LOT201"));
    }
}
