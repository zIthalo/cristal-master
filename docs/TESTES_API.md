# Roteiro de testes: validação de payload e códigos HTTP

Com a API no ar (`.\mvnw.cmd spring-boot:run`), abra o PowerShell e cole primeiro esta função. Ela mostra o **código HTTP** e o corpo de cada resposta:

```powershell
function Chamar($metodo, $url, $corpo) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Method $metodo -Uri $url -ContentType "application/json" -Body $corpo
    "HTTP $($r.StatusCode)"; $r.Content
  } catch {
    "HTTP $([int]$_.Exception.Response.StatusCode)"; $_.ErrorDetails.Message
  }
}
$u = "http://localhost:8080"
```

> Os testes abaixo usam a data de hoje (22/10/2026) como referência para validade. Se a data do computador for outra, ajuste as validades.

## 1. Cadastro de lotes (sucesso: 201)

```powershell
Chamar POST "$u/api/lotes" '{"codigoQr":"LOT101","produto":"Resina Cristal","fileira":"F01","quantidade":1000,"dataEntrada":"2026-08-01","validade":"2027-08-01"}'
Chamar POST "$u/api/lotes" '{"codigoQr":"LOT102","produto":"Resina Cristal","fileira":"F02","quantidade":800,"dataEntrada":"2026-09-01","validade":"2027-09-01"}'
Chamar POST "$u/api/lotes" '{"codigoQr":"LOT103","produto":"Aditivo Azul","fileira":"F03","quantidade":500,"dataEntrada":"2026-07-01","validade":"2026-09-30"}'
```
Esperado: `HTTP 201` nos três (o LOT103 já está vencido, para o teste 4).

## 2. Consultas (200 e 404)

```powershell
Chamar GET "$u/api/lotes"          # 200, lista em ordem FIFO: LOT103, LOT101, LOT102
Chamar GET "$u/api/lotes/LOT101"   # 200
Chamar GET "$u/api/lotes/LOT999"   # 404 (não existe)
```

## 3. Saída correta (200)

```powershell
Chamar POST "$u/api/saidas" '{"codigoQr":"LOT101","quantidade":200}'
```
Esperado: `HTTP 200` com `"fifo":"FIFO OK"` e `"saldoAtual":800`.

## 4. Regras de negócio violadas (400 + tentativa registrada)

```powershell
Chamar POST "$u/api/saidas" '{"codigoQr":"LOT102","quantidade":100}'    # FIFO violado: o esperado é o LOT101
Chamar POST "$u/api/saidas" '{"codigoQr":"LOT101","quantidade":5000}'   # acima do saldo
Chamar POST "$u/api/saidas" '{"codigoQr":"LOT103","quantidade":10}'     # lote vencido
Chamar POST "$u/api/lotes"  '{"codigoQr":"LOT104","produto":"Resina Cristal","fileira":"F01","quantidade":10,"dataEntrada":"2026-10-01","validade":"2027-10-01"}'   # fileira F01 ocupada
```
Esperado: `HTTP 400` com a mensagem do motivo. No MySQL: `SELECT * FROM movimentacoes;` mostra as linhas `TENTATIVA_BLOQUEADA` com o motivo.

## 5. Payload inválido (422)

```powershell
Chamar POST "$u/api/saidas" '{"codigoQr":"","quantidade":-5}'               # campos vazios/negativos
Chamar POST "$u/api/saidas" '{"codigoQr":"LOT101","quantidade":"dez"}'      # texto no lugar de número
Chamar POST "$u/api/saidas" '{"codigoQr":"LOT101"'                          # JSON quebrado
Chamar POST "$u/api/lotes"  '{"codigoQr":"LOT105","produto":"Resina Cristal","fileira":"F05","quantidade":100,"dataEntrada":"01/08/2026","validade":"2027-08-01"}'   # data fora do padrão
```
Esperado: `HTTP 422`. Nos dois primeiros, o corpo lista os campos com problema.

## 6. Lote inexistente (404)

```powershell
Chamar POST "$u/api/saidas" '{"codigoQr":"LOT999","quantidade":10}'
```

## Resumo dos códigos

| Código | Quando |
|--------|--------|
| 200 | Consulta ou saída aprovada |
| 201 | Lote cadastrado |
| 400 | Regra de negócio violada (FIFO, validade, saldo, fileira ocupada, código repetido) |
| 404 | Lote não encontrado |
| 422 | Payload fora do esquema (campo ausente/vazio/negativo, tipo ou data errados, JSON quebrado) |

Para repetir o roteiro do zero, apague os dados: `DELETE FROM movimentacoes; DELETE FROM lotes;` (ou recrie o banco).
