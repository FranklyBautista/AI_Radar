---
name: desarrollo-frontend-airadar
description: Implementa, modifica y valida interfaces frontend de AI Radar con datos trazables y evidencia visual. Usar al construir o revisar dashboards, vistas, componentes y flujos de AI Radar; exige APIs reales o fixtures declarados, estados completos, responsive, accesibilidad, consola y red limpias, y capturas de verificacion.
---

# Desarrollo Frontend AI Radar

Construir interfaces revisables y conectadas al contrato real del proyecto. No declarar una entrega terminada sin verificar cada criterio obligatorio.

## Flujo

1. Inspeccionar `AGENTS.md`, el estado del repo, el stack y los comandos existentes antes de editar.
2. Delimitar la vista o flujo solicitado y conservar los patrones visuales y tecnicos ya presentes.
3. Resolver la procedencia de datos antes de diseñar la UI.
4. Implementar todos los estados relevantes y las interacciones completas.
5. Verificar responsive y accesibilidad mientras se desarrolla, no solo al final.
6. Ejecutar las validaciones reales disponibles y corregir errores de consola o red.
7. Capturar evidencia visual final en desktop y mobile.
8. Entregar un resumen verificable con lo agregado, las comprobaciones y lo pendiente.

## Datos obligatorios

- Consumir una API real cuando el endpoint y su contrato existan y sean accesibles.
- Usar fixtures solo cuando la API no exista, no sea accesible o el alcance pida una demo aislada.
- Declarar cada fixture de forma explicita: ruta del archivo, forma del contrato, mecanismo que la activa y motivo del fallback.
- Mantener las fixtures fuera del componente visual y con una estructura compatible con el contrato esperado.
- Representar casos normales y limites utiles: contenido completo, campos opcionales, lista vacia y error cuando corresponda.
- No incrustar datos de ejemplo en la UI haciendolos pasar por una respuesta real.
- No inventar endpoints, campos, respuestas ni comandos. Si falta el contrato, declararlo como pendiente o crear un contrato solo cuando el alcance lo autorice.

## Estados e interacciones

Implementar por cada superficie asincrona, cuando aplique:

- inicial;
- carga o actualizacion;
- exito con datos;
- vacio con siguiente accion clara;
- error recuperable con reintento;
- acceso restringido, offline o datos obsoletos si el flujo puede producirlos.

Evitar saltos de layout durante la carga. Deshabilitar acciones mientras se procesan, impedir envios duplicados y mostrar retroalimentacion perceptible. Conservar filtros, seleccion o posicion cuando una actualizacion no exija reiniciarlos.

## Responsive

- Empezar por la jerarquia de contenido, no por encoger el layout desktop.
- Verificar como minimo un viewport mobile cercano a `390x844` y uno desktop cercano a `1440x900`; agregar tablet cuando el cambio de estructura lo requiera.
- Evitar scroll horizontal accidental, solapamientos, texto cortado y controles fuera del viewport.
- Adaptar tablas densas con prioridad de columnas, tarjetas, detalle progresivo o scroll contenido; no reducir el texto hasta volverlo ilegible.
- Mantener objetivos tactiles, espacios y controles utilizables en mobile.

## Accesibilidad

- Usar HTML semantico, landmarks, jerarquia de encabezados y controles nativos antes de agregar ARIA.
- Proporcionar nombre accesible para iconos y controles, `label` para campos y texto alternativo util para imagenes informativas.
- Permitir completar el flujo solo con teclado; mostrar foco visible y orden logico.
- Mantener contraste legible y no depender solo del color para estado, ranking o severidad.
- Anunciar cambios asincronos importantes y asociar errores con el campo o region correspondiente.
- Respetar preferencias de movimiento reducido cuando haya animaciones.
- Ejecutar la auditoria automatizada disponible y complementarla con una comprobacion manual de teclado. No afirmar conformidad total basandose solo en una herramienta.

## Validacion y evidencia

- Descubrir los comandos desde archivos reales como `package.json`, configuracion o documentacion vigente. No documentar comandos inexistentes.
- Ejecutar las pruebas, lint, build y comprobaciones visuales que existan y sean proporcionales al cambio.
- Abrir la vista en un navegador y recorrer el camino principal y al menos un estado no exitoso relevante.
- Dejar la consola sin errores, warnings inesperados, rechazos no manejados ni mensajes de depuracion.
- Dejar la red sin requests fallidos inesperados, bucles, endpoints inventados ni datos servidos desde una fuente distinta de la declarada.
- Tomar, despues de validar, al menos una captura desktop y una mobile de la vista cambiada. Agregar una captura del estado o modo clave cuando no quede demostrado por las dos anteriores.
- Guardar las capturas en una ubicacion temporal ignorada por Git y reportar sus rutas; no agregarlas al commit ni sustituirlas por una descripcion verbal.
- Si no es posible iniciar la interfaz, abrir el navegador o tomar capturas, informar el bloqueo y no presentar la validacion visual como completada.

## Criterio de terminado

Considerar terminada una entrega solo cuando:

- la API real funciona o la fixture esta declarada y aislada;
- los estados aplicables se pueden reproducir;
- desktop y mobile fueron comprobados;
- el flujo principal funciona con teclado y pasa las comprobaciones de accesibilidad disponibles;
- consola y red estan limpias;
- existen capturas finales desktop y mobile;
- el resumen final enumera archivos cambiados, fuente de datos, estados verificados, viewports, comandos ejecutados, resultado de accesibilidad, resultado de consola/red y rutas de capturas;
- cualquier pendiente intencional queda identificado sin ocultarlo como trabajo terminado.

Para una revision sin autorizacion de cambios, reportar cada incumplimiento con evidencia concreta y no implementar correcciones por cuenta propia.
