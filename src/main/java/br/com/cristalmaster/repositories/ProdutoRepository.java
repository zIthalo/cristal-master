package br.com.cristalmaster.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.cristalmaster.models.Produto;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

}
