package br.com.cristalmaster.controllers;

import java.sql.Connection;

import javax.sql.DataSource;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health check (Aula 08): testa de verdade a conexão com o MySQL.
 *  GET /health -> 200 "Sistema OK - banco de dados conectado"
 *              -> 503 "API no ar, mas o banco de dados está fora: <motivo>"
 * Assim dá para saber se o problema é a API (a página nem abre) ou o banco (abre com 503).
 */
@RestController
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        // Pede uma conexão ao pool e pergunta ao driver se ela responde em até 2 segundos.
        try (Connection conexao = dataSource.getConnection()) {
            if (conexao.isValid(2)) {
                return ResponseEntity.ok("Sistema OK - banco de dados conectado");
            }
            return ResponseEntity.status(503).body("API no ar, mas o banco de dados não respondeu");
        } catch (Exception e) {
            return ResponseEntity.status(503).body("API no ar, mas o banco de dados está fora: " + e.getMessage());
        }
    }
}
