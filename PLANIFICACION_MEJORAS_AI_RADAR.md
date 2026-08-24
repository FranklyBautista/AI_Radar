# Planificación de mejoras de AI Radar

## 1. Propósito de la planificación

Marca una casilla como completada usando `[x]` cuando la tarea o fase haya sido verificada.

Transformar AI Radar en una pieza principal de portafolio para postular a cargos junior de backend o full-stack con énfasis en backend. El proyecto debe demostrar no solo que funciona, sino también capacidad para diseñar una arquitectura, proteger servicios, validar datos, automatizar procesos, probar el sistema y documentar decisiones técnicas.

Las fases con letra (`2B`, `3B`) se insertaron después de la numeración
original; van en la posición que indica su nombre y no alteran el resto.

Esta planificación distingue entre:

- **Mejoras esenciales:** necesarias antes de promocionar activamente el proyecto.
- **Mejoras recomendadas:** aumentan la calidad técnica y la profundidad del producto.
- **Mejoras opcionales:** amplían el alcance una vez que la versión principal esté terminada.

## 2. Objetivo del producto

AI Radar será una plataforma que recopila novedades de inteligencia artificial desde fuentes seleccionadas, las normaliza y valida, elimina o agrupa señales similares, calcula su relevancia y presenta información accionable para desarrolladores.

Cada señal debe responder:

1. ¿Qué ocurrió?
2. ¿Por qué importa?
3. ¿Qué evidencia lo respalda?
4. ¿Qué tan confiable es?
5. ¿Qué acción se recomienda realizar?

## 3. Resultado esperado para el portafolio

Al terminar las fases esenciales, el proyecto debe contar con:

- aplicación pública y estable;
- repositorio comprensible en menos de cinco minutos;
- README profesional con capturas y arquitectura;
- modo demostración con información disponible;
- pruebas automatizadas y CI;
- historial de commits descriptivo a partir de las nuevas mejoras;
- documentación del backend, modelo de datos y seguridad;
- evidencia clara de las decisiones tomadas por el desarrollador;
- una demostración breve en video o GIF.

---

# Ruta esencial para el portafolio

## Fase 0. Preparación y línea base

**Prioridad:** crítica  
**Duración estimada:** 1 día

- [x] Fase 0 completada

### Tareas

- [x] Crear una rama de trabajo, por ejemplo `feature/portfolio-readiness`.
- [x] Ejecutar y registrar el estado inicial de las pruebas unitarias y E2E.
- [x] Revisar que `.env.example` contenga todas las variables necesarias sin secretos reales.
- [x] Identificar qué funciones están totalmente operativas, cuáles son locales y cuáles son simuladas.
- [x] Crear issues en GitHub para cada fase o conjunto de tareas.
- [x] Definir una pequeña tabla de alcance: implementado, pendiente y opcional.

### Criterios de finalización

- [x] El proyecto puede instalarse desde cero siguiendo una secuencia conocida.
- [x] Las pruebas existentes pasan antes de comenzar los cambios.
- [x] No existen claves, tokens o credenciales dentro del repositorio.

## Fase 1. Reposicionamiento y documentación profesional

**Prioridad:** crítica  
**Duración estimada:** 2–3 días

- [x] Fase 1 completada

### Tareas del README

- [x] Sustituir la descripción centrada en el curso por una descripción centrada en el problema.
- [x] Agregar una propuesta de valor de dos o tres líneas.
- [x] Incluir una captura principal o GIF del dashboard.
- [x] Agregar el enlace a la aplicación desplegada.
- [x] Enumerar las funcionalidades realmente implementadas.
- [x] Documentar el stack tecnológico y justificar brevemente las decisiones importantes.
- [x] Agregar un diagrama compacto de arquitectura.
- [x] Explicar el flujo: recolección → validación → persistencia → ranking → visualización.
- [x] Documentar instalación, variables de entorno, scripts y ejecución de pruebas.
- [x] Explicar cómo se calcula el ranking y aclarar sus limitaciones.
- [x] Agregar una sección de seguridad.
- [x] Agregar una sección de próximos pasos.
- [x] Incorporar una sección “Decisiones y aprendizajes” que permita defender el proyecto en una entrevista.
- [x] Añadir un archivo `LICENSE` y enlazarlo desde el README.

