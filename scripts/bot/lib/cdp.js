// Attaches to the dedicated Chrome over CDP (scripts/chrome-cdp/launch-chrome-cdp.sh).
// The bot NEVER launches its own browser: it attaches to the persistent profile where
// the operator has already logged in to the portals (L-001). See L-003 on why this
// needs Playwright's Chromium rather than stock Chrome.

import { chromium } from "playwright";

export async function connectCdp(env) {
  const url = env.CDP_URL || "http://127.0.0.1:9222";
  let browser;
  try {
    browser = await chromium.connectOverCDP(url);
  } catch (e) {
    throw new Error(
      `Chrome CDP not reachable at ${url}. Start scripts/chrome-cdp/launch-chrome-cdp.sh first ` +
      `(error: ${e.message})`
    );
  }
  const context = browser.contexts()[0] || (await browser.newContext());
  const page = context.pages().find((p) => !p.isClosed()) || (await context.newPage());
  return { browser, context, page };
}
