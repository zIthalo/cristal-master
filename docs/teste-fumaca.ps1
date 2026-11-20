# Teste de fumaca do Cristal Master: confere, pela API que esta no ar, o mesmo roteiro do README.
# Pode ser repetido quantas vezes quiser (cada execucao cria lotes novos com codigo unico).
#
# Uso (API no ar), na pasta do projeto:
#   powershell -ExecutionPolicy Bypass -File docs\teste-fumaca.ps1
#   powershell -ExecutionPolicy Bypass -File docs\teste-fumaca.ps1 -Api https://localhost:8443
# Resultado: uma linha OK/FALHOU por verificacao e, no fim, o total. Codigo de saida 0 = tudo certo.
param([string]$Api = 'http://localhost:8080')

if ($Api -like 'https://*') {
    if ($PSVersionTable.PSVersion.Major -ge 6) {
        $PSDefaultParameterValues['Invoke-WebRequest:SkipCertificateCheck'] = $true
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

[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

# Devolve @{ Status = codigo HTTP; Corpo = objeto JSON; Texto = resposta crua }. Status 0 = API fora do ar.
function Chamar([string]$metodo, [string]$rota, $corpo = $null) {
    $p = @{ Uri = "$Api$rota"; Method = $metodo; UseBasicParsing = $true; TimeoutSec = 10 }
    if ($null -ne $corpo) {
        $p.ContentType = 'application/json; charset=utf-8'
        $p.Body = [Text.Encoding]::UTF8.GetBytes(($corpo | ConvertTo-Json -Compress))
    }
    try {
        $r = Invoke-WebRequest @p
        $texto = [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray())
        $obj = $null; if ($texto) { try { $obj = $texto | ConvertFrom-Json } catch {} }
        return @{ Status = [int]$r.StatusCode; Corpo = $obj; Texto = $texto }
    } catch {
        $resp = $_.Exception.Response
        if ($null -eq $resp) { return @{ Status = 0; Corpo = $null; Texto = '' } }
        $texto = $null
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $texto = $_.ErrorDetails.Message }
        else { try { $texto = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd() } catch {} }
        $obj = $null; if ($texto) { try { $obj = $texto | ConvertFrom-Json } catch {} }
        return @{ Status = [int]$resp.StatusCode; Corpo = $obj; Texto = $texto }
    }
}

$script:total = 0
$script:falhas = 0
function Conferir([string]$nome, [bool]$condicao, [string]$detalhe = '') {
    $script:total++
    if ($condicao) {
        Write-Host ("  OK      " + $nome) -ForegroundColor Green
    } else {
        $script:falhas++
        Write-Host ("  FALHOU  " + $nome + "  -> " + $detalhe) -ForegroundColor Red
    }
}

function Dia([int]$dias) { (Get-Date).AddDays($dias).ToString('yyyy-MM-dd') }

# Codigos e produtos unicos desta execucao.
$s = (Get-Date).ToString('HHmmss')
$resina = "TResina$s"; $azul = "TAzul$s"; $verm = "TVerm$s"
$A1 = "T$s-A1"; $A2 = "T$s-A2"; $V = "T$s-V"; $B = "T$s-B"; $C = "T$s-C"

function Lote([string]$cod, [string]$prod, [string]$fil, [int]$qtd, [int]$dEnt, [int]$dVal) {
    return Chamar 'POST' '/api/lotes' @{ codigoQr = $cod; produto = $prod; fileira = $fil; quantidade = $qtd; dataEntrada = (Dia $dEnt); validade = (Dia $dVal) }
}
function Saida([string]$cod, [int]$qtd) { return Chamar 'POST' '/api/saidas' @{ codigoQr = $cod; quantidade = $qtd } }
function Erro($r) { if ($r.Corpo -and $r.Corpo.erro) { return [string]$r.Corpo.erro } else { return [string]$r.Texto } }

Write-Host ''
Write-Host "Teste de fumaca  |  API: $Api  |  execucao $s" -ForegroundColor White

Write-Host "`n[1] Saude da API"
$h = Chamar 'GET' '/health'
if ($h.Status -eq 0) { Write-Host "API fora do ar em $Api. Suba a API e tente de novo." -ForegroundColor Red; exit 2 }
Conferir 'GET /health responde 200' ($h.Status -eq 200) "status $($h.Status)"
Conferir '/health diz que o banco esta conectado' ($h.Texto -like '*banco de dados conectado*') $h.Texto

Write-Host "`n[2] Cadastro de lotes"
$cad = @(
    (Lote $A1 $resina "FA$s" 1000 -100 300),
    (Lote $A2 $resina "FB$s" 800 -70 330),
    (Lote $V $azul "FC$s" 500 -130 -1),
    (Lote $B $azul "FD$s" 400 -60 120),
    (Lote $C $verm "FE$s" 300 -50 150)
)
Conferir 'os 5 lotes foram criados (201)' (@($cad | Where-Object { $_.Status -eq 201 }).Count -eq 5) (($cad | ForEach-Object { $_.Status }) -join ',')
$dup = Lote $A1 $resina "FX$s" 10 0 30
Conferir 'codigo repetido e recusado (400)' ($dup.Status -eq 400) "status $($dup.Status)"
$ocup = Lote "T$s-X" $resina "FA$s" 10 0 30
Conferir 'fileira ocupada e recusada (400)' ($ocup.Status -eq 400) "status $($ocup.Status)"
$inv = Chamar 'POST' '/api/lotes' @{ codigoQr = ''; produto = ''; fileira = ''; quantidade = -1 }
Conferir 'payload invalido e recusado (422)' ($inv.Status -eq 422) "status $($inv.Status)"

Write-Host "`n[3] Proximo a sair de cada produto"
$px = Chamar 'GET' '/api/fifo/proximos'
$cods = @(@($px.Corpo) | ForEach-Object { $_.codigoQr })
Conferir "Resina: o proximo e o lote mais antigo ($A1)" ($cods -contains $A1)
Conferir "Azul: o proximo ignora o vencido ($B)" (($cods -contains $B) -and ($cods -notcontains $V))
Conferir "Vermelho: o proximo e $C" ($cods -contains $C)
Conferir 'lote mais novo da Resina nao aparece como proximo' ($cods -notcontains $A2)

Write-Host "`n[4] Saidas e bloqueios"
$r = Saida $A1 200
Conferir 'saida correta autorizada (200), saldo 800' (($r.Status -eq 200) -and ($r.Corpo.saldoAtual -eq 800)) "status $($r.Status) $(Erro $r)"
$r = Saida $A2 100
Conferir 'fora do FIFO bloqueada (400)' (($r.Status -eq 400) -and ((Erro $r) -like '*FIFO violado*')) "status $($r.Status) $(Erro $r)"
$r = Saida $V 50
Conferir 'lote vencido bloqueado (400)' (($r.Status -eq 400) -and ((Erro $r) -like '*vencido*')) "status $($r.Status) $(Erro $r)"
$r = Saida $A1 5000
Conferir 'quantidade acima do saldo bloqueada (400)' (($r.Status -eq 400) -and ((Erro $r) -like '*acima do saldo*')) "status $($r.Status) $(Erro $r)"
$r = Saida "T$s-NAOEXISTE" 10
Conferir 'lote inexistente (404)' ($r.Status -eq 404) "status $($r.Status)"
$r = Saida $B 100
Conferir 'Azul: saida do proximo valido autorizada (200)' ($r.Status -eq 200) "status $($r.Status) $(Erro $r)"
$r = Saida $C 300
Conferir 'Vermelho: esgota o lote (200), saldo 0' (($r.Status -eq 200) -and ($r.Corpo.saldoAtual -eq 0)) "status $($r.Status) $(Erro $r)"

Write-Host "`n[5] Esgotar o lote libera o proximo"
$r = Saida $A1 800
Conferir 'Resina: esgota o lote mais antigo (200)' ($r.Status -eq 200) "status $($r.Status) $(Erro $r)"
$r = Saida $A2 100
Conferir 'Resina: agora o lote seguinte pode sair (200)' ($r.Status -eq 200) "status $($r.Status) $(Erro $r)"

Write-Host "`n[6] Registro de movimentacoes"
$m = Chamar 'GET' '/api/movimentacoes?limite=100'
$movs = @($m.Corpo)
Conferir 'existem saidas registradas' (@($movs | Where-Object { $_.tipo -eq 'SAIDA' -and $_.codigoQr -like "T$s-*" }).Count -ge 4)
Conferir 'existem tentativas bloqueadas registradas' (@($movs | Where-Object { $_.tipo -eq 'TENTATIVA_BLOQUEADA' -and $_.codigoQr -like "T$s-*" }).Count -ge 3)

Write-Host ''
if ($script:falhas -eq 0) {
    Write-Host "TUDO CERTO: $($script:total) verificacoes passaram." -ForegroundColor Green
    exit 0
} else {
    Write-Host "$($script:falhas) de $($script:total) verificacoes FALHARAM." -ForegroundColor Red
    exit 1
}
