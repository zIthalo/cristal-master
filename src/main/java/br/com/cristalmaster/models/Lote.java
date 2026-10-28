package br.com.cristalmaster.models;

import java.time.LocalDate;

import jakarta.persistence.*;

/**
 * Lote físico (pallet) de material, controlado pelo FIFO e identificado por QR Code.
 * Cada objeto desta classe vira uma linha da tabela "lotes".
 * Guarda o código do QR, o produto, a fileira, as quantidades, a data de entrada (base do FIFO) e a validade.
 */
@Entity
@Table(name = "lotes")
public class Lote {

    // Chave primária, gerada automaticamente pelo banco (auto incremento).
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Texto lido do QR Code do lote (ex.: LOT001).
    private String codigoQr;

    // Código da fileira do piso onde o lote está (ex.: F01).
    private String fileira;

    // Quantidade (kg) quando o lote entrou no estoque.
    private Integer qtdInicial;

    // Saldo atual do lote (kg), diminui a cada saída.
    private Integer qtdAtual;

    // Produto do lote (ex.: Resina Cristal). O FIFO é calculado entre lotes do mesmo produto.
    private String produto;

    // Data em que o lote entrou no estoque: quanto mais antiga, antes ele deve sair (FIFO).
    private LocalDate dataEntrada;

    // Data de validade: lote vencido não pode ter saída.
    private LocalDate validade;

    // Construtor vazio: exigido pelo JPA/Hibernate para criar objetos a partir do banco.
    public Lote() {
    }

    // Getters e setters: permitem ler e alterar os campos (usados pelo Hibernate e pelo JSON da API).
    public Long getId() {
        return id;
    }

    public String getCodigoQr() {
        return codigoQr;
    }

    public void setCodigoQr(String codigoQr) {
        this.codigoQr = codigoQr;
    }

    public String getFileira() {
        return fileira;
    }

    public void setFileira(String fileira) {
        this.fileira = fileira;
    }

    public Integer getQtdInicial() {
        return qtdInicial;
    }

    public void setQtdInicial(Integer qtdInicial) {
        this.qtdInicial = qtdInicial;
    }

    public Integer getQtdAtual() {
        return qtdAtual;
    }

    public void setQtdAtual(Integer qtdAtual) {
        this.qtdAtual = qtdAtual;
    }

    public String getProduto() {
        return produto;
    }

    public void setProduto(String produto) {
        this.produto = produto;
    }

    public LocalDate getDataEntrada() {
        return dataEntrada;
    }

    public void setDataEntrada(LocalDate dataEntrada) {
        this.dataEntrada = dataEntrada;
    }

    public LocalDate getValidade() {
        return validade;
    }

    public void setValidade(LocalDate validade) {
        this.validade = validade;
    }
}
