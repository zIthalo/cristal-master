package br.com.cristalmaster.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.cristalmaster.models.Produto;
import br.com.cristalmaster.repositories.ProdutoRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
public class ProdutoController {

    private final ProdutoRepository repository;

    public ProdutoController(ProdutoRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/produtos")
    public List<Produto> listarProdutos() {
        return repository.findAll();
    }
    @PostMapping("/produtos")
public Produto salvarProduto(@RequestBody Produto produto) {
    return repository.save(produto);
}
}