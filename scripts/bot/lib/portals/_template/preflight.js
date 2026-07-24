// Portal preflight: DATA only, the browser does not even open unless this passes.
// Driven by the manifest (data/manifests/<id>.json): required fields, blocking
// branches, required documents. Hard rule: a missing or inconsistent value gets
// reported and stops the run, never an invented value (L-002).

export default function preflight(record, manifest) {
  const missing = [];
  const notes = [];

  for (const field of manifest?.fields || []) {
    if (field.source === "crm" && field.required) {
      const v = record[field.crm_field];
      if (v === null || v === undefined || v === "") {
        missing.push(`${field.portal_field} (data source: ${field.crm_field})`);
      }
    }
  }

  for (const branch of manifest?.blocking_branches || []) {
    // TODO during onboarding: evaluate the condition on the record and, if it
    // triggers, add a blocking note.
  }

  return { ok: missing.length === 0, missing, notes };
}
