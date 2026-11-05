# Cristal Master – Simulador do almoxarifado (Aula 08)
#
# Fica rodando em segundo plano e, a cada poucos segundos, faz o papel do operador:
#   - registra lotes novos (entrada)
#   - faz saídas corretas (o lote que o FIFO manda)
#   - tenta saídas ERRADAS: fora do FIFO, lote vencido e quantidade acima do saldo
# Tudo pela API real, então a tela (http://localhost:8080/) reage sozinha.
#
# Como rodar (com a API no ar), na pasta do projeto:
#   powershell -ExecutionPolicy Bypass -File mock\simulador.ps1
# Opções:
#   -Intervalo 4            segundos entre cada ação (padrão 4)
#   -Api http://localhost:8080
# Para parar: Ctrl + C

param(
    [string]$Api = 'http://localhost:8080',
    [int]$Intervalo = 4
)

[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Nomes dos campos do POST /api/lotes (DTO LoteRequest).
# CONFIRA com o docs/carregar-demo.ps1 e ajuste aqui se forem diferentes.
# ---------------------------------------------------------------------------
$CAMPO_CODIGO     = 'codigoQr'
$CAMPO_PRODUTO    = 'produto'
$CAMPO_FILEIRA    = 'fileira'
$CAMPO_QUANTIDADE = 'quantidade'
$CAMPO_ENTRADA    = 'dataEntrada'
$CAMPO_VALIDADE   = 'validade'

# Mesmos produtos do docs/carregar-demo.ps1, para os lotes do simulador disputarem o FIFO com os da demo.
$PRODUTOS = @('Resina Cristal', 'Aditivo Azul', 'Aditivo Vermelho')

# Prefixo único por execução: evita "código repetido" e "fileira ocupada" ao rodar várias vezes.
$RODADA = (Get-Date).ToString('HHmm')
$script:contador = 0

# ---------------------------------------------------------------------------
# Chamada HTTP que funciona no Windows PowerShell 5.1 e no PowerShell 7.
# Devolve @{ Status = 200/400/...; Corpo = objeto JSON } e Status = 0 se a API estiver fora.
# ---------------------------------------------------------------------------
function Chamar([string]$metodo, [string]$rota, $corpo = $null) {
    $p = @{ Uri = "$Api$rota"; Method = $metodo; UseBasicParsing = $true; TimeoutSec = 5 }
    if ($null -ne $corpo) {
        $p.ContentType = 'application/json; charset=utf-8'
        $p.Body = [Text.Encoding]::UTF8.GetBytes(($corpo | ConvertTo-Json -Compress))
    }
    try {
        $r = Invoke-WebRequest @p
        $texto = [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray())
        $obj = $null; if ($texto) { try { $obj = $texto | ConvertFrom-Json } catch {} }
        return @{ Status = [int]$r.StatusCode; Corpo = $obj }
    } catch {
        $resp = $_.Exception.Response
        if ($null -eq $resp) { return @{ Status = 0; Corpo = $null } }
        $texto = $null
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $texto = $_.ErrorDetails.Message }
        else { try { $texto = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd() } catch {} }
        $obj = $null; if ($texto) { try { $obj = $texto | ConvertFrom-Json } catch {} }
        return @{ Status = [int]$resp.StatusCode; Corpo = $obj }
    }
}

function Hora { (Get-Date).ToString('HH:mm:ss') }

function Log([string]$cor, [string]$rotulo, [string]$texto, $resp) {
    $msg = ''
    if ($resp) {
        $msg = " -> HTTP $($resp.Status)"
        if ($resp.Corpo -and $resp.Corpo.erro) { $msg += " | $($resp.Corpo.erro)" }
    }
    Write-Host "[$(Hora)] " -NoNewline -ForegroundColor DarkGray
    Write-Host ("{0,-16}" -f $rotulo) -NoNewline -ForegroundColor $cor
    Write-Host "$texto$msg"
}

function NovoLote([int]$diasEntrada = 0, [int]$diasValidade = 120, [string]$produto = $null) {
    $script:contador++
    if (-not $produto) { $produto = $PRODUTOS | Get-Random }
    $lote = [ordered]@{}
    $lote[$CAMPO_CODIGO]     = "SIM$RODADA-$('{0:D2}' -f $script:contador)"
    $lote[$CAMPO_PRODUTO]    = $produto
    $lote[$CAMPO_FILEIRA]    = "S$RODADA$('{0:D2}' -f $script:contador)"
    $lote[$CAMPO_QUANTIDADE] = (Get-Random -Minimum 6 -Maximum 11) * 100   # 600 a 1000 kg
    $lote[$CAMPO_ENTRADA]    = (Get-Date).AddDays($diasEntrada).ToString('yyyy-MM-dd')
    $lote[$CAMPO_VALIDADE]   = (Get-Date).AddDays($diasValidade).ToString('yyyy-MM-dd')
    return $lote
}

function Lista($resp) { if ($resp.Status -eq 200 -and $resp.Corpo) { return @($resp.Corpo) } else { return @() } }

# ---------------------------------------------------------------------------
# Cenários
# ---------------------------------------------------------------------------
function Cenario-Entrada {
    $lote = NovoLote
    $r = Chamar 'POST' '/api/lotes' $lote
    Log 'Cyan' 'ENTRADA' "$($lote[$CAMPO_CODIGO]) ($($lote[$CAMPO_PRODUTO]), $($lote[$CAMPO_QUANTIDADE]) kg, fileira $($lote[$CAMPO_FILEIRA]))" $r
}

