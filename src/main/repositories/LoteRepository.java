package br.com.cristalmaster.repositories;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import cristalmaster.models.Lote;

/**
 * Repository de Lote. Os métodos abaixo são "derivados": o Spring Data gera o SQL a partir do nome.
 */
public interface LoteRepository extends JpaRepository<Lote, Long> {

    // Busca o lote pelo texto do QR Code.
    Optional<Lote> findByCodigoQr(String codigoQr);

    boolean existsByCodigoQr(String codigoQr);

    // Verdadeiro se a fileira já tem um lote com saldo (regra: um lote por fileira).
    boolean existsByFileiraAndQtdAtualGreaterThan(String fileira, Integer qtdAtual);

    // Todos os lotes, do mais antigo para o mais novo (ordem FIFO).
    List<Lote> findAllByOrderByDataEntradaAscIdAsc();

    // Lote esperado pelo FIFO: o mais antigo do produto, com saldo e dentro da validade.
    Optional<Lote> findFirstByProdutoAndQtdAtualGreaterThanAndValidadeGreaterThanEqualOrderByDataEntradaAscIdAsc(
            String produto, Integer qtdAtual, LocalDate validade);
}
