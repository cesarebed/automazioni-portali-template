// Portal plugin TEMPLATE. It is not registered in the router. To onboard a portal:
//   1. copy this directory to lib/portals/<id>/ (short lowercase id)
//   2. fill in meta and the five hooks following the spec produced during capture
//      (docs/flow-<id>-<flow>.md) and the manifest (data/manifests/<id>.json)
//   3. register the plugin in lib/portals/index.js
// The template is intentionally minimal: the contract grows with the portal (more
// flows, draft resumption, document signing...), but these five hooks are the
// common minimum.

import preflight from "./preflight.js";
import { fill, verify, submit } from "./portal.js";

export default {
  meta: {
    id: "_template",
    label: "Human-readable portal name",
    url: "", // post-login entry page (the base URL lives in .env, one block per portal)
    flows: ["default"],
    // Stays false until the verification safeguard is coded AND validated on a
    // supervised case (L-006). While false, the bot fills and stops: a human
    // confirms the submission.
    autoSubmit: false,
  },

  // Data only, no browser: checks that the data-source record + manifest are enough
  // to fill without guessing (L-002). Returns { ok, missing: [], notes: [] }.
  preflight,

  // Deterministic fill. ctx = { page, env, crm, record, docs, manifest, dry } where
  // docs are the attachments as Buffers (pickAttachments) and dry=true means:
  // navigate and fill but stop BEFORE any action with side effects (save/send).
  fill,

  // The pre-submission safeguard: re-read from the portal what it reports as filled
  // and compare it to the expected values. Returns { ok, detail }. Without an ok
  // here, submission never happens.
  verify,

  submit,

  // Data-source update after the outcome (states, dates, receipt uploads).
  // Idempotent: a retry must not redo steps that already succeeded (see
  // hasAttachmentNamed).
  async writeback(ctx) {},
};
