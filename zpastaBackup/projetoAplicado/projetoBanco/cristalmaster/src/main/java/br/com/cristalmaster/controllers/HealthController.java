package br.com.cristalmaster.controllers;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Verifica ativamente a conexão com o banco e retorna o status real do sistema.
 * Teste: GET http://localhost:8080/health  (alias: /api/health)
 */
@RestController
public class HealthController {

	private final DataSource dataSource;

	public HealthController(DataSource dataSource) {
		this.dataSource = dataSource;
	}

	@GetMapping({ "/health", "/api/health" })
	public ResponseEntity<Map<String, Object>> health() {
		Map<String, Object> resposta = new LinkedHashMap<>();
		resposta.put("aplicacao", "cristalmaster");
		resposta.put("horario", LocalDateTime.now().toString());

		try (Connection conexao = dataSource.getConnection()) {
			boolean valida = conexao.isValid(2);
			resposta.put("status", valida ? "UP" : "DOWN");
			resposta.put("banco", valida ? "UP" : "DOWN");
			resposta.put("produto", conexao.getMetaData().getDatabaseProductName());
			resposta.put("catalogo", conexao.getCatalog());
			return ResponseEntity.status(valida ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(resposta);
		} catch (Exception e) {
			resposta.put("status", "DOWN");
			resposta.put("banco", "DOWN");
			resposta.put("erro", e.getMessage());
			return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(resposta);
		}
	}
}
