package br.com.cristalmaster.services;

public class FifoService {

    public String validarSaida(String loteEsperado, String loteSelecionado) {

        if (loteEsperado == null || loteSelecionado == null) {
            return "Erro: lote inválido";
        }

        if (loteEsperado.equals(loteSelecionado)) {
            return "FIFO OK";
        }

        return "FIFO VIOLADO";
    }
}