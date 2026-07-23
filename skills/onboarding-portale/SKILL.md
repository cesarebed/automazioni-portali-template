---
name: onboarding-portale
description: |
  Processo con cui il sistema impara ad automatizzare un PORTALE WEB NUOVO (un sito
  istituzionale, di un ente, di un fornitore) per le pratiche dell'azienda. E' una
  sessione da fare col REFERENTE TECNICO, non con l'operatore finale: una sessione
  live in cui il referente guida la navigazione sul portale vero e Claude esegue,
  cattura e documenta ogni passo, finche' il flusso non diventa una spec, un manifest
  campi e un plugin deterministico in scripts/bot/lib/portali/<id>/. Invisibile
  all'operatore finale: l'output e' un portale in piu' dietro lo stesso front
  assistente-pratiche. Attivala per onboardare un portale o un flusso nuovo; NON per
  lavorare pratiche su portali gia' onboardati.
allowed_tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Onboarding di un portale nuovo — cattura live

Questo e' il processo con cui il sistema impara un portale che **nessuno ha ancora
mappato**. Non si scopre cliccando a caso su pratiche vere: si fa una **sessione live
supervisionata** in cui il **referente guida** (sa cosa fare sulla pagina) e **tu
esegui, catturi e documenti**. E' il metodo con cui e' nato il sistema d'origine di
questo template, reso ripetibile.

Prerequisito: la fonte dati e' gia' collegata (skill `onboarding-crm`); serve per
scaricare il record del cliente di test e proporre le mappature.

**Chi c'e' dall'altra parte:** il referente tecnico. Durante la cattura il registro
puo' essere tecnico. Ma cio' che produci (spec, plugin, report) deve onorare il
contratto per l'operatore finale: quando il portale andra' in produzione, l'operatore
usera' sempre e solo il front `assistente-pratiche`, in linguaggio semplice.
L'onboarding e' invisibile a lui by design.

## Fase 0 — Intervista (prima di toccare qualsiasi cosa)

Fatti dire dal referente, e scrivi le risposte in testa al file di cattura:

1. **Quale portale e quale pratica**: URL, nome del flusso, cosa produce a fine corsa
   (protocollo, ricevuta, PDF?).
2. **Login**: chi ha le credenziali, che 2FA usa il portale. Il login lo fara' il
   referente nel Chrome dedicato; tu non tocchi mai credenziali (L-001).
3. **Cliente di test**: una pratica REALE adatta a questo flusso (la indica il
   referente).
