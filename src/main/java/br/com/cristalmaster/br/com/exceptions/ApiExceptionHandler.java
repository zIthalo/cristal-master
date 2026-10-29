package br.com.cristalmaster.exceptions;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Traduz erros em respostas HTTP padronizadas (a "portaria" da API):
 *  422 -> payload fora do esquema (campo ausente, vazio, negativo, texto no lugar de número, JSON quebrado)
 *  400 -> regra de negócio violada (FIFO, validade, saldo...)
 *  404 -> recurso inexistente
 * Assim um dado malformado nunca vira erro 500.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    // Validação do payload (@Valid) falhou: devolve 422 listando cada campo com problema.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> payloadInvalido(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> campos.putIfAbsent(e.getField(), e.getDefaultMessage()));
        Map<String, Object> corpo = corpo(422, "Payload inválido");
        corpo.put("campos", campos);
        return ResponseEntity.status(422).body(corpo);
    }

    // JSON quebrado ou tipo errado (ex.: "dez" no lugar de um número, data fora do padrão): 422.
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> jsonIlegivel(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(422)
                .body(corpo(422, "Payload ilegível ou com tipo/formato incorreto (datas: AAAA-MM-DD; quantidade: número inteiro)"));
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<Map<String, Object>> regraNegocio(RegraNegocioException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(corpo(400, ex.getMessage()));
    }

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<Map<String, Object>> naoEncontrado(RecursoNaoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(corpo(404, ex.getMessage()));
    }

    private Map<String, Object> corpo(int status, String erro) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("status", status);
        corpo.put("erro", erro);
        return corpo;
    }
}
