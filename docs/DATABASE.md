# Base de datos y persistencia

La definición ejecutable está en
[`supabase/airadar_persistence.sql`](../supabase/airadar_persistence.sql). La
API usa Supabase mediante PostgREST y la función RPC
`save_airadar_snapshot(jsonb)`.

## Modelo

```text
airadar_runs 1 ──── N airadar_signals 1 ──── N airadar_sources
```

### `airadar_runs`

Representa una ejecución o snapshot lógico de AI Radar.

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | Clave primaria generada por Postgres. |
| `snapshot_date` | `date` | Fecha declarada por el snapshot. |
| `query` | `text` | Consulta usada para la recolección. |
| `language` | `text` | Idioma del snapshot. |
| `criteria` | `text` | Criterio editorial o de búsqueda. |
| `contract_version` | `text` | Versión del contrato de entrada. |
| `generated_at` | `timestamptz` | Momento de generación, si existe. |
| `metadata` | `jsonb` | Metadatos internos del proceso. |
| `created_at`, `updated_at` | `timestamptz` | Auditoría técnica de la fila. |

La restricción única sobre `snapshot_date`, `query`, `language`, `criteria` y
`contract_version` identifica el mismo snapshot al reintentarlo.

### `airadar_signals`

Contiene las señales normalizadas de un run.

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | Clave primaria interna. |
| `run_id` | `uuid` | Referencia a `airadar_runs`; elimina señales huérfanas en cascada. |
| `signal_id` | `text` | Identificador estable del contrato. |
| `title` | `text` | Título de la señal. |
| `evidence` | `text` | Evidencia resumida. |
| `impact` | `text` | Por qué importa. |
| `action` | `text` | Acción sugerida. |
| `status` | `text` | Estado del contrato. |
| `confidence` | `text` | `alta`, `media`, `baja` o nulo. |
| `tags` | `text[]` | Etiquetas normalizadas. |
| `created_at`, `updated_at` | `timestamptz` | Auditoría técnica de la fila. |

La combinación `run_id + signal_id` es única. Los estados y niveles de
confianza están restringidos por `CHECK`.

### `airadar_sources`

Contiene la fuente que respalda cada señal.

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | Clave primaria. |
| `signal_row_id` | `uuid` | Referencia a `airadar_signals`. |
| `name` | `text` | Nombre visible de la fuente. |
| `url` | `text` | URL obligatoria. |
| `publication_date` | `date` | Fecha de publicación, si existe. |
| `created_at`, `updated_at` | `timestamptz` | Auditoría técnica de la fila. |

La combinación `signal_row_id + url` es única y evita repetir la misma fuente
para una señal.

## Índices y restricciones

- `airadar_runs_latest_idx` ordena por fecha descendente y actualización para
  resolver la lectura del run más reciente.
- Las claves foráneas usan `on delete cascade` para mantener la consistencia
  de un snapshot completo.
- Las restricciones únicas permiten reintentos idempotentes.
- Los estados y confianza se restringen en la base además de validarse en la
  API.

## Seguridad y acceso

- Las tres tablas tienen Row Level Security habilitado.
- Se revocan privilegios a `public`, `anon` y `authenticated`.
- `service_role` recibe los permisos operativos necesarios.
- La RPC es `security definer`, fija `search_path = public` y solo se ejecuta
  con `service_role`.
- La clave de Supabase nunca debe llegar al navegador.

## Persistencia atómica

`save_airadar_snapshot` recibe el snapshot completo como `jsonb`, hace upsert
del run, luego upsert de cada señal y de su fuente, y devuelve conteos de
recibidas, insertadas, actualizadas y fuentes. Al ejecutarse como una función
de base de datos, el guardado se trata como una única operación transaccional.

La API no expone SQL al cliente: llama a
`POST /rest/v1/rpc/save_airadar_snapshot` con una clave server-side.

## Pendientes del modelo

- No existe todavía un modelo persistente para agrupaciones o duplicados.
- No hay auditoría de cambios editoriales ni usuarios operadores.
- El ranking calculado por el frontend no se guarda como historial.
- La detección de duplicados y la configuración de pesos pertenecen a fases
  posteriores.
