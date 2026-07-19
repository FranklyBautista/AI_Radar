---
name: consultar-senales
description: Consulta snapshots diarios de AI Radar y devuelve senales en JSON. Use when the user asks to consultar, listar, ver, buscar, extraer, ordenar, filtrar, obtener N senales, revisar senales de un dia, or inspect daily AI Radar signals from local data/daily JSON snapshots.
---

# Consultar Senales

Usar esta skill para responder pedidos de consulta sobre senales ya guardadas en snapshots diarios de AI Radar. No buscar noticias nuevas; esta skill trabaja con datos locales existentes en `data/daily/YYYY-MM-DD.json`.

## Flujo

1. Inspeccionar el repo solo si hace falta confirmar rutas o snapshots disponibles.
2. Ejecutar el tool del proyecto:

```bash
python3 scripts/consultar_senales.py --dia YYYY-MM-DD --cantidad N --orden original
```

3. Si el usuario no indica dia, omitir `--dia` para usar el ultimo snapshot disponible.
4. Si el usuario no indica cantidad, usar `--cantidad 5`.
5. Si el usuario pide orden, pasar `--orden` con uno de estos valores: `original`, `id`, `titulo`, `estado`, `confianza`, `impacto`.
6. Si pide orden descendente, agregar `--direccion desc`; si no, usar `asc`.
7. Responder con el JSON devuelto por el tool o con un resumen breve si el usuario no pidio JSON literal.

## Ejemplos

Consultar tres senales de un dia:

```bash
python3 scripts/consultar_senales.py --dia 2026-07-06 --cantidad 3
```

Consultar las senales accionables primero:

```bash
python3 scripts/consultar_senales.py --dia 2026-07-06 --cantidad 5 --orden estado
```

Consultar el ultimo snapshot por confianza:

```bash
python3 scripts/consultar_senales.py --cantidad 5 --orden confianza
```

## Reglas

- No modificar snapshots durante una consulta.
- No inventar senales si no existen en el JSON diario.
- Reportar errores del tool de forma directa, incluyendo dias disponibles cuando el tool los indique.
