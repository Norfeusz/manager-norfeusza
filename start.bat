@echo off
title Manager Norfeusza - Launcher
echo ========================================
echo    Manager Norfeusza - Uruchamianie...
echo ========================================
echo.

REM Sprawdź czy Node.js jest zainstalowany
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [BLAD] Node.js nie jest zainstalowany!
    echo Pobierz z https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Sprawdzanie zależności...
cd /d "%~dp0"

REM Sprawdź czy node_modules istnieje w server
if not exist "server\node_modules\" (
    echo [2/4] Instalowanie zależności backendu...
    cd server
    call npm install
    cd ..
) else (
    echo [2/4] Zależności backendu OK
)

REM Sprawdź czy node_modules istnieje w client
if not exist "client\node_modules\" (
    echo [3/4] Instalowanie zależności frontendu...
    cd client
    call npm install
    cd ..
) else (
    echo [3/4] Zależności frontendu OK
)

echo [4/4] Uruchamianie serwerów...
echo.
echo Backend:  http://localhost:4001
echo Frontend: http://localhost:5175
echo.
echo Zamknij to okno aby zatrzymać aplikację
echo.

REM Uruchom backend w nowym oknie
start "Manager Norfeusza - Backend" cmd /k "cd /d "%~dp0server" && npm run dev"

REM Poczekaj 3 sekundy na uruchomienie backendu
timeout /t 3 /nobreak >nul

REM Uruchom frontend w nowym oknie
start "Manager Norfeusza - Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"

REM Poczekaj 5 sekund na uruchomienie frontendu
timeout /t 5 /nobreak >nul

REM Otwórz przeglądarkę
echo Otwieranie przeglądarki...
start http://localhost:5175

echo.
echo ========================================
echo   Aplikacja uruchomiona!
echo ========================================
echo.
echo Backend i Frontend działają w osobnych oknach.
echo Zamknij je aby zatrzymać serwery.
echo.
echo To okno możesz zamknąć.
echo.
pause
