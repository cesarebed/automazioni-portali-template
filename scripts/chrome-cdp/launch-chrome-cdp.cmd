@echo off
REM Avvia (o riusa) un Chromium con profilo dedicato all'automazione + porta CDP aperta.
REM Equivalente Windows di launch-chrome-cdp.sh: usa il Chromium/"Chrome for Testing"
REM che Playwright scarica (il Google Chrome stock NON va bene con connectOverCDP,
REM verificato sul campo, vedi L-003). Uso: scripts\chrome-cdp\launch-chrome-cdp.cmd

setlocal enabledelayedexpansion
if not defined CDP_PORT set CDP_PORT=9222
if not defined CDP_PROFILE_DIR set CDP_PROFILE_DIR=%USERPROFILE%\.automazioni-portali\chrome-profile
mkdir "%CDP_PROFILE_DIR%" 2>nul

REM Chromium di Playwright (override con CHROME_BIN se serve un browser specifico)
if not defined CHROME_BIN (
  pushd "%~dp0..\bot"
  for /f "usebackq delims=" %%p in (`node -e "console.log(require('playwright').chromium.executablePath())"`) do set CHROME_BIN=%%p
  popd
)
if not exist "%CHROME_BIN%" (
  echo ERRORE: Chromium di Playwright non trovato. Esegui prima:
  echo   cd scripts\bot ^&^& npm install ^&^& npx playwright install chromium
  echo Oppure imposta CHROME_BIN a un browser compatibile con le API CDP di Playwright.
  exit /b 1
)

REM Se la porta risponde gia', il Chrome del profilo e' su: non rilanciare.
curl -s -m 1 "http://127.0.0.1:%CDP_PORT%/json/version" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo Chrome CDP gia' attivo su porta %CDP_PORT% ^(profilo: %CDP_PROFILE_DIR%^).
  exit /b 0
)

echo Avvio Chromium ^(profilo dedicato^) con CDP su porta %CDP_PORT%...
echo Profilo: %CDP_PROFILE_DIR%
start "" "%CHROME_BIN%" --remote-debugging-port=%CDP_PORT% --user-data-dir="%CDP_PROFILE_DIR%" --no-first-run --no-default-browser-check "about:blank"

REM Attendi che la porta risponda (di norma <2s)
for /l %%i in (1,1,30) do (
  curl -s -m 1 "http://127.0.0.1:%CDP_PORT%/json/version" >nul 2>&1
  if !ERRORLEVEL! EQU 0 (
    echo Pronto: http://127.0.0.1:%CDP_PORT%
    exit /b 0
  )
  ping -n 1 -w 300 127.0.0.1 >nul
)
echo ERRORE: la porta %CDP_PORT% non ha risposto entro il timeout.
exit /b 1