4. **Dove stanno i dati**: i campi che il portale chiede esistono nella fonte dati?
   Ce ne sono da creare? C'e' un segnale (stato/etichetta) che dice "pratica da fare"
   (servira' per il routing)?
5. **Documenti**: cosa chiede di caricare il portale, e come si chiamano gli allegati
   corrispondenti nella fonte dati.
6. **Documento di arricchimento**: se esiste una guida/manuale del tipo pratica,
   fattelo dare e leggilo prima: alimenta le tue proposte. Il documento informa, non
   decide.
7. **Fin dove si arriva oggi**: la pratica di cattura si inoltra per davvero o ci si
   ferma prima? (Di norma: prima cattura fino alla soglia dell'inoltro, e' il
   referente a premere l'ultimo bottone.)

## Fase 1 — Preparazione

1. **Ambiente**: `node scripts/bot/bot.js --check` verde (tranne, ovviamente, la voce
   portali).
2. **Blocco .env del portale**: aggiungi a `.env` (e come commento in `.env.example`)
   le variabili del portale (es. `<PORTALE>_PORTAL_URL=`). Niente credenziali in
   chiaro.
3. **Chrome dedicato**: `scripts/chrome-cdp/launch-chrome-cdp.sh`; il referente fa il
   login sul portale in quella finestra. Verifica di essere sulla sessione loggata
   prima di iniziare.
4. **Dati del cliente di test**: scarica il record COMPLETO e la lista allegati:
   `node scripts/bot/tools/fetch-record.js "<cliente>" --allegati --out`
   (finisce in `runtime/`, gitignorato, L-004). Ti serve per caricare i documenti
   quando il portale li chiede e per proporre le mappature.

## Fase 2 — Cattura live: i 5 principi (il cuore del metodo)

1. **Codice prima, screenshot solo se serve.** Il tuo occhio principale e' la
   fotografia TESTUALE della pagina (albero di accessibilita' / DOM): veloce, e ti da'
   etichette esatte, tipo dei campi, opzioni dei menu, obbligatorieta'. Lo screenshot
   vero solo quando il testo non basta (icone, stato visivo, layout ambiguo) o per
   mostrare qualcosa al referente. Logga tutto man mano.

2. **Chiedi a ogni step, e aspetta prima delle azioni critiche.** Non conosci questo
   portale: fatti dire dal referente cosa fare a ogni passo. Prima di qualsiasi azione
   critica o irreversibile (Salva, Genera, Invia, Inoltra, Elimina) **fermati e
   aspetta il via esplicito**. In cattura NON vale nessun automatismo: si sta
   imparando su un portale vero con una pratica vera.

3. **Proponi tu la mappatura, proattivamente.** Per ogni campo che compili proponi la
   corrispondenza probabile ("questo lo prenderei dal campo <X> della fonte dati",
   "questo sembra da documento", "questo pare un valore fisso dell'azienda") e chiedi
   conferma. Il referente corregge; la risposta diventa la riga del manifest.

4. **Documenta ogni clic. Se non sai, chiedi.** Campo o passo incerto = fermati e
   chiedi, mai indovinare (L-002).

5. **Sfrutta il documento di arricchimento, se c'e'**, per valori attesi, sequenze e
   casi particolari, sempre sottoponendo al referente cio' che ne deduci.

### Il file di cattura vivo

Tieni `runtime/onboarding-<portale>-<flusso>-capture.md` (gitignorato) aggiornato in
tempo reale. Una riga per azione, e per ogni campo:

```
[step N] <azione> — <pagina/sezione>
  campo: "<etichetta esatta a video>"
  tipo: testo | menu | data | radio | checkbox | upload
  opzioni: [se menu, la lista]
  obbligatorio: si/no
  valore inserito: <cosa hai messo>
  mappatura (proposta -> confermata): <campo fonte dati> | documento <quale> | fisso | manuale
  gotcha: <cosa aspettarsi / trappole>
```

A fine sessione, chiedi al referente anche: **cosa mostra il portale quando la pratica
e' compilata bene?** (riepilogo, sezioni spuntate, esito di validazione). Quella
risposta diventa la **salvaguardia di verifica** del plugin: senza, il portale non
potra' mai inoltrare in automatico (L-006).

## Fase 3 — Codifica (dal file di cattura agli artefatti fissi)

Ogni portale onboardato lascia sempre gli stessi pezzi:

- `docs/flow-<portale>-<flusso>.md` — la spec deterministica passo-passo, scritta dal
  file di cattura. E' un documento vivo: se un fix cambia il flusso, si aggiorna.
- `data/manifests/<portale>.json` — le mappature confermate (formato in
  `data/manifests/README.md`). Niente dati personali, solo campi e regole.
- `scripts/bot/lib/portali/<portale>/` — il plugin, copiato da `_template/`:
  `preflight` (solo dati), `compila` (filler deterministico), `verifica` (la
  salvaguardia), `inoltra`, `writeback`. Piu' la riga di registrazione in
  `lib/portali/index.js`.
- `data/learnings/<portale>.md` — i gotcha di questo portale, voci `[L-nnn]` (id
  globali, continua la numerazione dell'unione dei file).
- Il blocco del portale in `.env.example` e, se servono campi nuovi nella fonte dati,
  la nota di cosa e' stato creato.

Si riusa tutto il resto senza toccarlo: adapter della fonte dati, CDP, ledger,
learnings comuni, front `assistente-pratiche`. E' questo riuso che rende i portali
indistinguibili per l'operatore: cambia solo la cartella del plugin.

## Fase 4 — Validazione e passaggio in produzione

1. Dalla spec al codice: plugin completo, `--dry-run` pulito sul cliente di cattura.
2. **Seconda pratica dello stesso tipo, supervisionata** col bot: conferma che il
   filler regge su dati diversi. Da qui in poi il micro-apprendimento normale
   (incident -> learnings) copre il portale come gli altri.
3. **Inoltro automatico**: si sblocca (`meta.inoltroAutomatico = true`) SOLO quando la
   salvaguardia di verifica e' codificata e ha retto sulla pratica supervisionata
   (L-006). La decisione si committa con il perche'.
4. Routing: definisci col referente il segnale nella fonte dati (stato/etichetta) con
   cui `assistente-pratiche` capira' da sola che una pratica e' di questo portale.

Aspettativa da dare al referente: una sessione live di qualche ora piu' un giorno di
consolidamento per portale, non "domani mattina". Meglio dirlo che catturare male.

## Regole ferree ereditate (non negoziabili anche in cattura)

- **Mai invenzioni**: dato/passo incerto = fermati e chiedi (L-002).
- **Login sempre manuale** del referente nella finestra (L-001).
- **Azioni critiche/irreversibili gated a mano** durante la cattura (principio 2).
- **Dati personali**: dati e documenti del cliente solo in `runtime/` (gitignorato),
  da cancellare a fine sessione (L-004).
- **Tutto cio' che si impara si committa**: spec, manifest, plugin, learnings. Il git
  log e' la storia di cio' che il sistema ha imparato.
