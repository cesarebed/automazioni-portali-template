# Automazioni Portali — template

Template **Claude-native** per automatizzare la compilazione di pratiche su portali web
a partire dai dati del gestionale/CRM dell'azienda. Nasce come estrazione anonimizzata
di un sistema in produzione (pratiche compilate su portali istituzionali per un'azienda
reale): architettura e regole sono collaudate sul campo, i contenuti specifici del
business d'origine sono stati rimossi. Il repo parte **vergine**: nessuna fonte dati
collegata, nessun portale mappato. Entrambi si aggiungono con onboarding guidati.

## Come si usa (regola numero uno)

Quattro skill, due pubblici:

- **`skills/assistente-pratiche`** — il front per l'**operatore**: ogni richiesta sulle
  pratiche passa da qui, in linguaggio naturale ("avvia la pratica X per Mario Rossi",
  "a che punto siamo"). La skill orchestra tutto e parla semplice, senza tecnicismi.
  Non lanciare il bot a mano se non per sviluppo/diagnosi.
- **`skills/setup`** — installazione guidata su una macchina nuova (strumenti,
  dipendenze, `.env`, browser dedicato, verifica).
- **`skills/onboarding-crm`** — collega la **fonte dati** dell'azienda: si scrive un
  adapter (da `scripts/bot/lib/crm/adapters/_template.js`) contro l'API del gestionale,
  in una sessione guidata col referente tecnico.
- **`skills/onboarding-portale`** — insegna al sistema un **portale nuovo**: sessione
  live supervisionata, cattura, spec, manifest campi, plugin deterministico.

Sotto il cofano: `scripts/bot` (Playwright deterministico), Chrome dedicato via CDP
(login 2FA persistente, `scripts/chrome-cdp/`), un adapter per la fonte dati
(`scripts/bot/lib/crm/`), un plugin per portale (`scripts/bot/lib/portali/<id>/`).

## IL SISTEMA IMPARA — protocollo obbligatorio

1. **`data/learnings.md`** — la base di conoscenza. Si LEGGE a inizio sessione, si
   AGGIORNA ogni volta che si impara qualcosa. Voci `[L-nnn]` datate: si
   **sostituiscono** citando la vecchia (che resta, marcata "superata"), non si
   cancellano. Cancellazione solo dai manutentori (elencati in
   `.github/workflows/guard-learnings.yml`) e solo per dati sensibili finiti dentro per
   errore, duplicati o archivio; la guardia CI ripristina le rimozioni altrui.
   Partizione: `data/learnings.md` tiene protocollo, regole trasversali e
   infrastruttura condivisa; i gotcha di un portale stanno in
   `data/learnings/<portale>.md`. Id `[L-nnn]` globali e unici sull'unione dei file.
2. **`data/pratiche_ledger.json`** — lo stato di ogni pratica su ogni portale, tra le
   sessioni. Se non e' nel ledger, non e' successo.
3. **Incident**: quando un bot di portale si blocca, produce un record strutturato +
   artefatti (screenshot, albero accessibilita', html) in `runtime/runs/`. Un incident
   non risolto e' un debito: si diagnostica, si fixa (codice verificato sul portale
   vivo, o regola nei learnings), si marca risolto, si committa.

**Il git log e' la storia di cio' che il sistema ha imparato**: ogni fix/learning va
committato con un messaggio che spiega il caso. Mai correggere senza committare.

## Push su `main` (convenzione)

Salvaguardia di **convenzione**, non vincolo tecnico. Chi opera si riconosce
dall'identita' git della macchina (`git config user.name`/`user.email`):

- **I manutentori** (gli stessi elencati nella guardia CI): dopo ogni commit su `main`,
  push diretto su `origin/main`, per qualsiasi file.
- **Chiunque altro** (o identita' non confermabile): auto-push SOLO per commit che
  toccano esclusivamente `data/learnings.md`, `data/learnings/` e
  `data/pratiche_ledger.json`. Codice o mix: commit locale, niente push, si passa da PR.

Vale solo per push diretti su `main` di questo repo. Force-push, reset, riscrittura
storia: sempre da confermare. In caso di dubbio, non pushare (fail-safe).

## Regole ferree (non negoziabili)

- **Mai indovinare** (L-002): dato mancante o illeggibile = segnala e fermati. Sempre,
  su ogni portale. Le inconsistenze si gestiscono nel preflight, prima del browser.
- **Inoltro** (L-006): un portale appena onboardato NON inoltra da solo. L'inoltro
  automatico si sblocca per-portale solo quando la sua **salvaguardia di verifica**
  (rileggere dal portale cio' che risulta compilato e confrontarlo con l'atteso) e'
  stata definita nella spec, codificata nel plugin e validata su una pratica
  supervisionata. Fino ad allora: il bot compila e si ferma, l'inoltro lo conferma un
  umano per-pratica.
- **Login 2FA** (L-001): lo fa l'operatore nel Chrome dedicato (profilo persistente,
  `scripts/chrome-cdp/`). Claude non tenta mai login e non tocca credenziali.
- **Dati personali** (L-004): documenti dei clienti in memoria durante il fill; su
  disco solo in `runtime/` (gitignorato), da cancellare a pratica chiusa. Mai
  committare dati di clienti, token, identificativi reali. Nel ledger solo
  nome/identificativi pratica (dati gia' presenti nella fonte dati dell'azienda).
- **Output per l'operatore**: linguaggio semplice, niente em-dash, niente tecnicismi
  (contratto di output nella skill `assistente-pratiche`).
- **Azioni critiche in cattura**: durante gli onboarding ogni azione irreversibile
  (Salva, Genera, Invia, Elimina) e' gated a mano dal referente tecnico.

## Documenti vivi

- `data/learnings.md` (+ `data/learnings/<portale>.md`) — conoscenza operativa
- `data/pratiche_ledger.json` — stato pratiche
- `data/manifests/<portale>.json` — mappatura campi fonte dati -> portale (fonte di
  verita', prodotta dall'onboarding)
- `docs/flow-<portale>-<flusso>.md` — la spec deterministica di ogni flusso onboardato,
  passo-passo verificato: se un fix cambia il flusso, va aggiornata

## Setup nuova macchina

Il percorso completo e guidato e' la skill `setup`. In sintesi:

1. `cp .env.example .env` e compilare (adapter della fonte dati e sue credenziali,
   `CDP_URL`).
2. `cd scripts/bot && npm install && npx playwright install chromium`
3. Chrome dedicato: `scripts/chrome-cdp/launch-chrome-cdp.sh`, login sui portali una
   volta.
4. Verifica: `node scripts/bot/bot.js --check`
