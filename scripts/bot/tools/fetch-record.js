#!/usr/bin/env node
// Fetches one record from the data source (requires a configured adapter, see the
// crm-onboarding skill). Used during portal onboarding to download the FULL record
// and propose mappings, and during diagnosis to see what is actually in the system.
//
//   node scripts/bot/tools/fetch-record.js "John Smith"
//   node scripts/bot/tools/fetch-record.js "<identifier>" --attachments
//   node scripts/bot/tools/fetch-record.js "John Smith" --out
//
// By default it prints the non-empty fields. --attachments lists the attachments.
// --out saves the full record to runtime/fetch/<id>.json (gitignored, L-004: delete
// it when done). Never commit this data.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnv, REPO_ROOT } from "../lib/env.js";
import { getCrm } from "../lib/crm/index.js";

const args = process.argv.slice(2);
const identifier = args.find((a) => !a.startsWith("--"));
if (!identifier) {
  console.error('Usage: node scripts/bot/tools/fetch-record.js "<name | identifier>" [--attachments] [--out]');
  process.exit(1);
}

let crm;
try {
  crm = getCrm(loadEnv());
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const found = await crm.findRecord(identifier);
if (found.length === 0) {
  console.error(`No record found for "${identifier}".`);
  process.exit(2);
}
if (found.length > 1) {
  console.error(`Multiple records found: ${found.map((t) => t.label).join("; ")}`);
  console.error("Disambiguate with an exact identifier. Using the first one.");
}
const { id, label } = found[0];
console.log(`Record: ${label} (${id})\n`);

const record = await crm.fetchRecordFull(id);
const filled = Object.entries(record).filter(
  ([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
);
console.log(`Non-empty fields (${filled.length}):`);
for (const [k, v] of filled) {
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  console.log(`  ${k} = ${s.length > 120 ? s.slice(0, 120) + "..." : s}`);
}

if (args.includes("--attachments")) {
  const atts = await crm.listAttachments(id);
  console.log(`\nAttachments (${atts.length}):`);
  for (const a of atts) console.log(`  ${a.name} (${a.size ?? "?"} bytes, id ${a.id})`);
}

if (args.includes("--out")) {
  const dir = join(REPO_ROOT, "runtime", "fetch");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${id}.json`);
  writeFileSync(path, JSON.stringify(record, null, 2));
  console.log(`\nFull record saved to ${path} (gitignored; delete when done).`);
}
