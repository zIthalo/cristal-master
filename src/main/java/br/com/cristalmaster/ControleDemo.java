package br.com.cristalmaster;

import java.util.Scanner;

import br.com.cristalmaster.services.FifoService;

public class ControleDemo {

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);
        FifoService fifo = new FifoService();

        while (true) {

            System.out.println("\n=================================");
            System.out.println(" CRISTALMASTER - DEMONSTRACAO ");
            System.out.println("=================================");
            System.out.println("1 - Validar FIFO");
            System.out.println("0 - Sair");
            System.out.print("Escolha: ");

            int opcao = sc.nextInt();
            sc.nextLine();

            if (opcao == 0) {
                System.out.println("Sistema encerrado.");
                break;
            }

            if (opcao == 1) {

                System.out.print("Lote esperado: ");
                String esperado = sc.nextLine();

                System.out.print("Lote selecionado: ");
                String selecionado = sc.nextLine();

                String resultado =
                        fifo.validarSaida(
                                esperado,
                                selecionado);

                System.out.println("\nResultado: " + resultado);
            }
        }

        sc.close();
    }
}