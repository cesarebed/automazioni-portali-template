// Deterministic portal filler: the spec docs/flow-<id>-<flow>.md produced during
// capture, translated into code. No heuristics at runtime: every selector and every
// click order comes from the verified spec. If the portal changes and a step no
// longer matches: stop, produce an incident (screenshot + accessibility tree + html
// in runtime/runs/) and update spec and filler. Never "try something else" silently.

export async function fill(ctx) {
  const { page, record, manifest, dry } = ctx;
  // TODO during onboarding: navigation + field-by-field fill, following the spec.
  // Conventions validated in production:
  //  - role/label selectors (getByRole, getByLabel), not fragile CSS
  //  - after each fill, read the value back and compare (fail fast)
  //  - with dry=true, stop BEFORE any save
  throw new Error("Template: filler not implemented for this portal yet.");
}

export async function verify(ctx) {
  // TODO during onboarding: define with the technical contact WHAT the portal shows
  // when a case is filled correctly (summary, completed sections, validation result)
  // and code it here. Until this function is validated, autoSubmit stays false (L-006).
  return { ok: false, detail: "Verification safeguard not defined yet." };
}

export async function submit(ctx) {
  throw new Error("Template: submit not implemented for this portal yet.");
}
