package br.com.cristalmaster.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.cristalmaster.models.Lote;

public interface LoteRepository extends JpaRepository<Lote, Long> {

	Optional<Lote> findByCodigo(String codigo);

	boolean existsByCodigo(String codigo);

	boolean existsByFileira(String fileira);

	/** Ordem FIFO: o lote mais antigo primeiro. */
	List<Lote> findAllByOrderByDataEntradaAsc();
}
