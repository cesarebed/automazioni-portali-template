// Filler deterministico del portale: la traduzione in codice della spec
// docs/flow-<id>-<flusso>.md prodotta in cattura. Niente euristiche a runtime: ogni
// selettore, ogni ordine di click viene dalla spec verificata. Se il portale cambia e
// un passo non torna: ci si ferma, si produce un incident (screenshot + albero
// accessibilita' + html in runtime/runs/) e si aggiorna spec e filler, mai "si prova
// qualcos'altro" in silenzio.

export async function compila(ctx) {
  const { page, record, manifest, dry } = ctx;
  // TODO in onboarding: navigazione + fill campo per campo, seguendo la spec.
  // Convenzioni collaudate in produzione:
  //  - selettori per ruolo/etichetta (getByRole, getByLabel), non CSS fragili
  //  - dopo ogni fill, rileggere il valore e confrontarlo (fail-fast)
  //  - con dry=true fermarsi PRIMA di qualsiasi salvataggio
  throw new Error("Template: filler non ancora implementato per questo portale.");
}

export async function verifica(ctx) {
  // TODO in onboarding: definire col referente COSA il portale mostra a compilazione
  // completa (riepilogo, sezioni verdi, ricevuta di validazione...) e codificarlo qui.
  // Senza questa funzione validata, inoltroAutomatico resta false (L-006).
  return { ok: false, dettaglio: "Salvaguardia di verifica non ancora definita." };
}

export async function inoltra(ctx) {
  throw new Error("Template: inoltro non ancora implementato per questo portale.");
}