function Cenario-SaidaCorreta {
    $prox = Lista (Chamar 'GET' '/api/fifo/proximos')
    if ($prox.Count -eq 0) { Cenario-Entrada; return }
    $l = $prox | Get-Random
    $qtd = [Math]::Min([int]$l.qtdAtual, (Get-Random -Minimum 1 -Maximum 4) * 100)
    $r = Chamar 'POST' '/api/saidas' @{ codigoQr = $l.codigoQr; quantidade = $qtd }
    Log 'Green' 'SAIDA OK' "$($l.codigoQr) ($($l.produto)) $qtd kg" $r
}

function Cenario-ViolarFifo {
    # Procura um lote válido, com saldo, que NÃO seja o próximo do seu produto (o pallet "da frente").
    $prox  = Lista (Chamar 'GET' '/api/fifo/proximos')
    $todos = Lista (Chamar 'GET' '/api/lotes')
    $hoje = (Get-Date).ToString('yyyy-MM-dd')
    $codigosProx = @($prox | ForEach-Object { $_.codigoQr })
    # Lote válido e com saldo que não está na lista de próximos = existe outro mais antigo do mesmo produto.
    $candidatos = @($todos | Where-Object {
        $_.qtdAtual -gt 0 -and $_.validade -ge $hoje -and ($codigosProx -notcontains $_.codigoQr)
    })
    if ($candidatos.Count -eq 0) {
        # Não há lote "mais novo" ainda: cria um do mesmo produto de um próximo, para o FIFO ter o que bloquear.
        if ($prox.Count -eq 0) { Cenario-Entrada; return }
        $base = $prox | Get-Random
        $lote = NovoLote 0 150 $base.produto
        $r = Chamar 'POST' '/api/lotes' $lote
        Log 'Cyan' 'ENTRADA' "$($lote[$CAMPO_CODIGO]) ($($lote[$CAMPO_PRODUTO])) para provocar FIFO" $r
        return
    }
    $l = $candidatos | Get-Random
    $r = Chamar 'POST' '/api/saidas' @{ codigoQr = $l.codigoQr; quantidade = 100 }
    Log 'Red' 'FORA DO FIFO' "$($l.codigoQr) ($($l.produto))" $r
}

function Cenario-AcimaDoSaldo {
    $prox = Lista (Chamar 'GET' '/api/fifo/proximos')
    if ($prox.Count -eq 0) { Cenario-Entrada; return }
    $l = $prox | Get-Random
    $qtd = [int]$l.qtdAtual + 500
    $r = Chamar 'POST' '/api/saidas' @{ codigoQr = $l.codigoQr; quantidade = $qtd }
    Log 'Yellow' 'ACIMA SALDO' "$($l.codigoQr) pediu $qtd kg (saldo $($l.qtdAtual))" $r
}

$script:loteVencido = $null
function Cenario-Vencido {
    if (-not $script:loteVencido) {
        # Tenta cadastrar um lote já vencido (entrada há 200 dias, validade ontem).
        $lote = NovoLote -200 -1
        $r = Chamar 'POST' '/api/lotes' $lote
        Log 'Cyan' 'ENTRADA' "$($lote[$CAMPO_CODIGO]) JA VENCIDO (para testar o bloqueio)" $r
        if ($r.Status -eq 201 -or $r.Status -eq 200) { $script:loteVencido = $lote[$CAMPO_CODIGO] }
        else { $script:loteVencido = 'NAO_ACEITO' }
        return
    }
    if ($script:loteVencido -eq 'NAO_ACEITO') { Cenario-ViolarFifo; return }
    $r = Chamar 'POST' '/api/saidas' @{ codigoQr = $script:loteVencido; quantidade = 50 }
    Log 'Red' 'LOTE VENCIDO' "$($script:loteVencido)" $r
}

# ---------------------------------------------------------------------------
# Laço principal
# ---------------------------------------------------------------------------
Write-Host ''
Write-Host "Simulador Cristal Master  |  API: $Api  |  uma acao a cada $Intervalo s  |  Ctrl+C para parar" -ForegroundColor White
Write-Host ''

# Sequência que se repete: mistura o que é certo com o que deve ser bloqueado.
$roteiro = @(
    'Cenario-Entrada', 'Cenario-SaidaCorreta', 'Cenario-ViolarFifo',
    'Cenario-Entrada', 'Cenario-Vencido', 'Cenario-SaidaCorreta',
    'Cenario-AcimaDoSaldo', 'Cenario-ViolarFifo', 'Cenario-Vencido'
)

$i = 0
$avisouFora = $false
while ($true) {
    $saude = Chamar 'GET' '/api/lotes'
    if ($saude.Status -eq 0) {
        if (-not $avisouFora) { Log 'Magenta' 'API FORA' "Sem resposta de $Api. Tentando de novo..." $null; $avisouFora = $true }
        Start-Sleep -Seconds $Intervalo
        continue
    }
    if ($avisouFora) { Log 'Magenta' 'API VOLTOU' '' $null; $avisouFora = $false }

    & $roteiro[$i % $roteiro.Count]
    $i++
    Start-Sleep -Seconds $Intervalo
}
