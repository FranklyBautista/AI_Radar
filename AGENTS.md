# Guia de agentes de AI Radar

AI Radar es el proyecto del curso para aprender Codex con una superficie de producto real.

El estado actual del repositorio es intencionalmente pequeno. Trata el README como direccion de producto, no como prueba de que el sistema completo ya existe.

## Estado actual

- El proyecto actualmente tiene un README y reglas del repositorio.
- La implementacion se construye clase por clase.
- No asumas que existen archivos de app, scripts, bases de datos, skills, configuracion de despliegue o automatizaciones hasta que esten presentes en el repo.

## Direccion de producto

AI Radar recopilara noticias, papers, repos, herramientas y lanzamientos de IA, y luego los convertira en senales verificables para builders.

El sistema final debe soportar:

- evidencia de fuentes;
- senales normalizadas;
- deteccion de duplicados;
- ranking;
- guias practicas de accion;
- una vista de operador;
- despliegue y automatizacion.

## Reglas de trabajo

- Inspecciona el repo antes de editar.
- Manten los cambios limitados al objetivo de la clase actual.
- Prefiere archivos pequenos y reproducibles en lugar de estado solo en el chat.
- No hagas commit de secretos, caches locales, snapshots semanales generados, salida de build, videos, screenshots o reportes temporales.
- Cuando una clase cree un proceso reutilizable, prefiere una skill.
- Cuando una clase cree trabajo deterministico, prefiere una herramienta o script.
- Cuando agregues ejemplos de datos, usa fixtures o contratos a menos que la clase requiera explicitamente una semilla durable.

## Validacion

Para cada rama de clase, deja un estado claro:

- que se agrego;
- como verificarlo;
- que queda intencionalmente pendiente.

Si los comandos aun no existen, no los inventes en la documentacion como si ya funcionaran.
