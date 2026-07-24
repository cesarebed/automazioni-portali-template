# Portal automation template

Claude-native template for automating case filing on web portals, using the company's
existing data source (CRM, ERP, internal API) as the source of truth. It is the
anonymized extraction of a system running in production at a real company: the
architecture and rules were validated there; business-specific content was removed.
The repo starts empty: no data source connected, no portal mapped. Both are added
through guided onboarding.

## How this repo is used (rule number one)

Four skills, two audiences:

- **`skills/case-assistant`** - the front end for the **operator**: every request
  about cases goes through it, in natural language ("start the X case for John
  Smith", "where do we stand"). The skill orchestrates everything and speaks plain
  language, no jargon. Do not run the bot by hand except for development or
  diagnosis.
- **`skills/setup`** - guided installation on a new machine (tools, dependencies,
  `.env`, dedicated browser, final check).
- **`skills/crm-onboarding`** - connects the company's **data source**: an adapter is
  written against the system's API (starting from
  `scripts/bot/lib/crm/adapters/_template.js`) in a guided session with the technical
  contact.
- **`skills/portal-onboarding`** - teaches the system a **new portal**: supervised
  live session, capture, spec, field manifest, deterministic plugin.

Under the hood: `scripts/bot` (deterministic Playwright), a dedicated Chrome over CDP
(persistent 2FA login, `scripts/chrome-cdp/`), one adapter for the data source
(`scripts/bot/lib/crm/`), one plugin per portal (`scripts/bot/lib/portals/<id>/`).

## THE SYSTEM LEARNS - mandatory protocol

1. **`data/learnings.md`** - the knowledge base. READ it at session start, UPDATE it
   every time something is learned. Entries are dated `[L-nnn]` ids: they get
   **superseded** by a new entry citing the old one (which stays, marked
   "superseded"); they are not deleted. Deletion is reserved to the maintainers
   (listed in `.github/workflows/guard-learnings.yml`) and only for sensitive data
   committed by mistake, duplicates, or archiving; the CI guard reverts deletions by
   anyone else. Partitioning: `data/learnings.md` holds the protocol, cross-portal
   rules, and shared infrastructure; portal-specific gotchas live in
   `data/learnings/<portal>.md`. `[L-nnn]` ids are global and unique across the union
   of files.
2. **`data/case_ledger.json`** - the state of every case on every portal, across
   sessions. If it is not in the ledger, it did not happen.
3. **Incidents**: when a portal bot gets stuck, it produces a structured record plus
   artifacts (screenshot, accessibility tree, html) in `runtime/runs/`. An unresolved
   incident is debt: diagnose it, fix it (code verified on the live portal, or a rule
   in the learnings), mark it resolved, commit.

**The git log is the history of what the system has learned**: every fix and every
learning is committed with a message that explains the case. Never fix without
committing.

## Pushing to `main` (convention)

This is a convention, not a technical constraint. Who is operating is identified by
the machine's git identity (`git config user.name` / `user.email`):

- **Maintainers** (the same ones listed in the CI guard): after every commit on
  `main`, push directly to `origin/main`, for any file.
- **Anyone else** (or if the identity cannot be confirmed): auto-push ONLY for
  commits that touch exclusively `data/learnings.md`, `data/learnings/`, and
  `data/case_ledger.json`. Code or mixed commits: commit locally, do not push,
  explain that those changes go to `main` via PR.

This applies only to direct pushes to `main` of this repo. Force-push, reset, history
rewriting: always ask first. When in doubt, do not push (fail safe).

## Hard rules (non-negotiable)

- **Never guess** (L-002): a missing or unreadable value means report it and stop.
  Always, on every portal. Inconsistencies are handled in preflight, before the
  browser opens.
- **Submission** (L-006): a freshly onboarded portal does NOT submit on its own.
  Automatic submission is enabled per portal only after its **verification
  safeguard** (re-reading what the portal reports as filled and comparing it to the
  expected values) has been defined in the spec, coded in the plugin, and validated
  on a supervised case. Until then the bot fills and stops; a human confirms each
  submission.
- **Login and 2FA** (L-001): done by the operator in the dedicated Chrome (persistent
  profile, `scripts/chrome-cdp/`). Claude never attempts a login and never touches
  credentials.
- **Personal data** (L-004): client documents stay in memory during the fill; on disk
  only in `runtime/` (gitignored), deleted when the case closes. Never commit client
  data, tokens, or real identifiers. The ledger holds only names and case
  identifiers, data already present in the company's data source.
- **Output for the operator**: plain language, in the operator's own language, no em
  dashes, no jargon (the output contract is in the `case-assistant` skill).
- **Critical actions during capture**: during onboarding, every irreversible action
  (Save, Generate, Send, Delete) is gated manually by the technical contact.

## Living documents

- `data/learnings.md` (+ `data/learnings/<portal>.md`) - operational knowledge
- `data/case_ledger.json` - case state
- `data/manifests/<portal>.json` - field map from data source to portal (source of
  truth, produced by onboarding)
- `docs/flow-<portal>-<flow>.md` - the deterministic step-by-step spec of each
  onboarded flow, verified live: if a fix changes the flow, the spec changes in the
  same commit

## New machine setup

The complete guided path is the `setup` skill. In short:

1. `cp .env.example .env` and fill it in (data-source adapter and its credentials,
   `CDP_URL`).
2. `cd scripts/bot && npm install && npx playwright install chromium`
3. Dedicated Chrome: `scripts/chrome-cdp/launch-chrome-cdp.sh`, log in to the portals
   once.
4. Check: `node scripts/bot/bot.js --check`
