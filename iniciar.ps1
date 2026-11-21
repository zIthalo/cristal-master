# Inicia o Cristal Master para uso no celular (HTTPS, necessario para a camera ler QR Code).
# Uso: duplo clique em iniciar.bat  ou  powershell -ExecutionPolicy Bypass -File iniciar.ps1
# Por padrao usa o banco H2 embutido (nao precisa de MySQL). Para usar o MySQL: iniciar.bat -Banco mysql
# (MySQL ligado e, se o root tiver senha, defina DB_SENHA ou use o .env; veja o README).
param([ValidateSet('h2','mysql')][string]$Banco = 'h2')
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# 1) Java 17+ (procura primeiro no JAVA_HOME, depois no PATH)
# Obs.: o "java -version" escreve na saida de erro; por isso a checagem roda com Continue (com Stop o PowerShell
# 5.1 lancaria excecao e a versao apareceria como 0).
function InfoJava([string]$exe) {
  $antes = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { $saida = ((& $exe -XshowSettings:properties -version 2>&1 | ForEach-Object { "$_" }) -join "`n") } catch { $saida = '' }
  $ErrorActionPreference = $antes
  $v = 0; $pasta = ''
  if ($saida -match 'java\.specification\.version = (\d+)(\.(\d+))?') {
    if ($Matches[1] -eq '1') { $v = [int]$Matches[3] } else { $v = [int]$Matches[1] }
  }
  if ($saida -match 'java\.home = ([^\r\n]+)') { $pasta = $Matches[1].Trim() }
  return @{ Versao = $v; Pasta = $pasta }
}

$javaExe = $null
if ($env:JAVA_HOME) {
  $candidato = Join-Path $env:JAVA_HOME 'bin\java.exe'
  if (Test-Path $candidato) {
    $info = InfoJava $candidato
    if ($info.Versao -ge 17) { $javaExe = $candidato }
    else { Write-Host "Aviso: o JAVA_HOME ($env:JAVA_HOME) aponta para um Java antigo (versao $($info.Versao)). Procurando outro..." -ForegroundColor Yellow }
  } else {
    Write-Host "Aviso: o JAVA_HOME ($env:JAVA_HOME) nao tem bin\java.exe. Procurando outro..." -ForegroundColor Yellow
  }
}
if (-not $javaExe) {
  $cmd = Get-Command java -ErrorAction SilentlyContinue
  if ($cmd) {
    $info = InfoJava $cmd.Source
    if ($info.Versao -ge 17) {
      $javaExe = $cmd.Source
      # O mvnw usa o JAVA_HOME: aponta (so nesta janela) para o mesmo Java encontrado.
      if ($info.Pasta) { $env:JAVA_HOME = $info.Pasta }
    }
  }
}
if (-not $javaExe) {
  Write-Host 'Nao encontrei um Java 17 ou mais novo. Instale o JDK 17+ ou ajuste o JAVA_HOME, por exemplo:' -ForegroundColor Red
  Write-Host '  $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"'
  exit 1
}
Write-Host "Java: $javaExe (versao $($info.Versao))"

# 2) Endereco do computador na rede (o celular acessa por ele). Prefere a placa que tem gateway (a do Wi-Fi/rede),
# para nao pegar adaptador virtual (VirtualBox, WSL, Docker).
$ip = $null
try {
  $ip = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.IPv4Address } |
    Select-Object -First 1 -ExpandProperty IPv4Address | Select-Object -First 1 -ExpandProperty IPAddress
} catch { $ip = $null }
if (-not $ip) {
  $ip = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
    Select-Object -First 1 -ExpandProperty IPAddress
}
if (-not $ip) { $ip = '127.0.0.1' }

