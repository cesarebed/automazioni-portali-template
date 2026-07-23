// Lettura del .env alla radice del repo (piu' le variabili d'ambiente del processo).
// I segreti vivono SOLO qui: mai committati, mai loggati.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export function loadEnv() {
  const env = { ...process.env };
  const envPath = join(REPO_ROOT, ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const t = line.trim();
      if (t && !t.startsWith("#") && t.includes("=")) {
        const i = t.indexOf("=");
        env[t.slice(0, i)] = t.slice(i + 1);
      }
    }
  }
  return env;
}
