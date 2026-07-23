#!/usr/bin/env node
// Estrazione di un record dalla fonte dati (serve un adapter configurato, vedi skill
// onboarding-crm). Usato in onboarding portale per scaricare il record COMPLETO e
// proporre le mappature, e in diagnosi per vedere cosa c'e' davvero nel gestionale.
//
//   node scripts/bot/tools/fetch-record.js "Mario Rossi"
//   node scripts/bot/tools/fetch-record.js "<identificativo>" --allegati
//   node scripts/bot/tools/fetch-record.js "Mario Rossi" --out
//
// Di default stampa a video i campi NON vuoti. --allegati elenca gli allegati.
// --out salva il record completo in runtime/fetch/<id>.json (gitignorato, L-004:
// da cancellare a lavoro finito). Mai committare questi dati.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnv, REPO_ROOT } from "../lib/env.js";
import { getCrm } from "../lib/crm/index.js";

const args = process.argv.slice(2);
const identifier = args.find((a) => !a.startsWith("--"));
if (!identifier) {
  console.error('Uso: node scripts/bot/tools/fetch-record.js "<nome | identificativo>" [--allegati] [--out]');
  process.exit(1);
}

let crm;
try {
  crm = getCrm(loadEnv());
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const trovati = await crm.findRecord(identifier);
if (trovati.length === 0) {
  console.error(`Nessun record trovato per "${identifier}".`);
  process.exit(2);
}
if (trovati.length > 1) {
  console.error(`Piu' record trovati: ${trovati.map((t) => t.label).join("; ")}`);
  console.error("Disambigua con un identificativo esatto. Uso il primo.");
}
const { id, label } = trovati[0];
console.log(`Record: ${label} (${id})\n`);

const record = await crm.fetchRecordFull(id);
const pieni = Object.entries(record).filter(
  ([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
);
console.log(`Campi non vuoti (${pieni.length}):`);
for (const [k, v] of pieni) {
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  console.log(`  ${k} = ${s.length > 120 ? s.slice(0, 120) + "..." : s}`);
}

if (args.includes("--allegati")) {
  const atts = await crm.listAttachments(id);
  console.log(`\nAllegati (${atts.length}):`);
  for (const a of atts) console.log(`  ${a.nome} (${a.size ?? "?"} byte, id ${a.id})`);
}

if (args.includes("--out")) {
  const dir = join(REPO_ROOT, "runtime", "fetch");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${id}.json`);
  writeFileSync(path, JSON.stringify(record, null, 2));
  console.log(`\nRecord completo salvato in ${path} (gitignorato; cancellare a lavoro finito).`);
}
