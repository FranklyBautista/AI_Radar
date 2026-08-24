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
- `GET /api/signals/latest` responde `200` con el snapshot `2026-08-24`,
  contrato `1.0.0` y cinco señales validadas.
- La persistencia se verificó con Vercel OIDC: el run
  `1bc2a800-6d79-4e6a-a278-0775f3abd9ca` guardó cinco señales y cinco fuentes
  sin errores.
- La versión desplegada conserva un fallback demo de solo lectura, por lo que
  el dashboard permanece navegable si la lectura en vivo falla. La interfaz no
  debe presentarlo como datos de Supabase en vivo.
