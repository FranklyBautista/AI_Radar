---
name: guardar-senales-airadar
description: Guarda snapshots o senales de AI Radar mediante la API server-side POST /api/signals/save. Use when the user asks to guardar, persistir, subir, sincronizar, insertar, or save AI Radar signals/snapshots into Supabase.
---

# Guardar Senales AI Radar

Usar esta skill para persistir snapshots de AI Radar en Supabase a traves de la API server-side del repo. No escribir directo a Supabase desde la skill y no imprimir secretos.

## Requisitos

- Debe existir `contracts/ai-radar-signal.schema.json`.
- Debe existir la API `POST /api/signals/save`.
- El entorno debe tener `AIRADAR_WRITE_TOKEN`.
- La API debe estar configurada server-side con `SUPABASE_URL`, `SUPABASE_SECRET_KEY` y `AIRADAR_WRITE_TOKEN`. Se admite `SUPABASE_SERVICE_ROLE_KEY` como fallback legacy.

## Flujo

1. Inspeccionar el repo si hace falta confirmar rutas.
2. Si el usuario da una ruta, usar ese snapshot.
3. Si el usuario no da ruta, usar el ultimo archivo `data/daily/YYYY-MM-DD.json`.
4. Ejecutar el tool local:

```bash
python3 scripts/guardar_senales_airadar.py data/daily/YYYY-MM-DD.json
```

5. Si la API esta desplegada o corre en otra URL, pasar:

```bash
python3 scripts/guardar_senales_airadar.py data/daily/YYYY-MM-DD.json --endpoint https://example.vercel.app/api/signals/save
```

6. Reportar el JSON de resultado: `runs`, `senales_recibidas`, `senales_guardadas`, `senales_actualizadas`, `fuentes_guardadas` y `errores`.

## Reglas

- No leer ni mostrar el valor de `AIRADAR_WRITE_TOKEN`.
- No guardar `SUPABASE_SECRET_KEY` ni `SUPABASE_SERVICE_ROLE_KEY` en archivos del repo.
- No llamar Supabase directamente desde la skill.
- Si falta contrato, endpoint o variables de entorno, fallar explicitamente.
- Si el mismo snapshot se guarda dos veces, esperar `senales_actualizadas` en vez de duplicados.
