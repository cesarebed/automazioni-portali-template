# Manifest campi per portale

Un file `<portale>.json` per portale onboardato: la **fonte di verita'** della
mappatura tra i campi che il portale chiede e da dove si prendono. Prodotto dalla
skill `onboarding-portale` (le mappature proposte in cattura e confermate dal
referente), letto dal preflight e dal filler del plugin.

Struttura consigliata:

```json
{
  "portale": "<id>",
  "campi": [
    {
      "campo_portale": "Etichetta esatta a video",
      "fonte": "crm | documento | fisso | manuale",
      "campo_crm": "nome del campo nella fonte dati (se fonte=crm)",
      "valore": "valore fisso (se fonte=fisso)",
      "documento": "quale allegato e cosa leggerci (se fonte=documento)",
      "obbligatorio": true,
      "note": "gotcha, formato atteso, regole di calcolo"
    }
  ],
  "documenti_richiesti": [
    { "chiave": "identita", "match": "regex sul nome allegato nella fonte dati", "note": "" }
  ],
  "rami_bloccanti": [
    { "condizione": "campo/valore che il flusso non gestisce", "azione": "stop, girare all'operatore" }
  ]
}
```

Niente dati personali qui dentro: solo nomi di campi, regole e regex. I valori veri
viaggiano a runtime (memoria o `runtime/`, gitignorato, L-004).
