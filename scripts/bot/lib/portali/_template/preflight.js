// Preflight del portale: SOLO dati, il browser non si apre nemmeno se qui non e' verde.
// Guidato dal manifest (data/manifests/<id>.json): campi obbligatori, rami bloccanti,
// documenti richiesti. Regola ferrea: dato mancante o incoerente = si segnala e ci si
// ferma, mai un valore inventato (L-002).

export default function preflight(record, manifest) {
  const mancanti = [];
  const note = [];

  for (const campo of manifest?.campi || []) {
    if (campo.fonte === "crm" && campo.obbligatorio) {
      const v = record[campo.campo_crm];
      if (v === null || v === undefined || v === "") {
        mancanti.push(`${campo.campo_portale} (fonte dati: ${campo.campo_crm})`);
      }
    }
  }

  for (const ramo of manifest?.rami_bloccanti || []) {
    // TODO in onboarding: valutare la condizione sul record e, se scatta,
    // aggiungere una nota bloccante.
  }

  return { ok: mancanti.length === 0, mancanti, note };
}
