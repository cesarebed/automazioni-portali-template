# Learnings - a knowledge base that grows with every case

This file is the system's **operational memory**: every resolved blocker, every
non-standard case, every rule an operator states ends up here. The `case-assistant`
skill **reads it at session start** and **updates it** (with a commit) every time
something is learned. This is how the system improves: code handles the codified
cases, this file handles the judgment.

Entry format: `[L-nnn]` progressive id, date, the **rule** in one line, context,
origin (who decided it or how it was discovered). Default rule: entries get
**superseded**, not deleted. When a rule changes, add a new entry that supersedes the
old one and cites it; the old entry stays, marked "superseded" (the value is often
the history of the correction, not just the current rule). **Deletion** is a
deliberate act reserved to the maintainers, only for: sensitive data committed by
mistake, duplicates, or archiving superseded entries. No silent deletions by anyone
else: an automatic guard reverts them (across all learnings files, shared and
per-portal).

## Organization (partitioned per portal)

Learnings are split by **scope**, so whoever works on one portal loads only what they
need without the noise of the others. `[L-nnn]` ids stay **global and unique** across
all files (an id lives in one file only; "see L-nnn" references work across files).

- **This file (`data/learnings.md`)** - the **shared** one, always loaded: the
  protocol above, the **cross-portal rules**, and learnings about **shared
  infrastructure** (data source, Chrome CDP, document reading, orchestration).
- **`data/learnings/<portal>.md`** - gotchas and rules specific to one onboarded
  portal. The file is created during that portal's onboarding.

## Cross-portal rules

The entries below are **inherited from the production system this template was
extracted from**, where they were discovered and verified on real cases. They apply
to any business and any portal.

- **[L-001] Login is always done by a human.** The operator logs in inside the
  dedicated Chrome (persistent profile); Claude and the bot never attempt a login,
  never touch credentials, never fill a password field. The session survives between
  runs thanks to the profile. Origin: hard rule of the original system, inherited.
- **[L-002] Never guess.** A missing, unreadable, or inconsistent value means report
  it and stop. No "plausible" invented value, on any field of any portal.
  Inconsistencies are handled in preflight, before the browser opens. Origin: hard
  rule of the original system, inherited.
- **[L-003] Use Playwright's Chromium for CDP, not stock Google Chrome.** Recent
  Chrome builds lack CDP commands that Playwright uses in `connectOverCDP` (observed
  live: "Browser.setDownloadBehavior ... not supported"). `launch-chrome-cdp.sh`
  handles this on its own; override with `CHROME_BIN` only with a compatible browser.
  Origin: incident resolved in the original system, inherited.
- **[L-004] Personal data stays out of the repo.** Client documents and records: in
  memory during the fill when possible; on disk only in `runtime/` (gitignored),
  deleted when the case closes. Never commit client data or tokens; the ledger holds
  only names and case identifiers. Origin: hard rule of the original system,
  inherited.
- **[L-005] Watch out for duplicate drafts.** Many portals save drafts server-side:
  refilling from scratch without checking for an existing draft creates duplicates
  that are hard to clean up. Before filling, always check whether a draft already
  exists for that client and decide (resume or delete, with confirmation). Origin:
  real case in the original system, inherited.
- **[L-006] Automatic submission only with a coded safeguard.** A freshly onboarded
  portal does not submit on its own. It first needs a portal-specific pre-submission
  check (re-reading what the portal reports as filled and comparing it to the
  expected values), defined in the spec, coded in the plugin, and validated on a
  supervised case. Until then a human confirms each submission. Origin: design
  decision of the original system, inherited.
