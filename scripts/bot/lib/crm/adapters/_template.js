// TEMPLATE di adapter della fonte dati — NON e' registrato nel registro. Per collegare
// il gestionale della TUA azienda (skill onboarding-crm):
//   1. copia questo file in adapters/<id>.js (id corto, minuscolo, es. "miocrm")
//   2. implementa i metodi contro l'API del gestionale (REST, GraphQL, quello che c'e');
//      le credenziali vanno in .env con nomi tuoi (es. CRM_BASE_URL, CRM_API_TOKEN) e
//      si leggono da this.env, MAI cablate nel codice
//   3. registra la classe in lib/crm/index.js e imposta CRM_ADAPTER=<id> nel .env
//   4. verifica con: node scripts/bot/bot.js --check
//
// Linee guida collaudate in produzione:
//  - allegati SEMPRE in Buffer, mai su disco (L-004): il fill li usa in memoria
//  - retry di rete: usa fetchWithRetry (lib/http.js), gia' tarato bene (GET idempotenti
//    ritentabili, scritture no)
//  - writeback pensato per il retry: updateRecord/uploadAttachment devono poter essere
//    richiamati senza duplicare (vedi hasAttachmentNamed)
//  - token/refresh: se l'API usa OAuth, tieni il token in memoria con la sua scadenza
//    e rinnovalo da solo; il refresh token sta nel .env

import { fetchWithRetry } from "../../http.js";

export default class TemplateCrm {
  static id = "_template";

  constructor(env) {
    this.env = env;
    // es.: this.base = env.CRM_BASE_URL;
  }

  // Diagnosi per bot --check: una chiamata leggera che prova auth + lettura.
  async check() {
    return { ok: false, dettaglio: "Adapter non ancora implementato (skill onboarding-crm)." };
  }

  // Ricerca cliente per nome libero o identificativo esatto (es. "cf:..." se il
  // business usa il codice fiscale). Ritorna [{id, label}].
  async findRecord(identifier) {
    throw new Error("_template: findRecord da implementare");
  }

  // Metadata dei campi della fonte dati: serve all'onboarding portale per proporre
  // le mappature. Ritorna [{nome, label}].
  async listFields() {
    throw new Error("_template: listFields da implementare");
  }

  // Fetch dei campi richiesti (lista dal manifest del portale).
  async fetchRecord(recordId, campi) {
    throw new Error("_template: fetchRecord da implementare");
  }

  // Record COMPLETO: tutti i campi disponibili. E' il fetch usato in onboarding,
  // quando ancora non esiste un manifest. Se l'API ha limiti sul numero di campi per
  // chiamata, spezza in blocchi e fondi i risultati.
  async fetchRecordFull(recordId) {
    throw new Error("_template: fetchRecordFull da implementare");
  }

  async listAttachments(recordId) {
    throw new Error("_template: listAttachments da implementare");
  }

  // In Buffer, mai su disco (L-004).
  async downloadAttachment(recordId, attachmentId) {
    throw new Error("_template: downloadAttachment da implementare");
  }

  // Seleziona allegati per parola chiave (il naming nei gestionali e' umano, non
  // standard): wanted e' una mappa {chiave: regex} dal manifest del portale.
  // Ritorna {chiave: {nome, buffer} | null}. Implementazione generica gia' pronta.
  async pickAttachments(recordId, wanted) {
    const atts = await this.listAttachments(recordId);
    const out = {};
    for (const [key, re] of Object.entries(wanted)) {
      const att = atts.find((a) => re.test(a.nome || ""));
      out[key] = att
        ? { nome: att.nome, buffer: await this.downloadAttachment(recordId, att.id) }
        : null;
    }
    return out;
  }

  // --- Writeback (aggiornamento della fonte dati a valle della pratica) ---
  // Idempotente: ritentare non deve rifare uno step gia' andato a buon fine.

  async updateRecord(recordId, campi) {
    throw new Error("_template: updateRecord da implementare");
  }

  async uploadAttachment(recordId, nome, buffer, mime = "application/pdf") {
    throw new Error("_template: uploadAttachment da implementare");
  }

  // True se il record ha gia' un allegato con questo nome (evita upload doppi al retry).
  async hasAttachmentNamed(recordId, nome) {
    const atts = await this.listAttachments(recordId);
    return atts.some((a) => (a.nome || "") === nome);
  }
}
