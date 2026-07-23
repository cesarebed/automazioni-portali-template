# Automazioni Portali — template

Un template **Claude-native** per costruire, senza scrivere un gestionale ne' un
server, un sistema che **compila pratiche su portali web al posto tuo**, prendendo
dati e documenti dalla fonte dati che l'azienda gia' usa (CRM, gestionale, API
interna). Pensato per qualsiasi business che ricopia a mano gli stessi dati su siti
istituzionali, di fornitori o di enti: pratiche edilizie, energetiche, assicurative,
richieste di contributi, portali della pubblica amministrazione.

E' l'estrazione anonimizzata di un sistema in produzione presso un'azienda reale:
l'architettura, le salvaguardie e il protocollo di apprendimento sono collaudati su
pratiche vere; i contenuti specifici di quel business sono stati rimossi. Il repo
parte **vergine**: si adatta al tuo business con due sessioni di onboarding guidate.

## L'idea in tre righe

1. Un **portale si insegna una volta**: una sessione guidata sul sito vero, in cui una
   persona guida e Claude esegue, cattura e codifica ogni campo. Il risultato e' una
   procedura deterministica (niente improvvisazione a runtime).
2. Da li' in poi le pratiche si avviano **con una frase** ("avvia la pratica X per
   Mario Rossi"): il sistema legge i dati dalla fonte aziendale, controlla che ci sia
   tutto PRIMA di aprire il browser, compila, verifica e aggiorna i registri.
3. Ogni intoppo risolto e ogni regola data dall'operatore vengono **scritti e
   versionati**: il sistema migliora ad ogni pratica e la conoscenza non vive nella
   testa di una persona sola.

## Le salvaguardie (il motivo per cui ci si puo' fidare)

- **Mai indovinare**: dato mancante o incoerente = il sistema si ferma e chiede, prima
  di toccare il portale.
- **Inoltro con doppia rete**: un portale appena configurato non invia mai da solo;
  l'invio automatico si sblocca solo quando il controllo di verifica di quel portale
  (rileggere dal sito cio' che risulta compilato) e' stato codificato e validato.
- **Login sempre umano**: credenziali e 2FA restano all'operatore, in un browser
  dedicato con sessione persistente. Il sistema non vede mai una password.
- **Dati personali fuori dal repo**: documenti in memoria o in cartelle gitignorate,
  puliti a pratica chiusa.

## Com'e' fatto

```
Operatore (linguaggio naturale, dentro Claude Code)
 └─ skill assistente-pratiche ........ front conversazionale
     └─ scripts/bot (Node) ........... bot Playwright DETERMINISTICO
         ├─ bot.js ................... CLI: --check (diagnosi) + run per portale
         ├─ lib/crm/ ................. contratto fonte dati + adapter per gestionale
         │    └─ adapters/_template.js  scheletro: si implementa per il TUO CRM
         ├─ lib/cdp.js ............... aggancio al Chrome dedicato via CDP
         └─ lib/portali/<id>/ ........ UN PORTALE = UNA CARTELLA (plugin):
              preflight (solo dati) · compila · verifica · inoltra · writeback
              (_template/ e' lo scheletro da copiare per ogni portale nuovo)
data/
 ├─ learnings.md .................... conoscenza operativa versionata (protocollo [L-nnn])
 ├─ manifests/<portale>.json ........ mappa campi: per ogni campo del portale, la fonte
 └─ pratiche_ledger.json ............ stato di ogni pratica tra le sessioni
skills/ ............................. setup, onboarding-crm, onboarding-portale,
                                      assistente-pratiche
```

Tutto gira sulla macchina dell'operatore dentro Claude Code/Desktop: nessun server,
nessun webhook, nessun dato che lascia l'azienda.

## Come si parte

1. **Setup** — apri il repo in Claude Code e chiedi "installa il sistema": la skill
   `setup` guida strumenti, dipendenze, `.env` e verifica (`bot.js --check`).
2. **Collega la fonte dati** — "colleghiamo il nostro CRM": la skill `onboarding-crm`
   costruisce con te l'adapter contro l'API del tuo gestionale (ricerca clienti,
   lettura record e allegati, writeback).
3. **Insegna il primo portale** — "voglio automatizzare il sito X": la skill
   `onboarding-portale` organizza la sessione live sul portale vero con una pratica
   reale; a valle il portale e' un plugin e le pratiche si avviano con una frase.

Tempi realistici: setup in mezz'ora; adapter fonte dati da mezza giornata in su (dipende
dall'API); un portale = una sessione live di qualche ora piu' un giorno di
consolidamento.

## Il sistema impara (ed e' questa la differenza)

`data/learnings.md` e' la memoria operativa: ogni blocco risolto, ogni regola
dell'operatore, ogni caso strano diventa una voce `[L-nnn]` datata e committata. Le
voci si sostituiscono citando la vecchia, non si cancellano (una guardia CI ripristina
le cancellazioni non autorizzate): il valore e' spesso la storia della correzione, non
solo la regola attuale. Il template nasce gia' con le regole trasversali ereditate dal
sistema d'origine (L-001..L-006).

Le regole complete di funzionamento sono in [CLAUDE.md](CLAUDE.md), che e' anche il
"sistema operativo" letto da Claude in ogni sessione.
