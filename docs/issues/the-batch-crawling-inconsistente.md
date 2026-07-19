# Issue: The Batch devuelve fechas inconsistentes durante la recolección

- Fecha del hallazgo: 2026-07-18
- Estado: cerrado (2026-07-18)
- Severidad: baja

## Evidencia

- `The Batch` está declarada como fuente activa de tipo `medio_secundario` en el registro de Notion y en `config/sources.json`.
- El índice de búsqueda encontró `https://www.deeplearning.ai/the-batch/issue-358` con fecha `2026-06-19`.
- Otra vista de la portada terminó en una publicación del `2026-05-29`.
- Para el corte de búsqueda del `2026-07-18`, la edición del 19 de junio tenía aproximadamente 29 días y no fue seleccionada entre las señales recientes.
- La búsqueda completó el resto de las fuentes; la inconsistencia quedó limitada a la resolución de la publicación más reciente de The Batch.

## Pasos para reproducir

1. Confirmar que `The Batch` está activa en `config/sources.json` con URL `https://www.deeplearning.ai/the-batch`.
2. Consultar la portada de The Batch y registrar la fecha y URL de la publicación más reciente que devuelve.
3. Buscar las ediciones recientes indexadas del mismo dominio.
4. Comparar la fecha de portada con la edición `issue-358` y con la fecha de corte de la ejecución.
5. Repetir la consulta para comprobar si el resultado cambia según la ruta o el índice utilizado.

## Resultado esperado

La recolección resuelve de manera determinista la edición canónica más reciente de The Batch, conserva su URL y fecha reales, y marca explícitamente la fuente como desactualizada cuando supera el umbral de recencia.

## Resultado actual

La portada y el índice de búsqueda producen fechas máximas diferentes, por lo que la recolección no tiene una única respuesta confiable para la última edición disponible.

## Archivos probables

- `config/sources.json`
- `.codex/skills/ai-radar-news-signals/SKILL.md`
- Un futuro módulo determinístico de recolección de fuentes; actualmente no existe una ruta de implementación para este crawler
- Fixtures futuras que representen la portada y el índice de The Batch

## Criterios de aceptación

- [x] Se define una URL o mecanismo canónico para enumerar las ediciones de The Batch.
- [x] La extracción devuelve siempre la misma última edición para una respuesta de origen equivalente.
- [x] La fecha y URL seleccionadas se conservan como evidencia de la ejecución.
- [x] Una fixture reproduce la discrepancia observada entre portada e índice.
- [x] Una prueba determinística selecciona la edición canónica correcta o marca la fuente como inconsistente.
- [x] Si la edición más reciente supera el umbral de recencia, la fuente se reporta como desactualizada sin inventar una señal.

## Resolución y prueba

- El mecanismo canónico es `https://www.deeplearning.ai/the-batch` y su bloque estructurado `__NEXT_DATA__.props.pageProps.posts`; no se usa la fecha de un índice de búsqueda como autoridad.
- `scripts/recopilar_the_batch.mjs` enumera las ediciones, selecciona por fecha y número, conserva URL/fecha, calcula antigüedad y devuelve `actualizada`, `desactualizada` o `inconsistente` junto con `eligible_for_signal`.
- `tests/fixtures/the-batch/homepage-inconsistent.html` conserva las observaciones del 29 de mayo y el 19 de junio.
- La fixture con corte `2026-07-18` seleccionó de forma estable `issue-358`, fecha `2026-06-19`, antigüedad 29 días, `desactualizada` y `eligible_for_signal: false`.
- La prueba contra la portada real seleccionó `issue-362`, URL `https://www.deeplearning.ai/the-batch/issue-362`, fecha `2026-07-17`, antigüedad un día y `actualizada`.
- La skill `ai-radar-news-signals` exige usar el script para The Batch y prohíbe crear una señal si la salida es desactualizada o inconsistente.
- `npm test`: 17 pruebas aprobadas, incluidas selección canónica, descarte por antigüedad y fallo cerrado sin datos estructurados.
