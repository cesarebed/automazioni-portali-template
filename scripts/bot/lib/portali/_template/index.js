// TEMPLATE di plugin portale — NON e' registrato nel router. Per onboardare un portale:
//   1. copia questa cartella in lib/portali/<id>/ (id corto, minuscolo)
//   2. compila meta e i cinque hook seguendo la spec prodotta in cattura
//      (docs/flow-<id>-<flusso>.md) e il manifest (data/manifests/<id>.json)
//   3. registra il plugin in lib/portali/index.js
// Il template e' volutamente minimale: il contratto cresce col portale (piu' flussi,
// ripresa bozze, firma documenti...), ma questi cinque hook sono il minimo comune.

import preflight from "./preflight.js";
import { compila, verifica, inoltra } from "./portal.js";

export default {
  meta: {
    id: "_template",
    label: "Nome umano del portale",
    url: "", // pagina di ingresso post-login (l'URL base sta in .env, un blocco per portale)
    flussi: ["default"],
    // Resta false finche' la salvaguardia di verifica non e' codificata E validata su
    // una pratica supervisionata (L-006). Con false il bot compila e si ferma: l'inoltro
    // lo conferma un umano.
    inoltroAutomatico: false,
  },

  // Solo dati, niente browser: controlla che il record della fonte dati + manifest
  // bastino per compilare senza indovinare (L-002). Ritorna { ok, mancanti: [], note: [] }.
  preflight,

  // Fill deterministico. ctx = { page, env, crm, record, docs, manifest, dry } dove
  // docs sono gli allegati in Buffer (pickAttachments) e dry=true significa: naviga e
  // compila ma fermati PRIMA di qualsiasi azione con effetti (salva/invia).
  compila,

  // La salvaguardia pre-inoltro: rileggi dal portale cio' che risulta compilato e
  // confrontalo con l'atteso. Ritorna { ok, dettaglio }. Senza ok qui non si inoltra mai.
  verifica,

  inoltra,

  // Aggiornamento della fonte dati post-esito (stati, date, upload ricevute).
  // Idempotente: ritentare non deve rifare step gia' riusciti (usa hasAttachmentNamed).
  async writeback(ctx) {},
};
