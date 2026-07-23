# Learnings — base di conoscenza che cresce ad ogni pratica

Questo file e' la **memoria operativa del sistema**: ogni blocco risolto, ogni caso non
standard incontrato, ogni regola decisa dall'operatore finisce qui. La skill
`assistente-pratiche` lo **legge a inizio sessione** e lo **aggiorna** (con commit)
ogni volta che impara qualcosa. E' cosi' che il sistema migliora da solo: il codice
gestisce i casi codificati, questo file gestisce il giudizio.

Formato di ogni voce: `[L-nnn]` id progressivo, data, **regola** in una riga, contesto,
origine (chi l'ha decisa o come e' stata scoperta). Regola di default: le voci **si
sostituiscono**, non si cancellano. Se una regola cambia, si aggiunge la voce nuova che
la sostituisce citando la vecchia, e la vecchia resta marcata "superata" (il valore e'
spesso la storia della correzione, non solo la regola attuale). La **cancellazione** e'
un atto deliberato riservato ai manutentori, solo per: dati sensibili per errore,
duplicati/spazzatura, archiviazione di voci superate. Nessuna cancellazione silenziosa
da parte di altri: una guardia automatica la ripristina (su tutti i file dei learnings,
comune e per-portale).

## Organizzazione (partizione per portale)

I learning sono divisi per **ambito**, cosi' chi lavora un portale carica solo cio' che
gli serve senza il rumore degli altri. Gli id `[L-nnn]` restano **globali e unici** su
tutti i file (un id vive in un file solo; i riferimenti "vedi L-nnn" valgono anche tra
file).

- **Questo file (`data/learnings.md`)** — il **comune**, sempre caricato: il protocollo
  qui sopra, le **regole trasversali** (valgono per tutti i portali) e i learning
  dell'**infrastruttura condivisa** (fonte dati, Chrome CDP, lettura documenti,
  orchestratore).
- **`data/learnings/<portale>.md`** — gotcha e regole specifici di un portale
  onboardato. Il file nasce durante l'onboarding del portale.

## Regole trasversali (valgono per tutti i portali)

Le voci qui sotto sono **ereditate dal sistema in produzione da cui questo template e'
stato estratto**, dove sono state scoperte e verificate sul campo: sono infrastruttura
o giudizio che vale per qualsiasi business e qualsiasi portale.

- **[L-001] Login sempre e solo umano.** L'operatore fa il login nel Chrome dedicato
  (profilo persistente); Claude/bot non tenta mai login, non tocca credenziali, non
  compila mai campi password. La sessione resta viva tra i run grazie al profilo.
  Origine: regola ferrea del sistema d'origine, ereditata.
- **[L-002] Mai indovinare.** Dato mancante, illeggibile o incoerente = segnala e
  fermati. Nessun valore "plausibile" inventato, su nessun campo di nessun portale. Le
  inconsistenze si gestiscono nel preflight, prima di aprire il browser. Origine:
  regola ferrea del sistema d'origine, ereditata.
- **[L-003] Per il CDP si usa il Chromium di Playwright, non il Google Chrome stock.**
  Build recenti di Chrome mancano di comandi CDP che Playwright usa in
  `connectOverCDP` (verificato sul campo: "Browser.setDownloadBehavior ... not
  supported"). `launch-chrome-cdp.sh` lo gestisce da solo; override con `CHROME_BIN`
  solo con un browser compatibile. Origine: incident risolto nel sistema d'origine,
  ereditato.
- **[L-004] Dati personali fuori dal repo.** Documenti e record dei clienti: in memoria
  durante il fill quando possibile; su disco solo in `runtime/` (gitignorato) e si
  cancellano a pratica chiusa. Mai committare dati di clienti o token; nel ledger solo
  nome/identificativi pratica. Origine: regola ferrea del sistema d'origine, ereditata.
- **[L-005] Attenzione alle bozze doppie.** Molti portali salvano bozze lato server:
  ricompilare da zero senza controllare le bozze esistenti crea duplicati difficili da
  sanare. Prima di compilare, verificare sempre se esiste gia' una bozza per quel
  cliente e decidere (riprendi o elimina, con conferma). Origine: caso reale del
  sistema d'origine, ereditato.
- **[L-006] Inoltro automatico solo con salvaguardia codificata.** Un portale appena
  onboardato non inoltra da solo: serve prima una verifica automatica pre-inoltro
  specifica del portale (rileggere dal portale cio' che risulta compilato e
  confrontarlo con l'atteso), definita nella spec, codificata nel plugin e validata su
  una pratica supervisionata. Fino ad allora l'inoltro lo conferma un umano
  per-pratica. Origine: decisione di progetto del sistema d'origine, ereditata.
