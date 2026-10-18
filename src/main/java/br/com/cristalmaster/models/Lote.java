package br.com.cristalmaster.models;

import jakarta.persistence.*;

@Entity
@Table(name = "lotes")
public class Lote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String codigoQr;

    private String fileira;

    private Integer qtdInicial;

    private Integer qtdAtual;

    public Lote() {
    }

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
}