---
name: onboarding-crm
description: |
  Collega la fonte dati dell'azienda (CRM, gestionale, API interna) al sistema:
  sessione guidata col referente tecnico in cui si scrive l'adapter (da
  scripts/bot/lib/crm/adapters/_template.js) contro l'API del gestionale e lo si
  verifica su record veri. Attivala quando bisogna collegare o cambiare la fonte
  dati ("colleghiamo il nostro CRM", "il check dice che la fonte dati manca").
  NON per lavorare pratiche (assistente-pratiche) ne' per mappare un sito
  (onboarding-portale).
allowed_tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Onboarding della fonte dati (adapter CRM)

Obiettivo: a fine sessione `node scripts/bot/bot.js --check` dice OK sulla fonte dati,
e `tools/fetch-record.js` estrae un record vero. Il bot parla col gestionale SOLO
attraverso il contratto in `scripts/bot/lib/crm/index.js`: qui si implementa quel
contratto per l'API specifica dell'azienda.

## Fase 1 — Intervista (prima di scrivere codice)

Fatti dire dal referente tecnico:

1. **Che gestionale e'** e che API espone (REST/GraphQL/altro), con la documentazione
   se esiste. Se l'API la conosci gia' dalla tua formazione, proponi tu la strada e
   fattela confermare.
2. **Autenticazione**: token statico, OAuth con refresh token, API key. Come si
   ottengono le credenziali e con quali permessi minimi (lettura record e allegati,
   scrittura per il writeback).
3. **Dove vivono i clienti**: quale entita'/modulo, come si cerca (nome? id? un
   identificativo esatto tipo codice fiscale?), dove stanno gli allegati.
4. **Il writeback**: cosa va aggiornato a valle di una pratica (uno stato, una data,
   un'etichetta, una ricevuta caricata)?
5. **Un cliente di test reale** su cui verificare (i dati restano in locale, L-004).

## Fase 2 — Implementazione

1. Copia `scripts/bot/lib/crm/adapters/_template.js` in `adapters/<id>.js` (id corto,
   es. il nome del gestionale) e implementa i metodi del contratto. Linee guida nel
   template stesso: allegati sempre in Buffer (L-004), retry via `lib/http.js`,
   writeback idempotente, token gestiti in memoria con le credenziali dal `.env`.
2. Implementa anche `check()`: una chiamata leggera che prova autenticazione e lettura
   (e' cio' che rende utile `bot.js --check`).
3. Registra la classe in `lib/crm/index.js` e aggiungi al `.env` le variabili
   dell'adapter (e i loro NOMI, commentati, in `.env.example`; mai i valori).
4. `CRM_ADAPTER=<id>` nel `.env`.

## Fase 3 — Verifica su dati veri

```bash
node scripts/bot/bot.js --check                      # fonte dati OK
node scripts/bot/tools/fetch-record.js "<cliente di test>" --allegati
```

Controlla insieme al referente che i campi e gli allegati siano quelli attesi. Se il
gestionale ha stranezze (naming allegati, campi calcolati, limiti API), scrivile come
voci `[L-nnn]` nel comune `data/learnings.md` (sezione infrastruttura condivisa).

## Fase 4 — Chiusura

- Committa adapter, registrazione, `.env.example` aggiornato e eventuali learnings,
  con un messaggio che spiega il gestionale collegato e le scelte fatte.
- Cancella dal disco gli eventuali dati di test scaricati (`runtime/`, L-004).
- Prossimo passo: il primo portale, con la skill `onboarding-portale`.

## Regole ferree

- Credenziali SOLO nel `.env` locale, mai nel codice, mai committate, mai stampate.
- Dati dei clienti mai nel repo (L-004).
- Se l'API non permette qualcosa (es. niente scrittura), non aggirare: documenta il
  limite nei learnings e definisci col referente il passo manuale corrispondente.
