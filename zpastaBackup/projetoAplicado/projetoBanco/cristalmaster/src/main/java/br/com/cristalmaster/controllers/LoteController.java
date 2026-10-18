package br.com.cristalmaster.controllers;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import br.com.cristalmaster.models.Lote;
import br.com.cristalmaster.repositories.LoteRepository;

/**
 * Primeiras rotas de dados (Sprint 1).
 *  GET  /api/exemplo           -> lista os lotes em ordem FIFO (mais antigo primeiro)
 *  GET  /api/exemplo/{codigo}  -> consulta um lote pelo código do QR Code
 *  POST /api/dados             -> grava um novo lote
 */
@RestController
public class LoteController {

	private final LoteRepository repository;

	public LoteController(LoteRepository repository) {
		this.repository = repository;
	}

	@GetMapping("/api/exemplo")
	public List<Lote> listar() {
		return repository.findAllByOrderByDataEntradaAsc();
	}

	@GetMapping("/api/exemplo/{codigo}")
	public ResponseEntity<?> buscar(@PathVariable String codigo) {
		return repository.findByCodigo(codigo)
				.<ResponseEntity<?>>map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
						.body(Map.of("erro", "Lote não encontrado: " + codigo)));
	}

	@PostMapping("/api/dados")
	public ResponseEntity<?> gravar(@RequestBody Lote lote) {
		if (lote.getCodigo() == null || lote.getCodigo().isBlank()
				|| lote.getProduto() == null || lote.getProduto().isBlank()
				|| lote.getQuantidadeKg() == null || lote.getQuantidadeKg().compareTo(BigDecimal.ZERO) <= 0
				|| lote.getDataEntrada() == null || lote.getValidade() == null
				|| lote.getFileira() == null || lote.getFileira().isBlank()) {
			return ResponseEntity.badRequest().body(Map.of("erro",
					"Campos obrigatórios: codigo, produto, quantidadeKg (>0), dataEntrada, validade, fileira"));
		}
		if (repository.existsByCodigo(lote.getCodigo())) {
			return ResponseEntity.status(HttpStatus.CONFLICT)
					.body(Map.of("erro", "Já existe lote com o código " + lote.getCodigo()));
		}
		// Regra do desafio: uma fileira guarda um único lote por vez.
		if (repository.existsByFileira(lote.getFileira())) {
			return ResponseEntity.status(HttpStatus.CONFLICT)
					.body(Map.of("erro", "A fileira " + lote.getFileira() + " já está ocupada por outro lote"));
		}
		lote.setId(null);
		return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(lote));
	}
}
