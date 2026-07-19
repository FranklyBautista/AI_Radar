---
name: ai-radar-news-signals
description: Convert recent artificial-intelligence news into AI Radar signals for builders. Use when the user asks for AI news, latest AI developments, "noticias de inteligencia artificial", or asks to save/search/structure AI news as AI Radar signals, snapshots, daily JSON, evidence, impact, action, or status.
---

# AI Radar News Signals

Use this skill to turn current AI news into concise, verifiable signals. Always browse the web for news requests because recency is central to the task.

When an AI Radar source registry exists in Notion, treat it as the primary source configuration. Cache the active source list in the repo at `config/sources.json` before searching so the run is reproducible and reviewable.

## Workflow

1. Inspect the repo first. Confirm whether `config/sources.json`, contracts, scripts, or prior daily snapshots already exist.
2. Load sources from Notion first:
   - Search Notion for the `AI Radar Sources` database.
   - Fetch the matching database to get its data source URL and exact schema.
   - Query active rows from that data source. Treat `Estado = "Listo"` as active unless the schema contains an explicit `activa`/`activo` field.
   - Read at least these properties when present: source name, `Tipo`, `Estado`, `URL`, `Prioridad`, and `Notas`.
3. Generate or refresh `config/sources.json` as a cache of the active Notion sources. Keep it deterministic: sorted by `Tipo` and source name, UTF-8 JSON, two-space indentation, no secrets.
4. If Notion does not respond, cannot be queried, or the database is missing:
   - Report the fallback explicitly in the final answer.
   - If an existing `config/sources.json` exists, use it and set `source_registry`/runtime note to cached fallback.
   - If no cache exists, use a minimal built-in fallback only for the current run.
5. Group active sources by subagent before searching when possible: `fuente_oficial`, `repo_tecnico`, `comunidad`, and `medio_secundario`.
6. Search current sources for recent AI news. Prefer primary sources and reputable outlets; compare at least two search angles such as product launches, regulation, research, infrastructure, and market/geopolitics.
   - For `The Batch`, do not infer the latest issue from a search-engine index or a single visible card. Run `node scripts/recopilar_the_batch.mjs --as-of YYYY-MM-DD` and use the structured editions embedded by its canonical homepage.
   - Preserve the script's `latest.url`, `latest.publication_date`, `status`, and `eligible_for_signal` as collection evidence. If the status is `desactualizada` or `inconsistente`, report it and do not create a signal from that source.
7. Select the five most important items by practical builder impact, not novelty alone.
8. Normalize each item into an AI Radar signal with `fuente`, `evidencia`, `impacto`, `accion`, `estado`, optional `etiquetas`, and optional `confianza`.
9. If the user asks to save the result, reuse `contracts/ai-radar-signal.schema.json` if present. If no AI Radar contract exists, create one before saving data.
10. Save daily snapshots under `data/daily/YYYY-MM-DD.json` unless the repo already has a different convention.
11. When the user asks to persist, guardar, subir, sincronizar, or save to Supabase, delegate persistence to the local `guardar-senales-airadar` skill after writing the reproducible JSON snapshot. Do not write directly to Supabase from this news-search skill.
12. Validate JSON syntax after writing files. Do not invent commands in documentation if they do not exist in the repo.

## Output Rules

- Include source links in conversational answers.
- Mention the exact search or snapshot date when using recent news.
- Mention whether sources came from Notion, `config/sources.json`, or built-in fallback.
- If Notion failed or was unavailable, include a short fallback note with the reason and what source set was used.
- Keep evidence factual and short; avoid unsupported extrapolation.
- Use Spanish field names when the user writes in Spanish or the repo uses Spanish naming.
- Mark low-confidence items explicitly when the source is secondary, paywalled, weakly corroborated, or geopolitically sensitive.

## Saving JSON And Persistence

`data/daily/YYYY-MM-DD.json` remains the local reproducible snapshot. Supabase is the consultable persistence layer and must be written only through `POST /api/signals/save`.

When creating a new contract, keep it small and compatible with the current fields in `contracts/ai-radar-signal.schema.json`.

Recommended files:

- `contracts/ai-radar-signal.schema.json`
- `data/daily/YYYY-MM-DD.json`

Do not save secrets, generated reports, screenshots, build output, caches, or unrelated automation.
