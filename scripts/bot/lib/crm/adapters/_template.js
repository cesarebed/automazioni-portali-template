// Data-source adapter TEMPLATE. It is not registered in the registry. To connect
// YOUR company's system (crm-onboarding skill):
//   1. copy this file to adapters/<id>.js (short lowercase id, e.g. "mycrm")
//   2. implement the methods against the system's API (REST, GraphQL, whatever it
//      exposes); credentials go in .env under names you choose (e.g. CRM_BASE_URL,
//      CRM_API_TOKEN) and are read from this.env, NEVER hardcoded
//   3. register the class in lib/crm/index.js and set CRM_ADAPTER=<id> in .env
//   4. verify with: node scripts/bot/bot.js --check
//
// Guidelines validated in production:
//  - attachments ALWAYS as Buffers, never on disk (L-004): the fill uses them in memory
//  - network retries: use fetchWithRetry (lib/http.js), already tuned (idempotent GETs
//    retryable, writes not)
//  - writeback designed for retries: updateRecord/uploadAttachment must be safe to
//    call again without duplicating (see hasAttachmentNamed)
//  - tokens/refresh: if the API uses OAuth, keep the token in memory with its expiry
//    and renew it yourself; the refresh token lives in .env

import { fetchWithRetry } from "../../http.js";

export default class TemplateCrm {
  static id = "_template";

  constructor(env) {
    this.env = env;
    // e.g.: this.base = env.CRM_BASE_URL;
  }

  // Diagnostics for bot --check: one lightweight call that exercises auth + a read.
  async check() {
    return { ok: false, detail: "Adapter not implemented yet (crm-onboarding skill)." };
  }

  // Client search by free-text name or exact identifier (e.g. a tax code, if the
  // business uses one). Returns [{id, label}].
  async findRecord(identifier) {
    throw new Error("_template: findRecord not implemented");
  }

  // Data-source field metadata: portal onboarding uses it to propose mappings.
  // Returns [{name, label}].
  async listFields() {
    throw new Error("_template: listFields not implemented");
  }

  // Fetch the requested fields (list comes from the portal manifest).
  async fetchRecord(recordId, fields) {
    throw new Error("_template: fetchRecord not implemented");
  }

  // FULL record: every available field. This is the fetch used during onboarding,
  // when no manifest exists yet. If the API caps fields per call, fetch in chunks
  // and merge the results.
  async fetchRecordFull(recordId) {
    throw new Error("_template: fetchRecordFull not implemented");
  }

  async listAttachments(recordId) {
    throw new Error("_template: listAttachments not implemented");
  }

  // As a Buffer, never on disk (L-004).
  async downloadAttachment(recordId, attachmentId) {
    throw new Error("_template: downloadAttachment not implemented");
  }

  // Picks attachments by keyword (attachment naming in real systems is human and
  // inconsistent): wanted is a {key: regex} map from the portal manifest.
  // Returns {key: {name, buffer} | null}. Generic implementation provided.
  async pickAttachments(recordId, wanted) {
    const atts = await this.listAttachments(recordId);
    const out = {};
    for (const [key, re] of Object.entries(wanted)) {
      const att = atts.find((a) => re.test(a.name || ""));
      out[key] = att
        ? { name: att.name, buffer: await this.downloadAttachment(recordId, att.id) }
        : null;
    }
    return out;
  }

  // --- Writeback (updating the data source after a case outcome) ---
  // Idempotent: a retry must not redo a step that already succeeded.

  async updateRecord(recordId, fields) {
    throw new Error("_template: updateRecord not implemented");
  }

  async uploadAttachment(recordId, name, buffer, mime = "application/pdf") {
    throw new Error("_template: uploadAttachment not implemented");
  }

  // True if the record already has an attachment with this name (prevents duplicate
  // uploads on retries).
  async hasAttachmentNamed(recordId, name) {
    const atts = await this.listAttachments(recordId);
    return atts.some((a) => (a.name || "") === name);
  }
}
