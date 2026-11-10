package br.com.cristalmaster.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import cristalmaster.dtos.LoteRequest;
import cristalmaster.exceptions.RecursoNaoEncontradoException;
import cristalmaster.models.Lote;
import cristalmaster.repositories.LoteRepository;
import cristalmaster.services.EstoqueService;
import jakarta.validation.Valid;

/**
 * Rotas de lotes.
 *  GET  /api/lotes          -> 200: lista em ordem FIFO (mais antigo primeiro)
 *  GET  /api/lotes/{qr}     -> 200 ou 404 se o QR não existir
 *  GET  /api/fifo/proximos  -> 200: o lote que deve sair primeiro de cada produto (usado pela tela)
 *  POST /api/lotes          -> 201 criado | 422 payload inválido | 400 regra de negócio violada
 */
@RestController
public class LoteController {

    private final LoteRepository repository;
    private final EstoqueService estoqueService;

    public LoteController(LoteRepository repository, EstoqueService estoqueService) {
        this.repository = repository;
        this.estoqueService = estoqueService;
    }

    @GetMapping("/api/lotes")
    public List<Lote> listar() {
        return repository.findAllByOrderByDataEntradaAscIdAsc();
    }

    @GetMapping("/api/lotes/{codigoQr}")
    public Lote buscar(@PathVariable String codigoQr) {
        return repository.findByCodigoQr(codigoQr)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Lote não encontrado: " + codigoQr));
    }

    @GetMapping("/api/fifo/proximos")
    public List<Lote> proximos() {
        return estoqueService.proximosPorProduto();
    }

    // @Valid aplica as regras do LoteRequest antes de entrar no método.
    @PostMapping("/api/lotes")
    public ResponseEntity<Lote> cadastrar(@Valid @RequestBody LoteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(estoqueService.cadastrarLote(req));
    }
}