Sin licencia, un repositorio público no autoriza legalmente a nadie a usarlo o
bifurcarlo. Se publica bajo MIT.

### Documentación adicional

- [x] Crear `docs/ARCHITECTURE.md` para explicar componentes, límites y flujo de datos.
- [x] Crear `docs/DATABASE.md` con tablas, relaciones, restricciones e índices.
- [x] Crear `docs/API.md` con endpoints, autenticación, entradas, respuestas y códigos de error.
- [x] Crear `CONTRIBUTING.md` con convenciones de ramas, commits y pruebas.

### Mensaje recomendado para el proyecto

> AI Radar recopila, valida, clasifica y prioriza novedades de inteligencia artificial para convertir información dispersa en señales accionables respaldadas por fuentes.

### Criterios de finalización

- [x] Un reclutador puede comprender el problema, la solución y la arquitectura sin leer el código.
- [x] La documentación no afirma que existen funciones que todavía no están implementadas.
- [x] El origen académico puede mencionarse como contexto secundario, no como identidad principal.

## Fase 2. Demo pública confiable

**Prioridad:** crítica  
**Duración estimada:** 2–4 días

- [x] Fase 2 completada

### Tareas

- [x] Verificar el despliegue del frontend y las funciones serverless.
- [x] Configurar correctamente las variables de producción.
- [x] Incorporar datos recientes suficientes para demostrar filtros, ranking y detalle.
- [x] Implementar un modo demo basado en un snapshot local cuando Supabase esté vacío o no disponible.
- [x] Identificar visualmente si los datos son en vivo o de demostración.
- [x] Crear estados apropiados de carga, ausencia de datos, error y reintento.
- [x] Comprobar diseño responsive en escritorio y móvil.
- [x] Revisar accesibilidad básica: teclado, foco, etiquetas, contraste y mensajes de estado.
- [x] Grabar un GIF o video de 60–90 segundos mostrando el flujo principal.

### Criterios de finalización

- [x] El enlace público abre sin configuración adicional.
- [x] Un fallo temporal de la fuente de datos no deja una pantalla rota.
- [x] El usuario puede explorar señales sin iniciar sesión.
- [x] La demo comunica claramente qué funcionalidades son persistentes.

## Fase 2B. Interfaz: claridad y densidad de información

**Prioridad:** alta
**Duración estimada:** 1–2 días

- [x] Fase 2B completada

La Fase 2 comprueba que la interfaz *funciona* en escritorio y móvil. Esta
comprueba que se *entiende*, que es lo primero que juzga quien abre el enlace.

### Tareas

- [x] Retirar de la vista principal la información que no ayuda a decidir:
      títulos duplicados, cabeceras de tabla para listas cortas, controles sin
      nada detrás y avisos permanentes.
- [x] Reducir a una sola línea meta la categoría, el estado y la fecha de cada
      señal, en lugar de una columna por dato.
- [x] Reservar el color de acento a un conjunto pequeño y declarado de usos.
- [x] Sustituir los glifos unicode usados como iconos por SVG de trazo.
- [x] Mostrar lista y detalle a la vez, sin desplazamiento, en escritorio.
- [x] Ocultar los controles de operador cuando el modo no está activo, en vez
      de mostrarlos deshabilitados.
- [x] Eliminar la cola de operador, que repetía el ranking.

### Criterios de finalización

- [x] Ningún dato aparece dos veces en la misma pantalla sin motivo.
- [x] No hay controles deshabilitados esperando en la vista por defecto.
- [x] Las tres vistas (lector, operador, móvil) no desbordan horizontalmente.
- [x] La suite E2E y la comprobación de accesibilidad siguen en verde.

## Fase 3. Integración continua y calidad

**Prioridad:** alta  
**Duración estimada:** 2–3 días

- [ ] Fase 3 completada

### Tareas

