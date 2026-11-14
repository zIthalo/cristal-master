package br.com.cristalmaster.models;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Registro de movimentação de estoque (saída ou tentativa de saída bloqueada).
 * Cada objeto vira uma linha da tabela "movimentacoes".
 * Guarda o código do lote (QR) e, nas tentativas bloqueadas, o motivo. Ainda não registra o operador.
 */
@Entity
@Table(name = "movimentacoes")
public class Movimentacao {

    // Chave primária, gerada automaticamente pelo banco.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tipo da movimentação: SAIDA ou TENTATIVA_BLOQUEADA.
    private String tipo;

    // Quantidade movimentada (kg).
    private Integer quantidade;

    // Momento em que a movimentação aconteceu.
    private LocalDateTime dataHora;

    // Código (QR) do lote envolvido na movimentação.
    private String codigoQr;

    // Motivo do bloqueio (preenchido só nas tentativas bloqueadas).
    private String motivo;

    // Construtor vazio exigido pelo JPA/Hibernate.
    public Movimentacao() {
    }

    // Getters e setters dos campos.
    public Long getId() {
        return id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Integer quantidade) {
        this.quantidade = quantidade;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }

    public String getCodigoQr() {
        return codigoQr;
    }

    public void setCodigoQr(String codigoQr) {
        this.codigoQr = codigoQr;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }
}
