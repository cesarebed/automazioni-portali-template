// Registro dei portali onboardati + router. bot.js chiede qui quale plugin usare.
// Aggiungere un portale = creare la sua cartella (copiando _template/), importarla e
// aggiungerla a PORTALI. E' l'unico punto di wiring: tutto il resto (fonte dati, CDP,
// ledger, learnings) e' infrastruttura condivisa che i plugin riusano senza toccarla.
//
// Contratto minimo di un plugin (vedi _template/index.js per il dettaglio):
//   meta:      { id, label, url, flussi, inoltroAutomatico }
//   preflight: (record, manifest) -> { ok, mancanti, note }   // solo dati, niente browser
//   compila:   (ctx) -> esito                                  // fill deterministico via ctx.page
//   verifica:  (ctx) -> { ok, dettaglio }                      // la salvaguardia pre-inoltro
//   inoltra:   (ctx) -> esito                                  // SOLO se verifica.ok (L-006)
//   writeback: (ctx) -> void                                   // aggiornamento fonte dati post-esito

const PORTALI = {
  // [mioportale.meta.id]: mioportale,   <- cosi', dopo l'onboarding del primo portale
};

export function listPortali() {
  return Object.values(PORTALI).map((p) => p.meta);
}

export function getPortale(id) {
  const p = PORTALI[id];
  if (!p) {
    const noti = Object.keys(PORTALI);
    throw new Error(
      noti.length
        ? `Portale sconosciuto: "${id}". Onboardati: ${noti.join(", ")}`
        : `Nessun portale ancora onboardato. Il primo si aggiunge con la skill onboarding-portale (sessione live col referente tecnico).`
    );
  }
  return p;
}
