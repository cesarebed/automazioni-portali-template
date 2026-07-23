// Aggancio al Chrome dedicato via CDP (scripts/chrome-cdp/launch-chrome-cdp.sh).
// Il bot NON apre mai un browser suo: si attacca al profilo persistente dove
// l'operatore ha gia' fatto il login dei portali (L-001). Vedi L-003 sul perche'
// serve il Chromium di Playwright e non il Chrome stock.

import { chromium } from "playwright";

export async function connectCdp(env) {
  const url = env.CDP_URL || "http://127.0.0.1:9222";
  let browser;
  try {
    browser = await chromium.connectOverCDP(url);
  } catch (e) {
    throw new Error(
      `Chrome CDP non raggiungibile su ${url}. Avvia prima scripts/chrome-cdp/launch-chrome-cdp.sh ` +
      `(errore: ${e.message})`
    );
  }
  const context = browser.contexts()[0] || (await browser.newContext());
  const page = context.pages().find((p) => !p.isClosed()) || (await context.newPage());
  return { browser, context, page };
}
