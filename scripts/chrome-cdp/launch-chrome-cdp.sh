#!/usr/bin/env bash
# Starts (or reuses) a Chrome with a dedicated automation profile + an open CDP port.
# The profile is SEPARATE from the user's personal one (never close the user's normal
# Chrome to "free" the port: not needed here, the profile is a different one).
#
# Usage:
#   scripts/chrome-cdp/launch-chrome-cdp.sh          # port 9222 by default
#   CDP_PORT=9333 scripts/chrome-cdp/launch-chrome-cdp.sh
#
# The profile persists in ~/.portal-automation/chrome-profile: portal login sessions
# (including 2FA) are kept between runs.

set -euo pipefail

PORT="${CDP_PORT:-9222}"
PROFILE_DIR="${CDP_PROFILE_DIR:-$HOME/.portal-automation/chrome-profile}"
mkdir -p "$PROFILE_DIR"

# The user's stock Google Chrome does NOT work here: recent builds lack some CDP
# commands Playwright uses in connectOverCDP (observed live:
# "Browser.setDownloadBehavior ... not supported", see L-003). We use the
# Chromium/"Chrome for Testing" that Playwright itself downloads: same look for the
# user, guaranteed CDP compatibility.
if [ -z "${CHROME_BIN:-}" ]; then
  CHROME_BIN="$(cd "$(dirname "$0")/../bot" && node -e 'console.log(require("playwright").chromium.executablePath())' 2>/dev/null)"
fi
if [ -z "${CHROME_BIN:-}" ] || [ ! -x "$CHROME_BIN" ]; then
  echo "ERROR: Playwright's Chromium not found. Run first:" >&2
  echo "  cd scripts/bot && npm install && npx playwright install chromium" >&2
  echo "Or set CHROME_BIN=/path/to/your/chrome (must support all CDP APIs Playwright uses)." >&2
  exit 1
fi

# If the port already responds (this profile's Chrome is already up), do not
# relaunch: a second process on the same --user-data-dir would fail or open a window
# without the debug port.
if curl -s -m 1 "http://127.0.0.1:${PORT}/json/version" >/dev/null 2>&1; then
  echo "Chrome CDP already up on port ${PORT} (profile: ${PROFILE_DIR})."
  exit 0
fi

echo "Starting Chrome (dedicated profile) with CDP on port ${PORT}..."
echo "Profile: ${PROFILE_DIR}"
"$CHROME_BIN" \
  --remote-debugging-port="${PORT}" \
  --user-data-dir="${PROFILE_DIR}" \
  --no-first-run --no-default-browser-check \
  "about:blank" \
  >/tmp/chrome-cdp-${PORT}.log 2>&1 &

# Wait for the port to respond (usually <2s)
for i in $(seq 1 30); do
  if curl -s -m 1 "http://127.0.0.1:${PORT}/json/version" >/dev/null 2>&1; then
    echo "Ready: http://127.0.0.1:${PORT}"
    exit 0
  fi
  sleep 0.3
done
echo "ERROR: port ${PORT} did not respond within the timeout. Log: /tmp/chrome-cdp-${PORT}.log" >&2
exit 1
