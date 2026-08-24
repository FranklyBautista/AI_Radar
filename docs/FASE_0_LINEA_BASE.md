# Fase 0: línea base y alcance

Fecha de registro: 2026-08-16  
Rama de trabajo: `feature/portfolio-readiness`

Este documento registra el estado del proyecto antes de iniciar las mejoras de
portafolio. La línea base permite distinguir regresiones de funcionalidades que
ya estaban pendientes.

## Instalación y verificación reproducibles

Desde una clonación limpia del repositorio:

```bash
npm ci
npm run test:all
```

Para abrir la interfaz estática localmente:

```bash
npm run dev
```

El servidor local queda disponible en `http://127.0.0.1:4173`. Las pruebas E2E
interceptan la lectura de `/api/signals/latest`; por eso no requieren secretos
ni una conexión real a Supabase.

## Resultado de la línea base

Comandos ejecutados el 2026-08-16 antes de editar la rama:

| Comando | Resultado | Detalle |
| --- | --- | --- |
| `npm test` | PASS | 18 pruebas unitarias, 0 fallos |
| `npm run test:e2e` | PASS | 5 pruebas E2E, 0 fallos |

`npm run test:all` reproduce ambas suites en secuencia. El proceso E2E emite
solo un warning de entorno sobre `NO_COLOR`/`FORCE_COLOR`; no afecta el resultado.

## Auditoría de configuración y secretos

- `.env.example` declara las variables de configuración conocidas y deja vacíos
  los valores sensibles.
- `SUPABASE_SERVICE_ROLE_KEY` se documenta como compatibilidad legacy porque la
  API acepta esa variable como fallback de `SUPABASE_SECRET_KEY`.
- `.env*` está ignorado por Git, excepto `.env.example`.
- `.vercel/`, `config/sources.json` y las capturas temporales también están
  ignorados; no forman parte de los artefactos versionados de esta fase.
- Se revisaron los archivos versionados sin encontrar claves, tokens o
  credenciales reales.
- `VERCEL_OIDC_TOKEN` no se agrega al ejemplo: es un token temporal generado por
  Vercel CLI para ejecuciones manuales y no una variable persistente del proyecto.

## Estado funcional actual

| Área | Estado | Qué existe hoy | Límite comprobado |
| --- | --- | --- | --- |
| Contrato y validación de snapshots | Implementado | Validación JavaScript, API server-side y contrato JSON | Hay validadores paralelos en JavaScript y Python |
| Lectura de señales | Implementado | `GET /api/signals/latest` reconstruye el snapshot más reciente desde Supabase | Requiere credenciales server-side en producción |
| Persistencia | Implementado | `POST /api/signals/save` valida, autoriza y guarda mediante RPC idempotente | La configuración remota no se puede verificar desde una clonación sin secretos |
| Ranking | Implementado | Ranking reproducible con estado, confianza, completitud y etiquetas | Los pesos son código local y no configurables desde un panel |
| Recolección The Batch | Implementado | Parser determinista de `__NEXT_DATA__` con fixture y pruebas | Solo existe este adaptador de fuente |
| Dashboard | Implementado | Vista lectora, detalle, fuentes, ranking y estados de carga/error/vacío | La interfaz es una aplicación estática sin bundler |
| Modo operador | Local | Ajustes, edición y cola viven en la sesión del navegador | No hay persistencia de acciones ni merge automático real |
| Datos locales | Local | Snapshots diarios y fixtures para desarrollo/pruebas | El frontend usa la API; no hay fallback local automático |
| Detección de duplicados | Simulado/pendiente | El modo operador informa que no detectó duplicados | No existe algoritmo ni agrupación persistente |
| Guías prácticas | Parcial | Cada señal contiene un campo `accion` | No hay generación ni flujo separado de guías |
| Automatización | Parcial | Scripts locales para recolectar y guardar snapshots | No hay CI ni tarea programada versionada |

## Alcance de las siguientes fases

| Fase | Alcance | Estado al cerrar fase 0 |
| --- | --- | --- |
| 0 | Rama, línea base, configuración, auditoría y issues | Completada |
| 1 | Reposicionamiento y documentación profesional | Pendiente |
| 2 | Demo pública confiable | Pendiente |
| 3 | Integración continua y calidad | Pendiente |
| 4 | Fortalecimiento del backend | Pendiente |
| 5 | Presentación profesional final | Pendiente |

Las mejoras recomendadas y opcionales del plan quedan fuera del alcance de esta
rama hasta completar la ruta esencial.

## Issues de seguimiento

- [Fase 0: preparación y línea base](https://github.com/FranklyBautista/AI_Radar/issues/1)
- [Fase 1: reposicionamiento y documentación profesional](https://github.com/FranklyBautista/AI_Radar/issues/2)
- [Fase 2: demo pública confiable](https://github.com/FranklyBautista/AI_Radar/issues/3)
- [Fase 3: integración continua y calidad](https://github.com/FranklyBautista/AI_Radar/issues/4)
- [Fase 4: fortalecimiento del backend](https://github.com/FranklyBautista/AI_Radar/issues/5)
- [Fase 5: presentación profesional final](https://github.com/FranklyBautista/AI_Radar/issues/6)

## Pendientes intencionales

- No se cambia todavía el README ni la arquitectura del producto; corresponde a
  la fase 1.
- No se agrega un fallback demo, CI, rate limiting o nuevas fuentes; pertenecen
  a fases posteriores.
- La creación y seguimiento de issues se realiza en GitHub y se referencia en
  la entrega de esta fase.
