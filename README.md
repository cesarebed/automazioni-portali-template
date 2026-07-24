# Portal automation template

A Claude-native template for automating form-filling on web portals. It reads client
data and documents from the data source your company already has (a CRM, an ERP, an
internal API) and fills in cases on external websites: government portals, supplier
sites, grant applications, insurance filings. Anywhere someone currently retypes the
same data by hand.

This is the anonymized extraction of a system that runs in production at a real
company. The architecture, the safeguards, and the learning protocol come from that
system; everything specific to that business has been removed. The repo starts empty
on purpose: no data source connected, no portal mapped. Both get added through guided
onboarding sessions.

## How it works

1. A portal is taught once. In a live session on the real site, a person drives and
   Claude executes, records every field, and codifies the procedure. The output is
   deterministic: no improvisation at runtime.
2. From then on, cases start with one sentence ("start the X case for John Smith").
   The system reads data from your source, checks that everything is present before
   opening a browser, fills the portal, verifies the result, and updates its records.
3. Every resolved failure and every rule an operator states gets written down and
   committed. The knowledge lives in the repo, not in one person's head.

## Safeguards

- Never guess. A missing or inconsistent value stops the run before the browser
  opens, and the operator is told exactly what is missing.
- No unattended submission on new portals. Automatic submission is enabled per portal
  only after its verification check (re-reading the portal's own state and comparing
  it to the expected result) has been coded and validated on a supervised case.
- Login stays human. Credentials and 2FA belong to the operator, in a dedicated
  browser with a persistent session. The system never sees a password.
- Client data stays out of the repo. Documents are held in memory or in gitignored
  directories, and deleted when a case closes.

## Architecture

```
Operator (natural language, inside Claude Code)
 └─ case-assistant skill ............ conversational front end
     └─ scripts/bot (Node) .......... deterministic Playwright bot
         ├─ bot.js .................. CLI: --check (diagnostics) + per-portal runs
         ├─ lib/crm/ ................ data-source contract + pluggable adapters
         │    └─ adapters/_template.js  skeleton: implement it for YOUR system
         ├─ lib/cdp.js .............. attaches to the dedicated Chrome over CDP
         └─ lib/portals/<id>/ ....... ONE PORTAL = ONE DIRECTORY (plugin):
              preflight (data only) · fill · verify · submit · writeback
              (_template/ is the skeleton you copy for each new portal)
data/
 ├─ learnings.md ................... versioned operational knowledge ([L-nnn] protocol)
 ├─ manifests/<portal>.json ........ field map: where each portal field comes from
 └─ case_ledger.json ............... state of every case across sessions
skills/ ............................ setup, crm-onboarding, portal-onboarding,
                                     case-assistant
```

Everything runs on the operator's machine inside Claude Code or Claude Desktop. There
is no server, no webhook, and no data leaves the company.

## Getting started

1. Setup. Open the repo in Claude Code and ask it to install the system. The `setup`
   skill walks through tools, dependencies, `.env`, and the final check
   (`bot.js --check`).
2. Connect your data source. Ask to connect your CRM. The `crm-onboarding` skill
   builds the adapter against your system's API with you: client search, record and
   attachment reads, writeback.
3. Teach the first portal. Ask to automate site X. The `portal-onboarding` skill runs
   the live capture session on the real portal with a real case; afterwards the portal
   is a plugin and cases start with one sentence.

Rough effort: setup takes half an hour. The data-source adapter takes half a day or
more, depending on the API. A portal takes one live session of a few hours plus a day
of consolidation.

## The learning protocol

`data/learnings.md` is the system's operational memory. Every resolved blocker, every
operator rule, and every odd case becomes a dated `[L-nnn]` entry, committed to git.
Entries get superseded by new entries that cite the old one; they are not deleted. A
CI job reverts deletions made by anyone who is not a maintainer, because a deleted
learning usually costs a repeated failure. The template ships with the six
cross-portal rules inherited from the original system (L-001..L-006).

Operating rules for Claude sessions are in [CLAUDE.md](CLAUDE.md).
