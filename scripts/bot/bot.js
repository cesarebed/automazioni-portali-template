#!/usr/bin/env node
// Bot generico multi-portale. Punto di ingresso unico:
//
//   node scripts/bot/bot.js --check
//       Diagnosi ambiente: .env, fonte dati (adapter CRM), Chrome CDP. Da lanciare
//       dopo il setup di una macchina nuova e come primo passo di ogni diagnosi.
//
//   node scripts/bot/bot.js "<cliente | id>" --portale <id> [--flusso <id>] [--dry-run] [--send]
//       Lavora una pratica sul portale indicato. --dry-run: compila senza salvare
//       nulla. --send: inoltra a fine compilazione, MA solo se la verifica del plugin
//       e' ok e il portale ha inoltroAutomatico=true (L-006); altrimenti si ferma prima.
//
// Il bot e' il braccio: il cervello (routing dal linguaggio naturale, ledger,
// learnings, output per l'operatore) sta nella skill assistente-pratiche. Non
// lanciarlo a mano se non per sviluppo/diagnosi.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnv, REPO_ROOT } from "./lib/env.js";
import { getCrm } from "./lib/crm/index.js";
import { connectCdp } from "./lib/cdp.js";
import { getPortale, listPortali } from "./lib/portali/index.js";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};

function usage() {
  console.log(`Uso:
  node scripts/bot/bot.js --check
  node scripts/bot/bot.js "<cliente | id>" --portale <id> [--flusso <id>] [--dry-run] [--send]

Portali onboardati: ${listPortali().map((m) => m.id).join(", ") || "(nessuno: vedi skill onboarding-portale)"}`);
}

async function check() {
  const env = loadEnv();
  let ok = true;
  const riga = (esito, msg) => {
    if (!esito) ok = false;
    console.log(`${esito ? "OK " : "KO "} ${msg}`);
  };

  riga(existsSync(join(REPO_ROOT, ".env")), ".env presente (altrimenti: cp .env.example .env)");

  try {
    const crm = getCrm(env);
    const c = crm.check ? await crm.check() : { ok: true, dettaglio: "adapter senza check()" };
    riga(c.ok, `fonte dati (${env.CRM_ADAPTER}): ${c.dettaglio}`);
  } catch (e) {
    riga(false, `fonte dati: ${e.message}`);
  }

  const cdpUrl = env.CDP_URL || "http://127.0.0.1:9222";
  try {
    const r = await fetch(`${cdpUrl}/json/version`, { signal: AbortSignal.timeout(2000) });
    const v = await r.json();
    riga(r.ok, `Chrome CDP attivo su ${cdpUrl} (${v.Browser || "?"})`);
  } catch {
    riga(false, `Chrome CDP non raggiungibile su ${cdpUrl} (avvia scripts/chrome-cdp/launch-chrome-cdp.sh)`);
  }

  const portali = listPortali();
  console.log(`--  portali onboardati: ${portali.length ? portali.map((m) => m.id).join(", ") : "nessuno (si parte con la skill onboarding-portale)"}`);
  process.exit(ok ? 0 : 1);
}

async function run() {
  const cliente = args.find((a) => !a.startsWith("--") && a !== opt("--portale") && a !== opt("--flusso"));
  const portaleId = opt("--portale");
  if (!cliente || !portaleId) {
    usage();
    process.exit(1);
  }

  const portale = getPortale(portaleId); // lancia con messaggio chiaro se sconosciuto
  const env = loadEnv();
  const crm = getCrm(env);

  const manifestPath = join(REPO_ROOT, "data", "manifests", `${portaleId}.json`);
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : null;
  if (!manifest) {
    console.error(`Manifest mancante: data/manifests/${portaleId}.json (si produce in onboarding).`);
    process.exit(2);
  }

  const trovati = await crm.findRecord(cliente);
  if (trovati.length === 0) {
    console.error(`Nessun cliente trovato nella fonte dati per "${cliente}".`);
    process.exit(2);
  }
  if (trovati.length > 1) {
    console.error(`Piu' clienti trovati per "${cliente}": ${trovati.map((t) => t.label).join("; ")}. Disambigua con un identificativo esatto.`);
    process.exit(2);
  }
  const fields = manifest.campi.filter((c) => c.fonte === "crm").map((c) => c.campo_crm);
  const record = await crm.fetchRecord(trovati[0].id, [...new Set(fields)]);

  // Preflight: si apre il browser solo se i DATI sono a posto (L-002).
  const pf = await portale.preflight(record, manifest);
  if (!pf.ok) {
    console.error(`Preflight KO per ${trovati[0].label}:`);
    for (const m of pf.mancanti) console.error(`  MANCA: ${m}`);
    for (const n of pf.note) console.error(`  NOTA: ${n}`);
    process.exit(2);
  }

  const wanted = Object.fromEntries(
    (manifest.documenti_richiesti || []).map((d) => [d.chiave, new RegExp(d.match, "i")])
  );
  const docs = await crm.pickAttachments(trovati[0].id, wanted);

  const { browser, page } = await connectCdp(env);
  const ctx = { page, env, crm, record, docs, manifest, dry: flag("--dry-run") };
  try {
    await portale.compila(ctx);
    if (ctx.dry) {
      console.log("Dry-run: compilazione simulata completata, nessun salvataggio.");
      return;
    }
    const v = await portale.verifica(ctx);
    if (!v.ok) {
      console.error(`Verifica KO: ${v.dettaglio}. Non si inoltra.`);
      process.exit(3);
    }
    if (flag("--send") && portale.meta.inoltroAutomatico) {
      await portale.inoltra(ctx);
      await portale.writeback(ctx);
      console.log("Pratica inoltrata e writeback sulla fonte dati fatto.");
    } else {
      console.log("Compilazione ok e verificata. Inoltro NON automatico per questo portale: serve conferma umana (L-006).");
    }
  } finally {
    // Il browser NON si chiude: e' il Chrome dedicato dell'operatore (sessioni vive).
    // Si stacca solo la connessione CDP.
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
