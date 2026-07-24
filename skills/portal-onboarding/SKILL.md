---
name: portal-onboarding
description: |
  The process by which the system learns to automate a NEW WEB PORTAL (a government
  site, an agency, a supplier) for the company's cases. Run it with the TECHNICAL
  CONTACT, not the end operator: a live session in which the contact drives the
  navigation on the real portal and Claude executes, captures, and documents every
  step, until the flow becomes a spec, a field manifest, and a deterministic plugin
  in scripts/bot/lib/portals/<id>/. Invisible to the end operator: the output is one
  more portal behind the same case-assistant front end. Use it to onboard a new
  portal or flow; NOT to work cases on portals already onboarded.
allowed_tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Onboarding a new portal - live capture

This is the process by which the system learns a portal that **nobody has mapped
yet**. You do not discover it by clicking around on real cases: you run a
**supervised live session** where the **contact drives** (they know what to do on
the page) and **you execute, capture, and document**. This is the method the
original system behind this template was built with, made repeatable.

Prerequisite: the data source is already connected (`crm-onboarding` skill); you
need it to download the test client's record and propose mappings.

**Who is on the other side:** the technical contact. During capture the log can be
technical. But what you produce (spec, plugin, reports) must honor the contract for
the end operator: once the portal is in production, the operator only ever uses the
`case-assistant` front end, in plain language. Onboarding is invisible to them by
design.

## Phase 0 - Interview (before touching anything)

Ask the contact, and write the answers at the top of the capture file:

1. **Which portal and which case type**: URL, flow name, what it produces at the end
   (a protocol number, a receipt, a PDF?).
2. **Login**: who owns the credentials, what 2FA the portal uses. The contact will
   log in inside the dedicated Chrome; you never touch credentials (L-001).
3. **Test client**: a REAL case suited to this flow (the contact picks it).
4. **Where the data lives**: do the fields the portal asks for exist in the data
   source? Any to be created? Is there a signal (state/label) that means "case to be
   filed" (needed later for routing)?
5. **Documents**: what the portal requires as uploads, and what the corresponding
   attachments are called in the data source.
6. **Enrichment document**: if a guide or manual for this case type exists, get it
   and read it first: it feeds your proposals. The document informs, it does not
   decide.
7. **How far today's session goes**: does the capture case get submitted for real,
   or do we stop earlier? (Default: first capture goes up to the submission
   threshold, and the contact presses the final button.)

## Phase 1 - Preparation

1. **Environment**: `node scripts/bot/bot.js --check` green (except, of course, the
   portals line).
2. **Portal block in .env**: add the portal's variables to `.env` (and as comments
   in `.env.example`), e.g. `<PORTAL>_PORTAL_URL=`. No credentials in plain text.
3. **Dedicated Chrome**: `scripts/chrome-cdp/launch-chrome-cdp.sh`; the contact logs
   in to the portal in that window. Confirm you are on the logged-in session before
   starting.
4. **Test client data**: download the FULL record and the attachment list:
   `node scripts/bot/tools/fetch-record.js "<client>" --attachments --out`
   (goes to `runtime/`, gitignored, L-004). You need it to upload documents when the
   portal asks for them and to propose mappings.

## Phase 2 - Live capture: the 5 principles (the core of the method)

1. **Code first, screenshots only when needed.** Your primary eye is the TEXTUAL
   snapshot of the page (accessibility tree / DOM): fast, and it gives you exact
   labels, field types, menu options, required flags. Take a real screenshot only
   when text is not enough (icons, visual state, ambiguous layout) or to show
   something to the contact. Log everything as you go.

2. **Ask at every step, and wait before critical actions.** You do not know this
   portal: have the contact tell you what to do at each step. Before any critical or
   irreversible action (Save, Generate, Send, Submit, Delete) **stop and wait for an
   explicit go**. No automation applies during capture: you are learning on a real
   portal with a real case.

3. **Propose the mapping yourself, proactively.** For every field you fill, propose
   the likely source ("I would take this from field <X> in the data source", "this
   looks like it comes from a document", "this looks like a fixed company value")
   and ask for confirmation. The contact corrects you; the answer becomes the
   manifest row.

4. **Document every click. If you do not know, ask.** An uncertain field or step
   means stop and ask, never guess (L-002).

5. **Use the enrichment document, if there is one**, for expected values, sequences,
   and edge cases, always running what you infer past the contact.

### The living capture file

Keep `runtime/onboarding-<portal>-<flow>-capture.md` (gitignored) updated in real
time. One line per action, and for each field:

```
[step N] <action> - <page/section>
  field: "<exact on-screen label>"
  type: text | select | date | radio | checkbox | upload
  options: [if select, the list]
  required: yes/no
  value entered: <what you put in>
  mapping (proposed -> confirmed): <data-source field> | document <which> | fixed | manual
  gotcha: <what to expect / traps>
```

At the end of the session, also ask the contact: **what does the portal show when a
case is filled correctly?** (summary, checked sections, validation result). That
answer becomes the plugin's **verification safeguard**: without it, the portal can
never submit automatically (L-006).

## Phase 3 - Codification (from capture file to fixed artifacts)

Every onboarded portal leaves the same pieces:

- `docs/flow-<portal>-<flow>.md` - the deterministic step-by-step spec, written from
  the capture file. A living document: if a fix changes the flow, the spec changes
  too.
- `data/manifests/<portal>.json` - the confirmed mappings (format in
  `data/manifests/README.md`). No personal data, only fields and rules.
- `scripts/bot/lib/portals/<portal>/` - the plugin, copied from `_template/`:
  `preflight` (data only), `fill` (deterministic filler), `verify` (the safeguard),
  `submit`, `writeback`. Plus the registration line in `lib/portals/index.js`.
- `data/learnings/<portal>.md` - this portal's gotchas, `[L-nnn]` entries (global
  ids, continuing the numbering across the union of files).
- The portal's block in `.env.example` and, if new fields were needed in the data
  source, a note of what was created.

Everything else is reused untouched: the data-source adapter, CDP, the ledger, the
shared learnings, the `case-assistant` front end. That reuse is what makes portals
indistinguishable to the operator: only the plugin directory changes.

## Phase 4 - Validation and production

1. From spec to code: complete plugin, clean `--dry-run` on the capture client.
2. **A second case of the same type, supervised** through the bot: confirms the
   filler holds on different data. From here on, normal micro-learning (incident ->
   learnings) covers this portal like the others.
3. **Automatic submission**: enable it (`meta.autoSubmit = true`) ONLY once the
   verification safeguard is coded and has held on the supervised case (L-006).
   Commit the decision with the reasoning.
4. Routing: define with the contact the signal in the data source (state/label) that
   lets `case-assistant` figure out on its own that a case belongs to this portal.

Expectation to set with the contact: one live session of a few hours plus a day of
consolidation per portal, not "tomorrow morning". Better to say it than to capture
badly.

## Inherited hard rules (non-negotiable during capture too)

- **No invented values**: uncertain data or step means stop and ask (L-002).
- **Login always manual**, done by the contact in the window (L-001).
- **Critical/irreversible actions gated manually** during capture (principle 2).
- **Personal data**: client data and documents only in `runtime/` (gitignored),
  deleted at the end of the session (L-004).
- **Everything learned gets committed**: spec, manifest, plugin, learnings. The git
  log is the history of what the system has learned.