# 3) Certificado autoassinado (so na primeira vez; apague a pasta certs\ se o IP do computador mudar)
$cert = 'certs\cristalmaster.p12'
if (-not (Test-Path $cert)) {
  New-Item -ItemType Directory -Force -Path certs | Out-Null
  $keytool = Join-Path (Split-Path $javaExe) 'keytool.exe'
  if (-not (Test-Path $keytool)) { $keytool = 'keytool' }
  & $keytool -genkeypair -alias cristalmaster -keyalg RSA -keysize 2048 -validity 825 `
    -storetype PKCS12 -keystore $cert -storepass cristalmaster -dname 'CN=Cristal Master' `
    -ext "SAN=dns:localhost,ip:127.0.0.1,ip:$ip"
  if ($LASTEXITCODE -ne 0) { Write-Host 'Falha ao gerar o certificado.' -ForegroundColor Red; exit 1 }
}

# 4) Programa (.jar): compila se nao existir ou se o pom.xml for mais novo que ele
$jar = 'target\cristalmaster-0.0.1-SNAPSHOT.jar'
$refazer = -not (Test-Path $jar)
if (-not $refazer) { if ((Get-Item $jar).LastWriteTime -lt (Get-Item 'pom.xml').LastWriteTime) { $refazer = $true } }
if ($refazer) {
  Write-Host 'Gerando o programa (primeira vez, pode levar alguns minutos)...'
  & .\mvnw.cmd -q package "-Dmaven.test.skip=true"
  if ($LASTEXITCODE -ne 0) { Write-Host 'O build falhou. Veja o README (secao Problemas comuns).' -ForegroundColor Red; exit 1 }
}

# 4b) Banco H2: o OneDrive costuma travar o arquivo do banco ("The file is locked"). Se o projeto esta dentro do
# OneDrive, o banco passa a ficar em %LOCALAPPDATA%\CristalMaster (a menos que DB_ARQUIVO ja esteja definida).
if (-not $env:DB_ARQUIVO -and $Banco -eq 'h2' -and $PSScriptRoot -like '*OneDrive*') {
  $pastaDb = Join-Path $env:LOCALAPPDATA 'CristalMaster'
  New-Item -ItemType Directory -Force -Path $pastaDb | Out-Null
  $env:DB_ARQUIVO = ((Join-Path $pastaDb 'cristalmaster') -replace '\\', '/')
  Write-Host "Projeto dentro do OneDrive: o banco fica em $pastaDb (fora da sincronizacao)." -ForegroundColor Yellow
}

# 4c) Ja existe um Cristal Master rodando (outra janela, VS Code, Eclipse...)? Ele segura o banco e a porta.
$outros = @()
try {
  $outros = @(Get-CimInstance Win32_Process -Filter "Name='java.exe'" -ErrorAction Stop |
    Where-Object { $_.CommandLine -like '*cristalmaster*' })
} catch { $outros = @() }
if ($outros.Count -gt 0) {
  Write-Host 'Ja existe um Cristal Master rodando e ele esta segurando o banco/a porta:' -ForegroundColor Yellow
  foreach ($o in $outros) { Write-Host "  PID $($o.ProcessId)" }
  $resp = Read-Host 'Encerrar esse(s) programa(s) e continuar? (S/N)'
  if ($resp -match '^[sSyY]') {
    foreach ($o in $outros) { Stop-Process -Id $o.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
  } else {
    Write-Host 'Encerre o outro programa (Ctrl + C na janela dele ou botao Stop da IDE) e rode de novo.' -ForegroundColor Red
    exit 1
  }
}

Write-Host ''
Write-Host "No celular (mesma rede Wi-Fi), abra:  https://$ip`:8443/" -ForegroundColor Green
Write-Host 'No computador:                         https://localhost:8443/'
Write-Host 'Aviso de certificado no celular: toque em Avancado e continue.'
Write-Host 'Se o celular nao abrir, libere a porta (PowerShell como Administrador):'
Write-Host '  New-NetFirewallRule -DisplayName "Cristal Master" -Direction Inbound -Protocol TCP -LocalPort 8443 -Action Allow'
Write-Host 'Para encerrar: Ctrl + C.'
Write-Host ''
$perfis = 'https'
if ($Banco -eq 'mysql') { $perfis = 'https,mysql' }
Write-Host "Banco: $Banco"
& $javaExe -jar $jar "--spring.profiles.active=$perfis"