- [ ] Crear un workflow de GitHub Actions.
- [ ] Ejecutar instalación reproducible, pruebas unitarias y pruebas de integración en cada push y pull request.
- [ ] Ejecutar Playwright en CI o, como mínimo, en la rama principal antes de despliegues.
- [ ] Agregar linting y formato automático.
- [ ] Establecer una versión compatible de Node en `package.json` o `.nvmrc`.
- [ ] Agregar una insignia del estado de CI al README.
- [ ] Incorporar pruebas para errores de red, datos inválidos y entradas límites.
- [ ] Revisar que la aplicación no exponga secretos en respuestas o logs.

### Pruebas mínimas esperadas

- [ ] validación de contratos;
- [ ] ranking y desempates;
- [ ] API de lectura sin credenciales expuestas;
- [ ] autorización de escritura;
- [ ] persistencia idempotente;
- [ ] estados vacíos y errores;
- [ ] búsqueda y selección de señales;
- [ ] recorrido E2E principal;
- [ ] accesibilidad automática básica.

### Criterios de finalización

- [ ] Todo pull request recibe un resultado automático de calidad.
- [ ] Una regresión en el contrato, ranking o autorización bloquea la integración.
- [ ] Los comandos documentados producen los mismos resultados localmente y en CI.

## Fase 3B. Recolección programada

**Prioridad:** crítica
**Duración estimada:** 2–3 días

- [ ] Fase 3B completada

Hoy toda la recolección la dispara una persona ejecutando un script. Un radar
cuya señal más reciente es del día en que se ejecutó el script a mano está
muerto para quien abra el enlace dos meses después. Esta fase es la diferencia
entre una demostración y algo que funciona solo, y ejercita de una vez casi todo
lo que la Fase 4 quiere demostrar.

Va después de la Fase 3 porque reutiliza el mismo GitHub Actions.

### Tareas

- [ ] Crear un workflow programado que ejecute el recolector y publique el
      snapshot vía `POST /api/signals/save`.
- [ ] Resolver la autenticación del workflow sin exponer secretos en logs.
- [ ] Comprobar que reejecutar el mismo día no duplica el run.
- [ ] Registrar el resultado de cada ejecución: fuentes consultadas, señales
      obtenidas, duración y error.
- [ ] Que un fallo de la fuente deje el snapshot anterior intacto y visible.
- [ ] Mostrar en la interfaz la antigüedad del snapshot cuando supere un umbral.
- [ ] Documentar en el README cada cuánto se actualiza el radar.

### Criterios de finalización

- [ ] El radar se actualiza sin intervención manual.
- [ ] Una recolección fallida no deja la demo pública en blanco ni con datos
      inventados.
- [ ] La fecha visible en la interfaz corresponde a datos reales recientes.

## Fase 4. Fortalecimiento del backend

**Prioridad:** alta  
**Duración estimada:** 4–6 días

- [ ] Fase 4 completada

### Tareas que cambian la conversación técnica

`api/signals/save.js` tiene 294 líneas y concentra validación, autorización,
dominio y transporte. Ese archivo es el que justifica esta fase.

- [ ] Centralizar la validación para evitar contratos duplicados entre frontend y API.
- [ ] Evaluar el uso del JSON Schema existente como fuente única de verdad.
- [ ] Separar en capas la validación, dominio, persistencia y transporte HTTP.
- [ ] Garantizar idempotencia al volver a procesar una misma ejecución.
- [ ] Definir errores de API con una estructura consistente: código, mensaje y detalles seguros.
- [ ] Revisar la atomicidad del guardado de snapshots y documentar el uso de la función RPC.

### Tareas opcionales de esta fase

Tienen sentido cuando exista volumen o tráfico que las justifique. Aplicarlas
ahora, sobre cinco señales y un endpoint que nadie consume, es decorado: cuesta
tiempo y no mejora la defensa del proyecto.

- [ ] Revisar índices y restricciones de Supabase.
- [ ] Aplicar límites de longitud y tamaño máximo de solicitud.
- [ ] Agregar paginación o límites explícitos al endpoint de consulta.
- [ ] Incorporar filtros del lado del servidor por categoría, estado, confianza y fecha.
- [ ] Agregar identificadores de correlación para diagnosticar fallos sin revelar información sensible.
- [ ] Evaluar rate limiting para el endpoint de escritura.

