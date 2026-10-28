package br.com.cristalmaster.models;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Lote de material (pallet) identificado por QR Code e alocado em uma fileira do piso.
 * Regra do desafio: cada fileira (ex.: F01) guarda um único lote por vez.
 */
@Entity
@Table(name = "lote")
@Getter
@Setter
@NoArgsConstructor
public class Lote {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Conteúdo do QR Code do lote. */
	@Column(nullable = false, unique = true, length = 40)
	private String codigo;

	@Column(nullable = false, length = 120)
	private String produto;

	/** Saldo em kg. */
	@Column(nullable = false, precision = 12, scale = 3)
	private BigDecimal quantidadeKg;

	@Column(nullable = false)
	private LocalDate dataEntrada;

	@Column(nullable = false)
	private LocalDate validade;

	/** Código da fileira no piso (F01, F02...). */
	@Column(nullable = false, length = 10)
	private String fileira;
}
