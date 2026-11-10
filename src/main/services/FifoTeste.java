package br.com.cristalmaster.services;

public class FifoTeste {

    public static void main(String[] args) {

        FifoService fifo = new FifoService();

        System.out.println("=== CASO NORMAL ===");
        System.out.println(
                fifo.validarSaida("LOT001", "LOT001"));

        System.out.println("\n=== CASO ANOMALIA ===");
        System.out.println(
                fifo.validarSaida("LOT001", "LOT005"));

        System.out.println("\n=== CASO ERRO ===");
        System.out.println(
                fifo.validarSaida(null, "LOT001"));
    }
}