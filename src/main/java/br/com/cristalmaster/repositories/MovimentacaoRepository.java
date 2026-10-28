package br.com.cristalmaster.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.cristalmaster.models.Movimentacao;

/** Repository de Movimentacao: grava saídas e tentativas bloqueadas. */
public interface MovimentacaoRepository extends JpaRepository<Movimentacao, Long> {
}
