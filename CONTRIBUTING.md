# Contribuir a AI Radar

AI Radar se construye por fases pequeñas. Cada cambio debe dejar claro qué se
implementó, cómo se verificó y qué queda pendiente.

## Preparación

```bash
npm ci
npm run test:all
```

Para trabajar en la interfaz:

```bash
npm run dev
```

El servidor local usa `http://127.0.0.1:4173`. Las pruebas E2E sirven como
verificación del dashboard y simulan la respuesta de la API de lectura.

## Ramas

Usa ramas descriptivas basadas en el objetivo:

- `feature/<objetivo>` para una capacidad nueva;
- `fix/<problema>` para una corrección;
- `docs/<tema>` para documentación aislada;
- `test/<alcance>` para ampliar cobertura.

Ejemplo: `feature/portfolio-readiness`.

## Flujo de cambios

1. Lee `AGENTS.md` y el plan de la fase antes de editar.
2. Inspecciona los contratos, pruebas y documentación relacionada.
3. Mantén cada cambio limitado al objetivo de la fase.
4. Actualiza la documentación afectada cuando cambie un comportamiento.
5. Ejecuta las pruebas relevantes y luego `npm run test:all`.
6. Revisa el diff y confirma que no se agregaron secretos, caches, screenshots,
   videos ni salidas temporales.

## Pruebas

| Comando | Cuándo usarlo |
| --- | --- |
| `npm test` | Cambios de dominio, contrato o API. |
| `npm run test:e2e` | Cambios de interfaz, estados o accesibilidad. |
| `npm run test:all` | Verificación final antes de integrar. |
| `node scripts/recopilar_the_batch.mjs --input tests/fixtures/the-batch/homepage-inconsistent.html --as-of 2026-07-18` | Verificar el recolector con un fixture local. |
| `python3 scripts/consultar_senales.py --cantidad 5` | Revisar snapshots locales. |

No ejecutes scripts de guardado contra producción sin autorización explícita y
sin revisar primero el snapshot. Usa `AIRADAR_WRITE_TOKEN` o el flujo OIDC
temporal documentado en [`docs/persistencia-supabase.md`](docs/persistencia-supabase.md).

## Contratos y datos

- Cambios al formato de snapshot deben actualizar
  `contracts/ai-radar-signal.schema.json`, los validadores y las pruebas.
- Usa snapshots y fixtures pequeños para ejemplos reproducibles.
- No agregues datos generados como semilla durable si la fase no lo requiere.
- Las URLs de fuentes deben ser `http` o `https` y la evidencia debe poder
  rastrearse a la fuente declarada.

## Commits

Usa mensajes descriptivos en imperativo y con alcance concreto:

```text
docs: documentar flujo de persistencia Supabase
feat: validar snapshot antes de guardar
test: cubrir respuesta vacía de latest
fix: rechazar token OIDC de otro proyecto
```

Un commit debe representar un cambio coherente y no incluir archivos
temporales.

## Seguridad

- Nunca committees `.env`, tokens, claves, credenciales o respuestas con
  secretos.
- Mantén claves de Supabase únicamente en funciones server-side.
- No uses nombres `NEXT_PUBLIC_` para secretos.
- Valida entradas en los límites de API y frontend.
- Devuelve errores seguros y deja los detalles internos en logs server-side.

## Estado actual del proceso

El repositorio todavía no tiene un workflow de GitHub Actions ni linting
configurado. Hasta que se implemente la Fase 3, la verificación local con
`npm run test:all` es el control reproducible documentado.
