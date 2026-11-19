# Inicia o Cristal Master para uso no celular (HTTPS, necessario para a camera ler QR Code).
# Uso: duplo clique em iniciar.bat  ou  powershell -ExecutionPolicy Bypass -File iniciar.ps1
# Antes: MySQL ligado e, se o root tiver senha, defina DB_SENHA (ou use o .env). Veja o README.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# 1) Java 17+
$javaExe = 'java'
if ($env:JAVA_HOME) { $javaExe = Join-Path $env:JAVA_HOME 'bin\java.exe' }
try { $saida = (& $javaExe -version 2>&1 | Out-String) } catch { $saida = '' }
if ($saida -match 'version "(\d+)') { $versao = [int]$Matches[1] } else { $versao = 0 }
if ($versao -lt 17) {
  Write-Host "Java 17 ou mais novo e necessario (encontrado: $versao). Instale o JDK 17+ ou ajuste o JAVA_HOME:" -ForegroundColor Red
  Write-Host '  $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"'
  exit 1
}

# 2) Endereco do computador na rede (o celular acessa por ele)
$ip = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
  Select-Object -First 1 -ExpandProperty IPAddress
if (-not $ip) { $ip = '127.0.0.1' }

# 3) Certificado autoassinado (so na primeira vez; apague a pasta certs\ se o IP do computador mudar)
$cert = 'certs\cristalmaster.p12'
if (-not (Test-Path $cert)) {
  New-Item -ItemType Directory -Force -Path certs | Out-Null
  $keytool = 'keytool'
  if ($env:JAVA_HOME) { $keytool = Join-Path $env:JAVA_HOME 'bin\keytool.exe' }
  & $keytool -genkeypair -alias cristalmaster -keyalg RSA -keysize 2048 -validity 825 `
    -storetype PKCS12 -keystore $cert -storepass cristalmaster -dname 'CN=Cristal Master' `
    -ext "SAN=dns:localhost,ip:127.0.0.1,ip:$ip"
  if ($LASTEXITCODE -ne 0) { Write-Host 'Falha ao gerar o certificado.' -ForegroundColor Red; exit 1 }
}

# 4) Programa (.jar): compila so se ainda nao existir
$jar = 'target\cristalmaster-0.0.1-SNAPSHOT.jar'
if (-not (Test-Path $jar)) {
  Write-Host 'Gerando o programa (primeira vez, pode levar alguns minutos)...'
  & .\mvnw.cmd -q package -DskipTests
  if ($LASTEXITCODE -ne 0) { Write-Host 'O build falhou. Veja o README (secao Problemas comuns).' -ForegroundColor Red; exit 1 }
}

Write-Host ''
Write-Host "No celular (mesma rede Wi-Fi), abra:  https://$ip`:8443/" -ForegroundColor Green
Write-Host 'No computador:                         https://localhost:8443/'
Write-Host 'Aviso de certificado no celular: toque em Avancado e continue.'
Write-Host 'Se o celular nao abrir, libere a porta (PowerShell como Administrador):'
Write-Host '  New-NetFirewallRule -DisplayName "Cristal Master" -Direction Inbound -Protocol TCP -LocalPort 8443 -Action Allow'
Write-Host 'Para encerrar: Ctrl + C.'
Write-Host ''
& $javaExe -jar $jar --spring.profiles.active=https
