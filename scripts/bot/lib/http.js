// fetch with targeted retries, for data-source adapters. Policy validated in
// production: retry on NETWORK BLIPS (thrown errors: the request never landed, so
// repeating it is safe even for writes) and on transient 429/5xx responses ONLY for
// GETs (idempotent). A write that already got a 5xx response is NOT retried blindly:
// it may have succeeded server-side. Exponential backoff ~0.6s, 1.2s, 2.4s.

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
