# API de AI Radar

Las funciones viven en `api/` y están pensadas para desplegarse como Vercel
Functions. La API usa JSON y devuelve mensajes de error seguros; los detalles
de Supabase se registran únicamente en el servidor.

## `GET /api/signals/latest`

Devuelve el snapshot más reciente reconstruido desde Supabase.

### Autenticación

No requiere un token de aplicación en la ruta pública. La función usa
`SUPABASE_URL` y `SUPABASE_SECRET_KEY` o
`SUPABASE_SERVICE_ROLE_KEY` exclusivamente en el servidor.

### Respuesta `200`

```json
{
  "contract_version": "1.0.0",
  "fecha": "2026-07-18",
  "generado_en": "2026-07-18T21:28:27-04:00",
  "busqueda": {
    "consulta": "últimas noticias de IA",
    "idioma": "es",
    "criterio": "fuentes activas"
  },
  "senales": [
    {
      "id": "senal-ejemplo",
      "titulo": "Señal de ejemplo",
      "fuente": {
        "nombre": "Fuente oficial",
        "url": "https://example.com",
        "fecha_publicacion": "2026-07-18"
      },
      "evidencia": "Anuncio oficial verificable.",
      "impacto": "Puede cambiar un flujo de trabajo.",
      "accion": "Evaluar el flujo con un caso pequeño.",
      "estado": "nueva",
      "confianza": "alta",
      "etiquetas": ["builders"]
    }
  ]
}
```

El contrato completo está en
[`contracts/ai-radar-signal.schema.json`](../contracts/ai-radar-signal.schema.json).

### Estados

- `200`: snapshot válido.
- `404`: no existe un run o el run más reciente todavía no tiene señales.
- `405`: método distinto de `GET`; incluye `Allow: GET`.
- `500`: configuración ausente o error interno. La respuesta no incluye el
  mensaje de Supabase.

La respuesta establece `Cache-Control: no-store`.

## `POST /api/signals/save`

Valida y guarda un snapshot completo.

### Autenticación

Requiere:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Se admite una de estas credenciales:

1. `AIRADAR_WRITE_TOKEN`, token estático de automatización.
2. `VERCEL_OIDC_TOKEN`, token temporal firmado por Vercel y limitado al equipo,
   proyecto, entorno y usuario esperados.

### Entrada

El body debe ser un objeto compatible con el contrato. Requiere:

- `contract_version` y `fecha` en formato `YYYY-MM-DD`;
- `busqueda.consulta`, `busqueda.idioma` y `busqueda.criterio`;
- al menos una señal;
- identificador, título, evidencia, impacto, acción y estado;
- fuente con nombre y URL `http` o `https`.

### Respuesta `200`

```json
{
  "runs": 1,
  "run_id": "uuid",
  "senales_recibidas": 5,
  "senales_guardadas": 5,
  "senales_actualizadas": 0,
  "fuentes_guardadas": 5,
  "autenticacion": "static-token",
  "errores": []
}
```

### Estados y errores

- `200`: snapshot guardado o actualizado idempotentemente.
- `400`: JSON inválido o snapshot que no cumple las reglas; puede incluir
  `details` con rutas de validación.
- `401`: falta el bearer token o no supera la autorización.
- `405`: método distinto de `POST`; incluye `Allow: POST`.
- `500`: variables de Supabase ausentes o fallo de persistencia.

Ejemplo de error de validación:

```json
{
  "error": "Snapshot invalido",
  "details": ["senales[0].fuente.url debe ser una URL HTTP valida"]
}
```

## Variables de entorno

| Variable | Uso | Alcance |
| --- | --- | --- |
| `SUPABASE_URL` | URL del proyecto Supabase. | Server-side. |
| `SUPABASE_SECRET_KEY` | Clave recomendada para PostgREST/RPC. | Server-side. |
| `SUPABASE_SERVICE_ROLE_KEY` | Fallback legacy. | Server-side. |
| `AIRADAR_WRITE_TOKEN` | Token estático opcional de escritura. | Server-side/automatización. |

No se deben incluir estas variables en respuestas, bundles del frontend o
logs.
