---
name: crm-onboarding
description: |
  Connects the company's data source (CRM, ERP, internal API) to the system: a
  guided session with the technical contact in which the adapter is written (from
  scripts/bot/lib/crm/adapters/_template.js) against the system's API and verified
  on real records. Use it when the data source must be connected or changed ("let's
  connect our CRM", "the check says the data source is missing"). NOT for working
  cases (case-assistant) or mapping a site (portal-onboarding).
allowed_tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Data-source onboarding (CRM adapter)

Goal: by the end of the session `node scripts/bot/bot.js --check` reports OK for the
data source, and `tools/fetch-record.js` fetches a real record. The bot talks to the
company's system ONLY through the contract in `scripts/bot/lib/crm/index.js`: here
you implement that contract for the specific API.

## Phase 1 - Interview (before writing code)

Ask the technical contact:

1. **What the system is** and what API it exposes (REST/GraphQL/other), with
   documentation if it exists. If you already know the API from your training,
   propose the approach and have it confirmed.
2. **Authentication**: static token, OAuth with refresh token, API key. How the
   credentials are obtained and with which minimal permissions (read records and
   attachments, write for the writeback).
3. **Where clients live**: which entity/module, how search works (name? id? an exact
   identifier such as a tax code?), where attachments are stored.
4. **The writeback**: what should be updated after a case (a state, a date, a label,
   an uploaded receipt)?
5. **A real test client** to verify against (the data stays local, L-004).

## Phase 2 - Implementation

1. Copy `scripts/bot/lib/crm/adapters/_template.js` to `adapters/<id>.js` (short id,
   e.g. the system's name) and implement the contract methods. Guidelines are in the
   template itself: attachments always as Buffers (L-004), retries via `lib/http.js`,
   idempotent writeback, tokens kept in memory with credentials from `.env`.
2. Also implement `check()`: one lightweight call that exercises authentication and
   a read (this is what makes `bot.js --check` useful).
3. Register the class in `lib/crm/index.js` and add the adapter's variables to
   `.env` (and their NAMES, commented, to `.env.example`; never the values).
4. Set `CRM_ADAPTER=<id>` in `.env`.

## Phase 3 - Verification on real data

```bash
node scripts/bot/bot.js --check                      # data source OK
node scripts/bot/tools/fetch-record.js "<test client>" --attachments
```

Review with the technical contact that the fields and attachments are the expected
ones. If the system has quirks (attachment naming, computed fields, API limits),
record them as `[L-nnn]` entries in the shared `data/learnings.md` (shared
infrastructure section).

## Phase 4 - Wrap up

- Commit the adapter, its registration, the updated `.env.example`, and any
  learnings, with a message that explains which system was connected and the choices
  made.
- Delete any test data downloaded to disk (`runtime/`, L-004).
- Next step: the first portal, with the `portal-onboarding` skill.

## Hard rules

- Credentials ONLY in the local `.env`, never in code, never committed, never
  printed.
- Client data never in the repo (L-004).
- If the API does not allow something (e.g. no writes), do not work around it:
  document the limit in the learnings and define the corresponding manual step with
  the technical contact.
