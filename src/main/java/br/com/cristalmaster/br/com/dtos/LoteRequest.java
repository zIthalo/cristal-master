package br.com.cristalmaster.dtos;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Payload (JSON) esperado no POST /api/lotes. Funciona como o "gabarito" (schema) da entrada:
 * se algum campo não cumprir as regras abaixo, a API responde 422 e o dado nem chega à regra de negócio.
 */
public record LoteRequest(
        @NotBlank(message = "codigoQr é obrigatório") String codigoQr,
        @NotBlank(message = "produto é obrigatório") String produto,
        @NotBlank(message = "fileira é obrigatória") String fileira,
        @NotNull(message = "quantidade é obrigatória") @Positive(message = "quantidade deve ser maior que zero") Integer quantidade,
        @NotNull(message = "dataEntrada é obrigatória (formato AAAA-MM-DD)") LocalDate dataEntrada,
        @NotNull(message = "validade é obrigatória (formato AAAA-MM-DD)") LocalDate validade) {
}