### Criterios de finalización

- [ ] Las responsabilidades del backend están separadas y son comprobables.
- [ ] Guardar dos veces el mismo snapshot no crea duplicados.
- [ ] Entradas inválidas reciben respuestas 4xx consistentes.
- [ ] Los endpoints no dependen innecesariamente de una implementación concreta de interfaz.

## Fase 5. Presentación profesional final

**Prioridad:** crítica  
**Duración estimada:** 1–2 días

- [ ] Fase 5 completada

### Tareas

- [ ] Actualizar la descripción y los topics del repositorio en GitHub.
- [ ] Añadir URL pública en la información del repositorio.
- [ ] Preparar entre tres y cinco capturas de buena calidad.
- [ ] Revisar nombres, ortografía y consistencia entre español e inglés.
- [ ] Crear una release `v1.0.0` con notas breves.
- [ ] Fijar el repositorio en el perfil de GitHub.
- [ ] Agregar el proyecto al CV y portafolio personal.
- [ ] Preparar una explicación oral de dos minutos y una explicación técnica de cinco minutos.

### Puntos que debes poder defender en una entrevista

- [ ] problema y usuarios objetivo;
- [ ] arquitectura y flujo de datos;
- [ ] elección de Supabase y Vercel Functions;
- [ ] validación de contratos;
- [ ] protección de credenciales;
- [ ] funcionamiento y limitaciones del ranking;
- [ ] estrategia de pruebas;
- [ ] incidentes o errores encontrados y cómo fueron solucionados;
- [ ] uso concreto de herramientas de IA y decisiones que permanecieron bajo tu responsabilidad.

### Criterios de finalización

- [ ] La versión pública, documentación, código y discurso cuentan la misma historia.
- [ ] El repositorio puede mostrarse como uno de los primeros proyectos del portafolio.

---

# Mejoras recomendadas del producto

Estas mejoras aumentan la profundidad de AI Radar sin cambiar su propósito central.

## 6. Recolección desde múltiples fuentes

- [ ] Fase 6 completada

**Valor:** demuestra automatización, integración y tolerancia a fallos.

- [ ] Incorporar fuentes oficiales adicionales: blogs de laboratorios, repositorios destacados, arXiv o feeds RSS.
- [ ] Crear una interfaz común de recolector para que cada fuente sea un adaptador independiente.
- [ ] Registrar fecha de consulta, resultado, duración y error de cada fuente.
- [ ] Aplicar reintentos con espera progresiva y límites de tiempo.
- [ ] Evitar que el fallo de una fuente cancele toda la ejecución.
- [ ] Respetar términos de uso y límites de cada proveedor.

## 7. Detección de duplicados y agrupación

- [ ] Fase 7 completada

**Depende de la Fase 6.** Hoy existe un único recolector
(`scripts/recopilar_the_batch.mjs`). Deduplicar una sola fuente no encuentra
casi nada, así que esta fase no se puede abordar sin la anterior: son dos
fases de trabajo, no una.

**Valor:** ataca directamente uno de los problemas principales del producto.

- [ ] Normalizar títulos, dominios y URLs canónicas.
- [ ] Detectar duplicados exactos mediante hashes.
- [ ] Comparar similitud textual entre títulos y resúmenes.
- [ ] Agrupar fuentes distintas que describan el mismo evento.
- [ ] Permitir que el operador confirme o deshaga una agrupación.
- [ ] Conservar trazabilidad sobre la decisión automática y manual.

## 8. Ranking explicable y configurable

- [ ] Fase 8 completada

**Función diferenciadora recomendada.** Funciona con una sola fuente, parte de
`src/ranking.mjs`, que ya existe y está probado, y da mejor conversación
técnica que la deduplicación: algoritmo versionado, desglose del puntaje y
casos de prueba con resultado esperado.

**Valor:** mejora la lógica de dominio y permite una buena discusión técnica.

