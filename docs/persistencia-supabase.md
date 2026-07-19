# Persistencia Supabase

AI Radar guarda snapshots locales en `data/daily/YYYY-MM-DD.json` y puede persistirlos en Supabase mediante una API server-side.

## Esquema

El SQL revisable esta en `supabase/airadar_persistence.sql`.

Tablas:

- `airadar_runs`: una ejecucion por fecha, busqueda, idioma, criterio y version de contrato.
- `airadar_signals`: senales normalizadas e idempotentes por `run_id + signal_id`.
- `airadar_sources`: fuente asociada a cada senal, con URL obligatoria.

Las tres tablas activan RLS desde el inicio. Los privilegios de `anon` y `authenticated` se revocan explicitamente y no hay policies publicas de escritura; la API debe usar una clave secreta de Supabase solo en servidor.

## Variables

Server-only:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (recomendada, formato `sb_secret_...`)
- `AIRADAR_WRITE_TOKEN`

Compatibilidad temporal:

- `SUPABASE_SERVICE_ROLE_KEY` puede usarse si el proyecto aun depende de la clave legacy.

Opcional:

- `SUPABASE_PROJECT_REF`
- `AIRADAR_SAVE_ENDPOINT`

No usar `NEXT_PUBLIC_` para claves privadas.

El archivo `.env.example` contiene la URL y el ref no secretos del entorno de desarrollo. Los valores secretos quedan vacios intencionalmente.

## API

Endpoint:

```text
POST /api/signals/save
Authorization: Bearer $AIRADAR_WRITE_TOKEN
```

La API acepta dos credenciales server-side:

- `AIRADAR_WRITE_TOKEN`, para automatizaciones que ya gestionan ese secreto.
- `VERCEL_OIDC_TOKEN`, token temporal firmado por Vercel y limitado al usuario, equipo y proyecto AI Radar. Es la opcion recomendada para ejecuciones manuales desde el repo.

Entrada: snapshot compatible con `contracts/ai-radar-signal.schema.json`.

Respuesta esperada:

```json
{
  "runs": 1,
  "run_id": "...",
  "senales_recibidas": 5,
  "senales_guardadas": 5,
  "senales_actualizadas": 0,
  "fuentes_guardadas": 5,
  "errores": []
}
```

## Guardado desde repo

Con la API corriendo localmente:

```bash
AIRADAR_WRITE_TOKEN=... python3 scripts/guardar_senales_airadar.py data/daily/2026-07-06.json
```

Con una API desplegada:

```bash
AIRADAR_WRITE_TOKEN=... python3 scripts/guardar_senales_airadar.py data/daily/2026-07-06.json --endpoint https://ai-radar-tawny.vercel.app/api/signals/save
```

Sin descargar secretos sensibles, usando una shell temporal limpia y la identidad OIDC de Vercel CLI `56.3.2`:

```bash
npm run save:production -- data/daily/2026-07-18.json
```

Vercel mantiene `SUPABASE_SECRET_KEY` y `AIRADAR_WRITE_TOKEN` no legibles fuera del runtime. El comando anterior crea un directorio temporal con solo el vínculo público del proyecto, evita que un `.env.local` antiguo reemplace la identidad recién emitida y entrega al proceso local únicamente el token OIDC efímero. La API valida firma, emisor, audiencia, equipo, proyecto, entorno local y usuario antes de permitir la escritura.

## Entorno remoto de desarrollo

El plan Free no admite branches. Se uso el fallback previsto y se creo un proyecto separado:

- Nombre: `AI Radar Dev`
- Project ref: `pcgwskwakqejxdbpfasy`
- URL: `https://pcgwskwakqejxdbpfasy.supabase.co`
- Migracion aplicada: `create_airadar_persistence`

El snapshot `data/daily/2026-07-06.json` se guardo dos veces durante la validacion remota. Los conteos permanecieron en un run, cinco senales, cinco fuentes y cero senales duplicadas.

Los advisors de performance no reportaron hallazgos. El advisor de seguridad solo reporto el aviso informativo `rls_enabled_no_policy` para las tres tablas; es el resultado esperado porque no se habilita acceso publico y la escritura usa una clave secreta solo desde servidor.

Referencia del aviso: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Estado operativo

- Proyecto Vercel: `frankly-bautistas-projects/ai-radar`.
- Endpoint Production desplegado: `https://ai-radar-tawny.vercel.app/api/signals/save`.
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY` y `AIRADAR_WRITE_TOKEN` estan configuradas en Vercel.
- La API fue validada con respuestas `405`, `401` y `400` para metodo, autenticacion y snapshot invalido.
- El snapshot diario fue guardado dos veces a traves de Production; ambos reintentos actualizaron las cinco senales existentes sin crear duplicados.
- No quedan pendientes operativos para la persistencia inicial.
