#!/usr/bin/env pwsh
# Manager Norfa - Launcher PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Manager Norfa - Uruchamianie...    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Sprawdź czy Node.js jest zainstalowany
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[BŁĄD] Node.js nie jest zainstalowany!" -ForegroundColor Red
    Write-Host "Pobierz z https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Naciśnij Enter aby zakończyć"
    exit 1
}

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "[1/4] Sprawdzanie zależności..." -ForegroundColor Yellow

# Sprawdź i zainstaluj zależności backendu
if (-not (Test-Path "server\node_modules")) {
    Write-Host "[2/4] Instalowanie zależności backendu..." -ForegroundColor Yellow
    Set-Location server
    npm install
    Set-Location ..
}
else {
    Write-Host "[2/4] Zależności backendu OK" -ForegroundColor Green
}

# Sprawdź i zainstaluj zależności frontendu
if (-not (Test-Path "client\node_modules")) {
    Write-Host "[3/4] Instalowanie zależności frontendu..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
}
else {
    Write-Host "[3/4] Zależności frontendu OK" -ForegroundColor Green
}

Write-Host "[4/4] Uruchamianie serwerów..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend:  " -NoNewline -ForegroundColor White
Write-Host "http://localhost:4001" -ForegroundColor Cyan
Write-Host "Frontend: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5175" -ForegroundColor Cyan
Write-Host ""

# Uruchom backend w nowym oknie PowerShell
$backendPath = Join-Path $scriptPath "server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev" -WindowStyle Normal

# Poczekaj na uruchomienie backendu
Write-Host "Oczekiwanie na backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Uruchom frontend w nowym oknie PowerShell
$frontendPath = Join-Path $scriptPath "client"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

# Poczekaj na uruchomienie frontendu
Write-Host "Oczekiwanie na frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Otwórz przeglądarkę
Write-Host "Otwieranie przeglądarki..." -ForegroundColor Yellow
Start-Process "http://localhost:5175"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Aplikacja uruchomiona!            " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend i Frontend działają w osobnych oknach." -ForegroundColor White
Write-Host "Zamknij je aby zatrzymać serwery." -ForegroundColor White
Write-Host ""
Write-Host "To okno możesz zamknąć." -ForegroundColor Gray
Write-Host ""

Read-Host "Naciśnij Enter aby zakończyć"
