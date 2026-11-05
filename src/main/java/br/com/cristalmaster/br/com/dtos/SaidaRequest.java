package br.com.cristalmaster.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Payload (JSON) esperado no POST /api/saidas: o lote lido no QR Code e a quantidade a retirar.
 * Exemplo: {"codigoQr":"LOT101","quantidade":200}
 */
public record SaidaRequest(
        @NotBlank(message = "codigoQr é obrigatório") String codigoQr,
        @NotNull(message = "quantidade é obrigatória") @Positive(message = "quantidade deve ser maior que zero") Integer quantidade) {
}
