# Per-portal field manifests

One `<portal>.json` file per onboarded portal: the **source of truth** for the
mapping between the fields the portal asks for and where each value comes from.
Produced by the `portal-onboarding` skill (mappings proposed during capture and
confirmed by the technical contact), read by the plugin's preflight and filler.

Suggested structure:

```json
{
  "portal": "<id>",
  "fields": [
    {
      "portal_field": "Exact on-screen label",
      "source": "crm | document | fixed | manual",
      "crm_field": "field name in the data source (if source=crm)",
      "value": "fixed value (if source=fixed)",
      "document": "which attachment and what to read from it (if source=document)",
      "required": true,
      "notes": "gotchas, expected format, calculation rules"
    }
  ],
  "required_documents": [
    { "key": "identity", "match": "regex on the attachment name in the data source", "notes": "" }
  ],
  "blocking_branches": [
    { "condition": "field/value the flow does not handle", "action": "stop, hand over to the operator" }
  ]
}
```

No personal data in here: only field names, rules, and regexes. Actual values travel
at runtime (memory or `runtime/`, gitignored, L-004).
