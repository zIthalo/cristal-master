# Carrega lotes de demonstracao para a tela do operador.
# Use com a API no ar e o banco LIMPO (as fileiras F01 a F05 nao podem estar ocupadas).
# Executar no PowerShell, na raiz do projeto:  .\docs\carregar-demo.ps1   (ou: -Api https://localhost:8443)
param([string]$Api = 'http://localhost:8080')   # com o perfil https: -Api https://localhost:8443

# Aceita o certificado autoassinado do perfil https (https://localhost:8443). Em http nao faz nada.
if ($Api -like 'https://*') {
    if ($PSVersionTable.PSVersion.Major -ge 6) {
        $PSDefaultParameterValues['Invoke-WebRequest:SkipCertificateCheck'] = $true
        $PSDefaultParameterValues['Invoke-RestMethod:SkipCertificateCheck'] = $true
    } else {
        Add-Type @"
using System.Net;
using System.Security.Cryptography.X509Certificates;
public class CmTrustAll : ICertificatePolicy {
    public bool CheckValidationResult(ServicePoint sp, X509Certificate c, WebRequest r, int p) { return true; }
}
"@
        [System.Net.ServicePointManager]::CertificatePolicy = New-Object CmTrustAll
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    }
}
$u = $Api
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
