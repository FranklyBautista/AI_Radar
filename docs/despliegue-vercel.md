# Despliegue Vercel

- Fecha de última verificación: 2026-08-24
- Proyecto: `frankly-bautistas-projects/ai-radar`
- Entorno: Production
- Estado: `Ready`
- URL de despliegue: https://ai-radar-56c51fnuy-frankly-bautistas-projects.vercel.app
- Alias estable: https://ai-radar-ten-omega.vercel.app
- Alias de equipo: https://ai-radar-frankly-bautistas-projects.vercel.app

## Verificación pública

- `GET /` responde `200` y entrega el dashboard público sin autenticación.
- `GET /api/signals/latest` responde `500` con `{"error":"No se pudo cargar
  el radar"}`. El endpoint no revela secretos ni el detalle interno del fallo.
- La versión desplegada expone un fallback demo de solo lectura, por lo que el
  dashboard permanece navegable si la lectura en vivo falla.

## Estado de configuración pendiente

No fue posible confirmar ni modificar las variables de producción desde esta
sesión: el listado de entornos mediante Vercel CLI no devolvió resultado y no
se alteraron credenciales. Para recuperar la lectura en vivo:

1. En **Vercel → Settings → Environment Variables → Production**, confirmar
   `SUPABASE_URL` y una de `SUPABASE_SECRET_KEY` o
   `SUPABASE_SERVICE_ROLE_KEY`, sin espacios ni valores caducados.
2. Confirmar que la clave conserva permisos de lectura sobre `airadar_runs`,
   `airadar_signals` y la relación `airadar_sources`.
3. Redesplegar y comprobar `GET /api/signals/latest`; debe responder `200` con
   un snapshot que cumpla el contrato.

Mientras el endpoint siga en `500`, la aplicación debe mostrar el rótulo
**Demo local · fallback** y no presentarlo como información actualizada en
Supabase.
