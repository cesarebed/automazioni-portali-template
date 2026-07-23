---
name: setup
description: |
  Installazione guidata del sistema su una macchina nuova. Attivala quando un utente
  chiede di installare, configurare o verificare il sistema ("installa il sistema",
  "prepara questo computer", "il check e' rosso"). Sei tu, Claude, a eseguire i passi:
  l'utente probabilmente non e' tecnico, parlagli in linguaggio semplice e digli
  sempre cosa stai facendo e cosa ti serve da lui.
allowed_tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Setup — installazione guidata

Segui i passi in ordine, un blocco alla volta, verificando l'esito prima di
proseguire. Regole mentre esegui:

- **Verifica prima di installare**: se uno strumento c'e' gia' (`git --version` ecc.),
  non reinstallarlo, passa oltre.
- **I segreti (credenziali, token) vanno SOLO nel file `.env` locale**: mai committati,
  mai mostrati per intero a video, mai scritti altrove.
- Non committare e non pushare nulla durante il setup.

## Passo 0 — Sistema operativo

Determina se sei su macOS o Windows e usa la variante giusta dei comandi. Se il repo
non e' ancora clonato, clonalo prima (serve `gh auth login`, Passo 2) nella cartella
base dell'utente (es. `~/Documents/Github`).

## Passo 1 — Strumenti di base

Verifica ed eventualmente installa **git, GitHub CLI (gh), Node.js LTS**.

- macOS: `brew install git gh node` (se manca Homebrew: https://brew.sh)
- Windows (PowerShell): `winget install --id Git.Git -e`, `--id GitHub.cli -e`,
  `--id OpenJS.NodeJS.LTS -e`; poi far riaprire il terminale (PATH).

Verifica: `git --version`, `gh --version`, `node --version` rispondono tutti.

## Passo 2 — Accesso GitHub (se serve)

`gh auth status || gh auth login` (GitHub.com -> HTTPS -> Login with a web browser).
Spiega all'utente che si aprira' il browser e dovra' accedere con l'account aziendale.

## Passo 3 — Dipendenze del progetto

```bash
cd scripts/bot
npm install
npx playwright install chromium
cd ../..
```

Nota: per l'automazione NON si usa il Google Chrome dell'utente ma il Chromium di
Playwright, con profilo dedicato (L-003). Non proporre alternative.

## Passo 4 — Configurazione `.env`

Se l'azienda ha gia' un file `.env` pronto (lo fornisce chi amministra il sistema),
fattelo indicare e copialo alla radice del repo col nome esatto `.env`; verifica i
NOMI delle variabili senza mai stampare i valori, e fai eliminare la copia esterna.
Altrimenti: `cp .env.example .env` e compila con l'utente:

- `CRM_ADAPTER`: l'id dell'adapter della fonte dati. Se e' vuoto e nessun adapter
  esiste in `scripts/bot/lib/crm/adapters/`, la fonte dati non e' ancora collegata:
  si fa dopo, con la skill `onboarding-crm` (non e' un errore del setup).
- Le credenziali dell'adapter (se esiste): chiedile una alla volta, spiegando che
  restano solo su questo computer.
- `CDP_URL`: lascia `http://127.0.0.1:9222`.

## Passo 5 — Chrome dedicato e login

Lancia `scripts/chrome-cdp/launch-chrome-cdp.sh` (Windows: `.cmd`). Si apre una
finestra Chromium con profilo separato. **Il login sui portali lo fa l'utente, mai tu**
(L-001). Se nessun portale e' ancora onboardato, basta che la finestra si apra.

## Passo 6 — Verifica finale

```bash
node scripts/bot/bot.js --check
```

Leggi l'esito e spiegalo in parole semplici. Su un repo appena adottato e' normale
che "fonte dati" sia KO (adapter da creare con `onboarding-crm`) e che i portali
onboardati siano "nessuno": dillo come prossimo passo, non come errore.

## Passo 7 — Chiusura

1. Riassumi cosa hai installato e cosa e' pronto.
2. Spiega come si usa d'ora in poi: aprire Claude Code/Desktop nella cartella del
   progetto e scrivere in linguaggio naturale (skill `assistente-pratiche`).
3. Indica i due onboarding rimasti, nell'ordine: prima la fonte dati
   (`onboarding-crm`), poi il primo portale (`onboarding-portale`).
