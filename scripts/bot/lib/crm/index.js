// Registro degli adapter della fonte dati (CRM/gestionale) + contratto. Il bot parla
// con la fonte dati SOLO attraverso questa interfaccia: collegare un gestionale nuovo
// = scrivere un adapter (skill onboarding-crm, partendo da adapters/_template.js),
// senza toccare il resto del sistema.
//
// Contratto minimo di un adapter (vedi adapters/_template.js per il dettaglio):
//   findRecord(identifier)            -> [{id, label}]      ricerca cliente (nome o id)
//   fetchRecord(id, campi?)           -> {campo: valore}    fetch dei campi richiesti
//   fetchRecordFull(id)               -> {campo: valore}    record completo (onboarding)
//   listFields()                      -> [{nome, label}]    metadata (proposte mappature)
//   listAttachments(id)               -> [{id, nome, size}]
//   downloadAttachment(id, attId)     -> Buffer             in memoria, mai su disco (L-004)
//   pickAttachments(id, {chiave: re}) -> {chiave: {nome, buffer} | null}
//   updateRecord(id, campi)                                 writeback (idempotente)
//   uploadAttachment(id, nome, buffer, mime?)
//   hasAttachmentNamed(id, nome)      -> bool               anti-doppioni al retry
//   check()                           -> {ok, dettaglio}    per bot --check

const ADAPTERS = {
  // [miocrm.id]: MioCrmAdapter,   <- cosi', dopo l'onboarding della fonte dati
};

export function listAdapters() {
  return Object.keys(ADAPTERS);
}

export function getCrm(env) {
  const id = env.CRM_ADAPTER;
  if (!id) {
    throw new Error(
      "Nessuna fonte dati configurata (CRM_ADAPTER vuoto nel .env). " +
      "Si collega con la skill onboarding-crm."
    );
  }
  const Adapter = ADAPTERS[id];
  if (!Adapter) {
    const noti = listAdapters();
    throw new Error(
      noti.length
        ? `Adapter sconosciuto: "${id}". Registrati: ${noti.join(", ")}`
        : `Adapter "${id}" non registrato. Si crea con la skill onboarding-crm ` +
          `(da adapters/_template.js) e si registra in lib/crm/index.js.`
    );
  }
  return new Adapter(env);
}
