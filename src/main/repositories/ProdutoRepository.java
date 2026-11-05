package br.com.cristalmaster.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import cristalmaster.models.Produto;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

}
