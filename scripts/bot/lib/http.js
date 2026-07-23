// fetch con retry mirato, per gli adapter della fonte dati. Politica collaudata in
// produzione: ritenta sui BLIP DI RETE (errori lanciati: la richiesta non e' andata a
// segno, quindi ripeterla e' sicuro anche per le scritture) e sulle risposte
// transitorie 429/5xx SOLO per le GET (idempotenti). Su una scrittura che ha gia'
// ricevuto una risposta 5xx NON si ritenta ciecamente: potrebbe essere andata a buon
// fine lato server. Backoff esponenziale ~0.6s, 1.2s, 2.4s.

export async function fetchWithRetry(url, opts = {}) {
  const isGet = (opts.method || "GET").toUpperCase() === "GET";
  const NET_ERR = /fetch failed|ETIMEDOUT|ECONNRESET|ENOTFOUND|EAI_AGAIN|UND_ERR|socket hang up|network|timeout/i;
  const RETRYABLE = new Set([429, 500, 502, 503, 504]);
  const tries = 4;
  let lastErr;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const r = await fetch(url, opts);
      if (RETRYABLE.has(r.status) && isGet && attempt < tries) {
        await r.arrayBuffer().catch(() => {});
        await new Promise((res) => setTimeout(res, 600 * 2 ** (attempt - 1)));
        continue;
      }
      return { status: r.status, buffer: Buffer.from(await r.arrayBuffer()) };
    } catch (e) {
      lastErr = e;
      const msg = String(e?.cause?.code || e?.cause?.message || e?.message || e);
      if (!NET_ERR.test(msg) || attempt >= tries) throw e;
      await new Promise((res) => setTimeout(res, 600 * 2 ** (attempt - 1)));
    }
  }
  throw lastErr;
}
