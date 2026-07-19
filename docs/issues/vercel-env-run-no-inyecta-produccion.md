# Issue: `vercel env run` no inyecta las variables de producción esperadas

- Fecha del hallazgo: 2026-07-18
- Estado: cerrado (2026-07-18)
- Severidad: media

## Evidencia

- `vercel env list production` mostró `AIRADAR_WRITE_TOKEN`, `SUPABASE_URL` y `SUPABASE_SECRET_KEY` configuradas para Production.
- `vercel env run --environment=production` indicó que descargó las variables, pero el proceso hijo observó las tres variables como ausentes.
- El primer intento de guardado terminó con `Falta variable de entorno requerida: AIRADAR_WRITE_TOKEN`.
- El mismo script guardó correctamente cinco señales al ejecutarse con `.env.production.local`, archivo ignorado por Git, sin imprimir el valor del token.
- La API productiva respondió con `senales_guardadas: 5`, `fuentes_guardadas: 5` y `errores: []` en el segundo intento.

## Pasos para reproducir

1. Vincular el repo con el proyecto Vercel indicado por `.vercel/project.json`.
2. Ejecutar `npx --yes vercel@latest env list production` y confirmar que aparecen los nombres de las tres variables requeridas.
3. Ejecutar un proceso que solo reporte la presencia, nunca el valor, de las variables:

   ```bash
   npx --yes vercel@latest env run --environment=production -- \
     node -e 'console.log({
       AIRADAR_WRITE_TOKEN: Boolean(process.env.AIRADAR_WRITE_TOKEN),
       SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
       SUPABASE_SECRET_KEY: Boolean(process.env.SUPABASE_SECRET_KEY)
     })'
   ```

4. Ejecutar mediante `vercel env run` el script `scripts/guardar_senales_airadar.py` contra el endpoint productivo.
5. Observar que el proceso informa la ausencia de `AIRADAR_WRITE_TOKEN`.

## Resultado esperado

`vercel env run --environment=production` inyecta en el proceso hijo las variables productivas autorizadas, sin escribir sus valores en el repo ni mostrarlos en consola, y el guardado puede autenticarse contra la API.

## Resultado actual

Vercel CLI enumera las variables remotas, pero el proceso hijo no recibe ninguna de las tres y el guardado falla antes de realizar el POST.

## Archivos probables

- `.vercel/project.json`
- `.env.local` (ignorado por Git; no debe contener secretos versionados)
- `.env.production.local` (ignorado por Git; fallback observado)
- `scripts/guardar_senales_airadar.py`
- Configuración externa de Environment Variables del proyecto Vercel

## Criterios de aceptación

- [x] Desde una shell limpia, `vercel env run --environment=production` entrega una identidad temporal suficiente para autenticar el guardado sin exponer las tres variables sensibles.
- [x] La comprobación registra solo presencia, formato o longitud y nunca imprime valores secretos.
- [x] `scripts/guardar_senales_airadar.py` completa el POST productivo mediante `vercel env run` sin depender de un archivo local con secretos.
- [x] El endpoint devuelve cero errores y Supabase confirma el run guardado.
- [x] El procedimiento reproducible queda documentado con Vercel CLI `56.3.2`.

## Resolución y prueba

El criterio original que exigía exponer `SUPABASE_SECRET_KEY` y `AIRADAR_WRITE_TOKEN` al proceso local fue corregido porque ambas variables están protegidas como sensibles. Vercel las devuelve como `[REDACTED]` o las omite fuera del runtime; rebajar su clasificación habría introducido una regresión de seguridad.

También se comprobó que el `.env.local` existente contenía un `VERCEL_OIDC_TOKEN` vencido y tenía precedencia sobre el token recién descargado. La solución evita ambos problemas:

- La API acepta un OIDC efímero de Vercel y valida firma, expiración, emisor, audiencia, equipo, proyecto, entorno de desarrollo y usuario.
- `scripts/guardar_senales_produccion.mjs` crea un directorio temporal limpio con el vínculo público de `.vercel/project.json`, fija Vercel CLI `56.3.2`, ejecuta el guardado y elimina el temporal.
- `npm run save:production -- data/daily/2026-07-18.json` respondió con `autenticacion: vercel-oidc`, cinco señales actualizadas, cinco fuentes y `errores: []`.
- La consulta independiente a Supabase confirmó el run `9fcf0f8b-1280-415f-bffe-3102be6a16ee`, cinco señales, cinco fuentes y actualización `2026-07-19 02:03:39.729+00`.
- `npm test` aprobó 14 pruebas, incluidas autorización estática, OIDC válido y rechazo de otra identidad.

Referencias de la decisión: [variables sensibles de Vercel](https://vercel.com/docs/environment-variables/sensitive-environment-variables) y [referencia OIDC](https://vercel.com/docs/oidc/reference).