- [ ] Separar novedad, impacto, evidencia, confianza y accionabilidad como dimensiones visibles.
- [ ] Guardar la versión del algoritmo usada para cada puntuación.
- [ ] Mostrar al usuario el desglose del puntaje.
- [ ] Crear conjuntos de casos de prueba con resultados esperados.
- [ ] Permitir configurar pesos desde el backend o un panel de administración.
- [ ] Comparar cambios del ranking antes de publicarlos.

## 9. Panel de operación real

- [ ] Fase 9 completada

**Valor:** convierte la interfaz de revisión local en un flujo completo.

- [ ] Autenticación para operadores.
- [ ] Edición persistente de título, impacto, evidencia, acción y etiquetas.
- [ ] Estados de revisión: borrador, revisada, publicada y descartada.
- [ ] Registro de quién realizó cada cambio y cuándo.
- [ ] Cola de señales pendientes.
- [ ] Publicación y retirada controlada.
- [ ] Historial de versiones o auditoría.

## 10. Observabilidad

- [ ] Fase 10 completada

**Valor:** demuestra prácticas cercanas a producción.

- [ ] Logs estructurados del backend.
- [ ] Identificador por solicitud y por ejecución de recolección.
- [ ] Métricas de fuentes consultadas, señales creadas, duplicados y errores.
- [ ] Registro del tiempo de respuesta de endpoints.
- [ ] Alertas básicas cuando una recolección falla repetidamente.
- [ ] Vista interna del estado de las fuentes.

---

# Mejoras opcionales para una versión avanzada

## 11. Búsqueda y filtros avanzados

- [ ] Fase 11 completada

- [ ] filtros combinables por fecha, categoría, fuente, estado y confianza;
- [ ] ordenamiento por relevancia, fecha o confiabilidad;
- [ ] URL con filtros persistentes para compartir búsquedas;
- [ ] búsqueda de texto completo desde Postgres;
- [ ] paginación basada en cursor.

## 12. Preferencias y personalización

- [ ] Fase 12 completada

- [ ] cuentas de usuario;
- [ ] temas o categorías favoritas;
- [ ] señales guardadas;
- [ ] listas personales de herramientas por probar;
- [ ] historial de señales vistas;
- [ ] ranking personalizado sin alterar el ranking global.

## 13. Resumen periódico y notificaciones

- [ ] Fase 13 completada

- [ ] resumen diario o semanal;
- [ ] selección de las señales más accionables;
- [ ] envío por correo, Slack o canal RSS;
- [ ] preferencias de frecuencia y categorías;
- [ ] enlaces con seguimiento hacia la señal original.

Esta función debe implementarse después de contar con datos confiables, deduplicación y controles de frecuencia.

## 14. API pública documentada

- [ ] Fase 14 completada

- [ ] endpoints de solo lectura con versionado;
- [ ] documentación OpenAPI;
- [ ] API keys con permisos y cuotas;
- [ ] rate limiting;
- [ ] ejemplos de consumo;
- [ ] política clara de uso y atribución.

## 15. Uso controlado de inteligencia artificial

- [ ] Fase 15 completada

- [ ] generación asistida del resumen, impacto y acción sugerida;
- [ ] salida estructurada validada contra el contrato;
- [ ] registro del modelo y versión del prompt;
- [ ] conservación de las fuentes utilizadas;
- [ ] revisión humana antes de publicar;
- [ ] evaluación de alucinaciones con casos de prueba;
- [ ] comparación del resultado generado con el contenido original.

La IA no debe asignar automáticamente una señal como confiable sin evidencia y trazabilidad.

## 16. Analítica del producto

- [ ] Fase 16 completada

- [ ] categorías más consultadas;
- [ ] señales guardadas o abiertas con mayor frecuencia;
- [ ] acciones sugeridas más utilizadas;
- [ ] fuentes con mejor tasa de señales útiles;
- [ ] métricas de calidad del ranking;
- [ ] analítica respetuosa de la privacidad.

## 17. Internacionalización

- [ ] Fase 17 completada

- [ ] interfaz en español e inglés;
- [ ] conservación del idioma original de la fuente;
- [ ] traducciones diferenciadas del contenido original;
- [ ] filtros por idioma;
- [ ] formatos regionales correctos para fechas.

---

# Orden recomendado de ejecución

