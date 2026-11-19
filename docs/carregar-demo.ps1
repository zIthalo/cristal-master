# Carrega lotes de demonstracao para a tela do operador.
# Use com a API no ar e o banco LIMPO (as fileiras F01 a F05 nao podem estar ocupadas).
# Executar no PowerShell, na raiz do projeto:  .\docs\carregar-demo.ps1
$u = "http://localhost:8080"
$lotes = @(
  '{"codigoQr":"LOT201","produto":"Resina Cristal","fileira":"F01","quantidade":1000,"dataEntrada":"2026-08-01","validade":"2027-08-01"}',
  '{"codigoQr":"LOT202","produto":"Resina Cristal","fileira":"F02","quantidade":800,"dataEntrada":"2026-09-01","validade":"2027-09-01"}',
  '{"codigoQr":"LOT203","produto":"Aditivo Azul","fileira":"F03","quantidade":500,"dataEntrada":"2026-07-01","validade":"2026-09-30"}',
  '{"codigoQr":"LOT204","produto":"Aditivo Azul","fileira":"F04","quantidade":400,"dataEntrada":"2026-09-15","validade":"2027-03-15"}',
  '{"codigoQr":"LOT205","produto":"Aditivo Vermelho","fileira":"F05","quantidade":300,"dataEntrada":"2026-10-01","validade":"2027-04-01"}'
)
foreach ($l in $lotes) {
  try {
    $r = Invoke-RestMethod -Method Post -Uri "$u/api/lotes" -ContentType "application/json" -Body $l
    "Criado: $($r.codigoQr)"
  } catch {
    "Falhou: $($_.ErrorDetails.Message)"
  }
}
"Pronto. Abra $u/ no navegador."
