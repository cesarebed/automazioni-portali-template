#!/usr/bin/env bash
# Avvia (o riusa) un Chrome con profilo dedicato all'automazione + porta CDP aperta.
# Profilo SEPARATO da quello personale (mai chiudere il Chrome normale dell'utente per
# "liberare" la porta: qui non serve, il profilo e' un altro).
#
# Uso:
#   scripts/chrome-cdp/launch-chrome-cdp.sh          # porta 9222 di default
#   CDP_PORT=9333 scripts/chrome-cdp/launch-chrome-cdp.sh
#
# Il profilo persiste in ~/.automazioni-portali/chrome-profile: le sessioni di login
# dei portali (2FA compreso) restano salvate tra un run e l'altro.

set -euo pipefail

PORT="${CDP_PORT:-9222}"
PROFILE_DIR="${CDP_PROFILE_DIR:-$HOME/.automazioni-portali/chrome-profile}"
mkdir -p "$PROFILE_DIR"

# Il Google Chrome "normale" dell'utente NON va bene qui: build recenti mancano di
# alcuni comandi CDP che Playwright usa in connectOverCDP (verificato sul campo:
# "Browser.setDownloadBehavior ... not supported", vedi L-003). Si usa il
# Chromium/"Chrome for Testing" che Playwright stesso scarica: stesso look per
# l'utente, compatibilita' CDP garantita.
if [ -z "${CHROME_BIN:-}" ]; then
  CHROME_BIN="$(cd "$(dirname "$0")/../bot" && node -e 'console.log(require("playwright").chromium.executablePath())' 2>/dev/null)"
fi
if [ -z "${CHROME_BIN:-}" ] || [ ! -x "$CHROME_BIN" ]; then
  echo "ERRORE: Chromium di Playwright non trovato. Esegui prima:" >&2
  echo "  cd scripts/bot && npm install && npx playwright install chromium" >&2
  echo "Oppure imposta CHROME_BIN=/path/al/tuo/chrome (deve supportare tutte le API CDP usate da Playwright)." >&2
  exit 1
fi

# Se la porta risponde gia' (Chrome di questo profilo e' gia' su), non rilanciare:
# un secondo processo sullo stesso --user-data-dir fallirebbe o aprirebbe una finestra
# senza la porta di debug.
if curl -s -m 1 "http://127.0.0.1:${PORT}/json/version" >/dev/null 2>&1; then
  echo "Chrome CDP gia' attivo su porta ${PORT} (profilo: ${PROFILE_DIR})."
  exit 0
fi

echo "Avvio Chrome (profilo dedicato) con CDP su porta ${PORT}..."
echo "Profilo: ${PROFILE_DIR}"
"$CHROME_BIN" \
  --remote-debugging-port="${PORT}" \
  --user-data-dir="${PROFILE_DIR}" \
  --no-first-run --no-default-browser-check \
  "about:blank" \
  >/tmp/chrome-cdp-${PORT}.log 2>&1 &

# Attendi che la porta risponda (di norma <2s)
for i in $(seq 1 30); do
  if curl -s -m 1 "http://127.0.0.1:${PORT}/json/version" >/dev/null 2>&1; then
    echo "Pronto: http://127.0.0.1:${PORT}"
    exit 0
  fi
  sleep 0.3
done
echo "ERRORE: la porta ${PORT} non ha risposto entro il timeout. Log: /tmp/chrome-cdp-${PORT}.log" >&2
exit 1
