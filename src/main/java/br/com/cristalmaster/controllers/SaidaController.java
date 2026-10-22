package br.com.cristalmaster.controllers;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import br.com.cristalmaster.dtos.SaidaRequest;
import br.com.cristalmaster.dtos.SaidaResponse;
import br.com.cristalmaster.services.EstoqueService;
import jakarta.validation.Valid;

/**
 * Rota de saída de material (o que o operador faz após ler o QR Code do lote).
 *  POST /api/saidas -> 200 saída aprovada pelo FIFO
 *                      400 bloqueada (fora de ordem, vencido ou acima do saldo; tentativa é registrada)
 *                      404 lote inexistente | 422 payload inválido
 */
@RestController
public class SaidaController {

    private final EstoqueService estoqueService;

    public SaidaController(EstoqueService estoqueService) {
        this.estoqueService = estoqueService;
    }

    @PostMapping("/api/saidas")
    public SaidaResponse registrar(@Valid @RequestBody SaidaRequest req) {
        return estoqueService.registrarSaida(req);
    }
}
