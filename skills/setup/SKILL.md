---
name: setup
description: |
  Guided installation of the system on a new machine. Use it when a user asks to
  install, configure, or check the system ("install the system", "set up this
  computer", "the check is red"). You, Claude, execute the steps: the user is
  probably not technical, so speak plainly and always say what you are doing and
  what you need from them.
allowed_tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Setup - guided installation

Follow the steps in order, one block at a time, checking the outcome before moving
on. Rules while executing:

- **Check before installing**: if a tool is already there (`git --version` etc.), do
  not reinstall it, move on.
- **Secrets (credentials, tokens) go ONLY in the local `.env` file**: never
  committed, never printed in full, never written anywhere else.
- Do not commit or push anything during setup.

## Step 0 - Operating system

Determine whether you are on macOS or Windows and use the right command variants
from here on. If the repo is not cloned yet, clone it first (needs `gh auth login`,
Step 2) into the user's base directory (e.g. `~/Documents/Github`).

## Step 1 - Base tools

Check and, if missing, install **git, GitHub CLI (gh), Node.js LTS**.

- macOS: `brew install git gh node` (if Homebrew is missing: https://brew.sh)
- Windows (PowerShell): `winget install --id Git.Git -e`, `--id GitHub.cli -e`,
  `--id OpenJS.NodeJS.LTS -e`; then have the user reopen the terminal (PATH).

Check: `git --version`, `gh --version`, `node --version` all respond.

## Step 2 - GitHub access (if needed)

`gh auth status || gh auth login` (GitHub.com -> HTTPS -> Login with a web browser).
Explain that the browser will open and they should sign in with the company account.

## Step 3 - Project dependencies

```bash
cd scripts/bot
npm install
npx playwright install chromium
cd ../..
```

Note: automation does NOT use the user's Google Chrome but Playwright's Chromium,
with a dedicated profile (L-003). Do not suggest alternatives.

## Step 4 - `.env` configuration

If the company already has a prepared `.env` file (provided by whoever administers
the system), ask where it is and copy it to the repo root with the exact name
`.env`; check the variable NAMES without ever printing the values, and have the
external copy deleted. Otherwise: `cp .env.example .env` and fill it in with the
user:

- `CRM_ADAPTER`: the data-source adapter id. If it is empty and no adapter exists in
  `scripts/bot/lib/crm/adapters/`, the data source is not connected yet: that comes
  later, with the `crm-onboarding` skill (not a setup error).
- The adapter's credentials (if one exists): ask for them one at a time, explaining
  that they stay on this computer only.
- `CDP_URL`: leave `http://127.0.0.1:9222`.

## Step 5 - Dedicated Chrome and login

Run `scripts/chrome-cdp/launch-chrome-cdp.sh` (Windows: `.cmd`). A Chromium window
opens with a separate profile. **Portal logins are done by the user, never by you**
(L-001). If no portal is onboarded yet, it is enough that the window opens.

## Step 6 - Final check

```bash
node scripts/bot/bot.js --check
```

Read the result and explain it plainly. On a freshly adopted repo it is normal for
"data source" to be KO (adapter still to be created with `crm-onboarding`) and for
onboarded portals to be "none": present those as next steps, not as errors.

## Step 7 - Wrap up

1. Summarize what you installed and what is ready.
2. Explain how the system is used from now on: open Claude Code/Desktop in the
   project directory and write in natural language (the `case-assistant` skill).
3. Point out the two remaining onboardings, in order: first the data source
   (`crm-onboarding`), then the first portal (`portal-onboarding`).
