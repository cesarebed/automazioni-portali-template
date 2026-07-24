// Registry of onboarded portals + router. bot.js asks here which plugin to use.
// Adding a portal means creating its directory (copy _template/), importing it, and
// adding it to PORTALS. This is the only wiring point: everything else (data source,
// CDP, ledger, learnings) is shared infrastructure that plugins reuse untouched.
//
// Minimum plugin contract (see _template/index.js for details):
//   meta:      { id, label, url, flows, autoSubmit }
//   preflight: (record, manifest) -> { ok, missing, notes }  // data only, no browser
//   fill:      (ctx) -> outcome                               // deterministic fill via ctx.page
//   verify:    (ctx) -> { ok, detail }                        // the pre-submission safeguard
//   submit:    (ctx) -> outcome                               // ONLY if verify.ok (L-006)
//   writeback: (ctx) -> void                                  // data-source update after the outcome

const PORTALS = {
  // [myportal.meta.id]: myportal,   <- like this, after the first portal onboarding
};

export function listPortals() {
  return Object.values(PORTALS).map((p) => p.meta);
}

export function getPortal(id) {
  const p = PORTALS[id];
  if (!p) {
    const known = Object.keys(PORTALS);
    throw new Error(
      known.length
        ? `Unknown portal: "${id}". Onboarded: ${known.join(", ")}`
        : `No portal onboarded yet. Add the first one with the portal-onboarding skill (live session with the technical contact).`
    );
  }
  return p;
}
