@echo off
REM Starts (or reuses) a Chromium with a dedicated automation profile + an open CDP
REM port. Windows equivalent of launch-chrome-cdp.sh: uses the Chromium/"Chrome for
REM Testing" that Playwright downloads (stock Google Chrome does NOT work with
REM connectOverCDP, see L-003). Usage: scripts\chrome-cdp\launch-chrome-cdp.cmd

setlocal enabledelayedexpansion
if not defined CDP_PORT set CDP_PORT=9222
if not defined CDP_PROFILE_DIR set CDP_PROFILE_DIR=%USERPROFILE%\.portal-automation\chrome-profile
mkdir "%CDP_PROFILE_DIR%" 2>nul

REM Playwright's Chromium (override with CHROME_BIN if a specific browser is needed)
if not defined CHROME_BIN (
  pushd "%~dp0..\bot"
  for /f "usebackq delims=" %%p in (`node -e "console.log(require('playwright').chromium.executablePath())"`) do set CHROME_BIN=%%p
  popd
)
if not exist "%CHROME_BIN%" (
  echo ERROR: Playwright's Chromium not found. Run first:
  echo   cd scripts\bot ^&^& npm install ^&^& npx playwright install chromium
  echo Or set CHROME_BIN to a browser compatible with Playwright's CDP APIs.
  exit /b 1
)

REM If the port already responds, this profile's Chrome is up: do not relaunch.
curl -s -m 1 "http://127.0.0.1:%CDP_PORT%/json/version" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo Chrome CDP already up on port %CDP_PORT% ^(profile: %CDP_PROFILE_DIR%^).
  exit /b 0
)

echo Starting Chromium ^(dedicated profile^) with CDP on port %CDP_PORT%...
echo Profile: %CDP_PROFILE_DIR%
start "" "%CHROME_BIN%" --remote-debugging-port=%CDP_PORT% --user-data-dir="%CDP_PROFILE_DIR%" --no-first-run --no-default-browser-check "about:blank"

REM Wait for the port to respond (usually <2s)
for /l %%i in (1,1,30) do (
  curl -s -m 1 "http://127.0.0.1:%CDP_PORT%/json/version" >nul 2>&1
  if !ERRORLEVEL! EQU 0 (
    echo Ready: http://127.0.0.1:%CDP_PORT%
    exit /b 0
  )
  ping -n 1 -w 300 127.0.0.1 >nul
)
echo ERROR: port %CDP_PORT% did not respond within the timeout.
exit /b 1
