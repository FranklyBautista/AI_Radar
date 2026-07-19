# Issue: el frontend no muestra las señales guardadas en Supabase

- Fecha del hallazgo: 2026-07-18
- Estado: cerrado (2026-07-18)
- Severidad: alta

## Evidencia

- Supabase contiene el run `9fcf0f8b-1280-415f-bffe-3102be6a16ee`, con fecha `2026-07-18`, cinco señales y cinco fuentes.
- La consulta independiente a Supabase confirmó `includes_mistral_source = true` para ese run.
- El navegador solicitó `GET /data/daily/2026-07-06.json` y recibió HTTP `200`; no realizó una lectura desde una API conectada a Supabase.
- La interfaz mostró `6 de julio de 2026` y no encontró la señal `Mistral Studio convierte prompts y skills en activos versionados`.
- `src/data-source.mjs` declara `url: "./data/daily/2026-07-06.json"` y documenta que no existe una API GET de señales.
- Capturas temporales de la prueba: `tmp/airadar-frontend/use-case-db-visibility.png` y `tmp/airadar-frontend/use-case-db-visibility-mobile.png`.

## Pasos para reproducir

1. Confirmar en Supabase que existe el run `9fcf0f8b-1280-415f-bffe-3102be6a16ee` y que contiene la fuente `Mistral AI News`.
2. Ejecutar `npm run dev`.
3. Abrir `http://127.0.0.1:4173/` en un navegador.
4. Revisar la fecha del snapshot mostrada en el encabezado.
5. Buscar `Mistral Studio convierte prompts y skills en activos versionados`.
6. Revisar la pestaña Network y localizar la petición de datos de señales.

## Resultado esperado

El frontend consulta la fuente de lectura respaldada por Supabase, muestra el run más reciente del `2026-07-18` e incluye la señal cuya fuente es `Mistral AI News`.

## Resultado actual

El frontend carga un snapshot local fijado al `2026-07-06`, muestra cinco señales antiguas y no presenta ninguna de las señales persistidas en el run nuevo.

## Archivos probables

- `src/data-source.mjs`
- `src/app.mjs`
- `api/signals/` o un endpoint de lectura nuevo, cuya ruta todavía no está definida
- `contracts/ai-radar-signal.schema.json`
- `tests/e2e/dashboard.spec.mjs`
- `playwright.config.mjs`

## Criterios de aceptación

- [x] Existe una fuente de lectura server-side que obtiene señales de Supabase sin exponer claves secretas al navegador.
- [x] El frontend deja de depender de una fecha de snapshot escrita directamente en el código.
- [x] Al abrir el radar se muestra el run más reciente disponible, incluyendo fecha, señales y fuentes.
- [x] La señal `Mistral Studio convierte prompts y skills en activos versionados` aparece con su fuente `Mistral AI News`.
- [x] Los estados de carga, vacío, error y reintento funcionan con la nueva fuente de datos.
- [x] Una prueba Playwright verifica la fecha `2026-07-18`, la señal de Mistral y la URL real consultada.
- [x] La consola y la red quedan limpias en desktop y mobile.

## Resolución y prueba

- Se agregó `GET /api/signals/latest`, que lee el run más reciente con credenciales exclusivamente server-side y reconstruye el contrato `1.0.0`.
- Se agregó el índice `airadar_runs_latest_idx` y se verificó su existencia en el proyecto Supabase `pcgwskwakqejxdbpfasy`.
- `npm test`: 11 pruebas aprobadas.
- `npm run test:e2e`: 5 pruebas aprobadas, con estados de carga, vacío, error, reintento, desktop, mobile y Axe.
- Producción: `GET https://ai-radar-tawny.vercel.app/api/signals/latest` respondió `200`, fecha `2026-07-18`, cinco señales e incluyó `Mistral AI News`.
- Navegador en producción: solicitó la URL anterior con `200`, mostró la señal de Mistral y terminó sin errores de consola, página, red ni respuestas HTTP fallidas.
- Captura temporal de verificación: `tmp/airadar-frontend/issue-1-production.png`.
