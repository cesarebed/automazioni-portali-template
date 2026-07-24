#!/usr/bin/env node
// Generic multi-portal bot. Single entry point:
//
//   node scripts/bot/bot.js --check
//       Environment diagnostics: .env, data source (CRM adapter), Chrome CDP. Run it
//       after setting up a new machine and as the first step of any diagnosis.
//
//   node scripts/bot/bot.js "<client | id>" --portal <id> [--flow <id>] [--dry-run] [--send]
//       Works a case on the given portal. --dry-run: fill without saving anything.
//       --send: submit after filling, BUT only if the plugin's verify passes and the
//       portal has autoSubmit=true (L-006); otherwise it stops before.
//
// The bot is the arm. The brain (natural-language routing, ledger, learnings, operator
// output) lives in the case-assistant skill. Do not run the bot by hand except for
// development or diagnosis.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnv, REPO_ROOT } from "./lib/env.js";
import { getCrm } from "./lib/crm/index.js";
import { connectCdp } from "./lib/cdp.js";
import { getPortal, listPortals } from "./lib/portals/index.js";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};

function usage() {
  console.log(`Usage:
  node scripts/bot/bot.js --check
  node scripts/bot/bot.js "<client | id>" --portal <id> [--flow <id>] [--dry-run] [--send]

Onboarded portals: ${listPortals().map((m) => m.id).join(", ") || "(none: see the portal-onboarding skill)"}`);
}

async function check() {
  const env = loadEnv();
  let ok = true;
  const row = (passed, msg) => {
    if (!passed) ok = false;
    console.log(`${passed ? "OK " : "KO "} ${msg}`);
  };

  row(existsSync(join(REPO_ROOT, ".env")), ".env present (otherwise: cp .env.example .env)");

  try {
    const crm = getCrm(env);
    const c = crm.check ? await crm.check() : { ok: true, detail: "adapter has no check()" };
    row(c.ok, `data source (${env.CRM_ADAPTER}): ${c.detail}`);
  } catch (e) {
    row(false, `data source: ${e.message}`);
  }

  const cdpUrl = env.CDP_URL || "http://127.0.0.1:9222";
  try {
    const r = await fetch(`${cdpUrl}/json/version`, { signal: AbortSignal.timeout(2000) });
    const v = await r.json();
    row(r.ok, `Chrome CDP up at ${cdpUrl} (${v.Browser || "?"})`);
  } catch {
    row(false, `Chrome CDP not reachable at ${cdpUrl} (start scripts/chrome-cdp/launch-chrome-cdp.sh)`);
  }

  const portals = listPortals();
  console.log(`--  onboarded portals: ${portals.length ? portals.map((m) => m.id).join(", ") : "none (start with the portal-onboarding skill)"}`);
  process.exit(ok ? 0 : 1);
}

async function run() {
  const client = args.find((a) => !a.startsWith("--") && a !== opt("--portal") && a !== opt("--flow"));
  const portalId = opt("--portal");
  if (!client || !portalId) {
    usage();
    process.exit(1);
  }

  const portal = getPortal(portalId); // throws with a clear message if unknown
  const env = loadEnv();
  const crm = getCrm(env);

  const manifestPath = join(REPO_ROOT, "data", "manifests", `${portalId}.json`);
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : null;
  if (!manifest) {
    console.error(`Missing manifest: data/manifests/${portalId}.json (produced during onboarding).`);
    process.exit(2);
  }

  const found = await crm.findRecord(client);
  if (found.length === 0) {
    console.error(`No client found in the data source for "${client}".`);
    process.exit(2);
  }
  if (found.length > 1) {
    console.error(`Multiple clients found for "${client}": ${found.map((t) => t.label).join("; ")}. Disambiguate with an exact identifier.`);
    process.exit(2);
  }
  const fields = manifest.fields.filter((f) => f.source === "crm").map((f) => f.crm_field);
  const record = await crm.fetchRecord(found[0].id, [...new Set(fields)]);

  // Preflight: the browser opens only if the DATA is in order (L-002).
  const pf = await portal.preflight(record, manifest);
  if (!pf.ok) {
    console.error(`Preflight failed for ${found[0].label}:`);
    for (const m of pf.missing) console.error(`  MISSING: ${m}`);
    for (const n of pf.notes) console.error(`  NOTE: ${n}`);
    process.exit(2);
  }

  const wanted = Object.fromEntries(
    (manifest.required_documents || []).map((d) => [d.key, new RegExp(d.match, "i")])
  );
  const docs = await crm.pickAttachments(found[0].id, wanted);

  const { browser, page } = await connectCdp(env);
  const ctx = { page, env, crm, record, docs, manifest, dry: flag("--dry-run") };
  try {
    await portal.fill(ctx);
    if (ctx.dry) {
      console.log("Dry run: simulated fill completed, nothing saved.");
      return;
    }
    const v = await portal.verify(ctx);
    if (!v.ok) {
      console.error(`Verify failed: ${v.detail}. Not submitting.`);
      process.exit(3);
    }
    if (flag("--send") && portal.meta.autoSubmit) {
      await portal.submit(ctx);
      await portal.writeback(ctx);
      console.log("Case submitted and data-source writeback done.");
    } else {
      console.log("Fill completed and verified. Submission is NOT automatic for this portal: a human must confirm (L-006).");
    }
  } finally {
    // The browser is NOT closed: it is the operator's dedicated Chrome (live
    // sessions). Only the CDP connection is dropped.
    await browser.close().catch(() => {});
  }
}

if (flag("--help") || flag("-h") || args.length === 0) {
  usage();
  process.exit(0);
}
(flag("--check") ? check() : run()).catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
