// Registry of data-source adapters (CRM/ERP/internal API) + contract. The bot talks
// to the data source ONLY through this interface: connecting a new system means
// writing an adapter (crm-onboarding skill, starting from adapters/_template.js),
// without touching the rest.
//
// Minimum adapter contract (see adapters/_template.js for details):
//   findRecord(identifier)            -> [{id, label}]     client search (name or id)
//   fetchRecord(id, fields?)          -> {field: value}    fetch the requested fields
//   fetchRecordFull(id)               -> {field: value}    full record (onboarding)
//   listFields()                      -> [{name, label}]   metadata (mapping proposals)
//   listAttachments(id)               -> [{id, name, size}]
//   downloadAttachment(id, attId)     -> Buffer            in memory, never on disk (L-004)
//   pickAttachments(id, {key: regex}) -> {key: {name, buffer} | null}
//   updateRecord(id, fields)                               writeback (idempotent)
//   uploadAttachment(id, name, buffer, mime?)
//   hasAttachmentNamed(id, name)      -> bool              duplicate guard on retries
//   check()                           -> {ok, detail}      for bot --check

const ADAPTERS = {
  // [mycrm.id]: MyCrmAdapter,   <- like this, after data-source onboarding
};

export function listAdapters() {
  return Object.keys(ADAPTERS);
}

export function getCrm(env) {
  const id = env.CRM_ADAPTER;
  if (!id) {
    throw new Error(
      "No data source configured (CRM_ADAPTER is empty in .env). " +
      "Connect one with the crm-onboarding skill."
    );
  }
  const Adapter = ADAPTERS[id];
  if (!Adapter) {
    const known = listAdapters();
    throw new Error(
      known.length
        ? `Unknown adapter: "${id}". Registered: ${known.join(", ")}`
        : `Adapter "${id}" is not registered. Create it with the crm-onboarding skill ` +
          `(from adapters/_template.js) and register it in lib/crm/index.js.`
    );
  }
  return new Adapter(env);
}