## Semana 1: convertirlo en un proyecto presentable

- Fase 0: preparación.
- Fase 1: README y documentación.
- Comenzar Fase 2: despliegue y datos de demostración.

**Entrega:** repositorio que explica correctamente el producto y puede mostrarse de manera preliminar.

## Semana 2: confiabilidad y evidencia técnica

- Completar Fase 2 y Fase 2B.
- Implementar Fase 3.
- Implementar Fase 3B reutilizando el workflow de la Fase 3.
- Corregir errores detectados por pruebas E2E y accesibilidad.

**Entrega:** demo estable, con pruebas automáticas, CI visible y datos que se
renuevan sin intervención.

## Semana 3: backend defendible

- Implementar Fase 4.
- Documentar persistencia, seguridad, validación e idempotencia.
- Crear filtros del lado del servidor si el tiempo lo permite.

**Entrega:** backend más modular y adecuado para una entrevista técnica.

## Semana 4: cierre y una mejora diferenciadora

- Completar Fase 5.
- Elegir solamente una mejora recomendada de alto valor:
  - ranking explicable (Fase 8, recomendada: no depende de nada más);
  - múltiples fuentes (Fase 6); o
  - deduplicación y agrupación (Fase 7, requiere antes la Fase 6).
- Crear la release `v1.0.0`.

**Entrega:** versión oficial para portafolio.

---

# Priorización resumida

| Nivel | Trabajo | Motivo |
|---|---|---|
| P0 | README, despliegue, modo demo y seguridad de secretos | Determina la primera impresión y permite evaluar el proyecto |
| P0 | CI y pruebas del recorrido principal | Demuestra confiabilidad y disciplina técnica |
| P0 | Capturas, video y release | Facilita que un reclutador comprenda el resultado rápidamente |
| P0 | Recolección programada | Sin ella el radar envejece y la demo pública deja de ser creíble |
| P1 | Modularización del backend y contrato único | Fortalece tu perfil orientado a backend |
| P1 | Ranking explicable | Diferencia AI Radar de un CRUD convencional sin depender de otras fases |
| P1 | Recolección de múltiples fuentes | Refuerza automatización e integración; habilita la deduplicación |
| P2 | Panel de operación y auditoría | Agrega un flujo empresarial completo |
| P2 | Observabilidad y filtros avanzados | Acerca la app a prácticas de producción |
| P3 | Usuarios, notificaciones, API pública e IA generativa | Expansión futura después de estabilizar el núcleo |

---

# Definición general de terminado

Una tarea se considera terminada cuando:

- su comportamiento está implementado;
- cuenta con pruebas proporcionales al riesgo;
- no expone secretos ni información interna;
- contempla carga, error y ausencia de datos cuando corresponda;
- la documentación afectada está actualizada;
- pasa la integración continua, o la suite completa en local mientras la Fase 3
  no esté terminada;
- si se modificó una aserción de prueba, el commit declara si corrige una
  regresión o registra un cambio intencional de comportamiento;
- puede demostrarse desde la aplicación desplegada;
- se integró mediante un commit descriptivo.

# Recomendación final de alcance

Para buscar empleo no es necesario implementar todas las mejoras opcionales. La mejor versión de AI Radar para tu portafolio sería:

1. documentación profesional;
2. demo pública estable;
3. CI y pruebas visibles;
4. backend modular y seguro;
5. una sola función diferenciadora bien terminada.

La función diferenciadora recomendada es el **ranking explicable** (Fase 8):
parte de código que ya existe y está probado, no depende de ninguna otra fase y
permite defender decisiones de dominio en una entrevista. La **deduplicación y
agrupación** es igual de valiosa conceptualmente, pero exige antes la
recolección de múltiples fuentes, así que cuesta el doble.

Ambas se relacionan con el problema central del producto y demuestran más
criterio técnico que agregar autenticación, gráficos o funciones sociales sin
una necesidad clara.

Antes que cualquiera de las dos va la **recolección programada** (Fase 3B). No
es una función diferenciadora, es lo que sostiene la credibilidad de todo lo
demás: un radar desactualizado invalida la premisa del producto por muy buena
que sea su arquitectura.
