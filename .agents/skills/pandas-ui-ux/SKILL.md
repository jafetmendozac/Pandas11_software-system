---
name: pandas-ui-ux
description: Analiza, diseña y mejora la UI y UX de Pandas11 para facilitar las tareas de sus usuarios. Úsala al revisar pantallas poco amigables, formularios, navegación, tablas, diálogos, mensajes, accesibilidad o flujos nuevos de ventas, inventario, citas y pagos. Presenta primero los cambios exactos y aplica solo el plan aprobado, respetando SDD, permisos y reglas de negocio. No usar para cambios exclusivamente de backend sin impacto en la experiencia.
---

# UI y UX de Pandas11

Ayudar al usuario a entender qué está viendo, qué puede hacer y qué ocurrió. Priorizar completar correctamente la tarea sobre decorar la pantalla. Responder en español.

## 1. Entender la tarea y su alcance

- Distinguir la solicitud: diagnóstico, propuesta de flujo, diseño o implementación. Una petición de ideas permite analizar y proponer; no autoriza por sí sola cambiar la aplicación.
- Identificar quién usa la pantalla, qué necesita lograr, dónde empieza y qué resultado espera. Inferir del contexto y consultar fuentes disponibles antes de preguntar. Preguntar solo por información que cambie materialmente la solución.
- Leer `AGENTS.md`, las especificaciones relevantes, `specs/business-rules.md`, `Pandas11.sql` y el código relacionado. Usar las validaciones recientes para distinguir lo implementado de lo pendiente; no tratar una especificación histórica como estado actual.
- Contrastar servicios, permisos y migraciones si la propuesta afecta datos. El SQL local no demuestra el estado remoto.
- Revisar componentes compartidos y pantallas vecinas para reutilizar patrones de Angular, formularios, estado y estilos. No introducir dependencias ni un sistema visual nuevo por defecto.

## 2. Auditar un recorrido concreto

Elegir una tarea representativa, por ejemplo registrar una entrada de productos, y recorrerla desde el acceso hasta la confirmación. Si hay navegador disponible, usar datos sintéticos y un entorno local autorizado. Si solo se revisa código, declarar esa limitación.

Comprobar:

- **Orientación:** título, contexto del registro y siguiente acción reconocibles.
- **Jerarquía:** acción principal visible; acciones secundarias y destructivas diferenciadas. No dar el mismo peso visual a todos los botones.
- **Carga de trabajo:** pasos, campos y cambios de contexto necesarios; información repetida o decisiones presentadas demasiado pronto.
- **Formularios:** etiquetas persistentes, obligatoriedad clara, formatos y unidades visibles, errores asociados al campo y conservación de datos al fallar. El placeholder no sustituye la etiqueta.
- **Selección y búsqueda:** nombres y contexto suficientes para distinguir resultados; selección visible y fácil de corregir; filtros y paginación comprensibles.
- **Estados:** carga, vacío inicial, búsqueda sin resultados, éxito, error, falta de permiso, conflicto de actualización y resultado de envío desconocido.
- **Accesibilidad:** teclado, foco visible y restaurado al cerrar diálogos, nombres accesibles, mensajes anunciados cuando corresponda, contraste y estados comprensibles sin depender solo del color.
- **Adaptación:** recorrido usable en móvil, zoom y modo oscuro; espaciado lógico y RTL donde aplique. Evitar que acciones esenciales queden fuera del área accesible.

Clasificar cada hallazgo como bloqueo, fricción o mejora visual. Vincularlo a un archivo/elemento observado, explicar su efecto y proponer una corrección verificable. Separar hechos del código, riesgos inferidos e hipótesis que requieren probarse con usuarios. No inventar métricas de ahorro de tiempo.

## 3. Proponer la experiencia antes del detalle visual

- Describir brevemente el recorrido propuesto: entrada, decisiones, revisión, acción y resultado. Usar un boceto textual o diagrama solo si aclara el flujo.
- Mantener lo frecuente a mano y revelar opciones avanzadas cuando hagan falta. Elegir página, sección o diálogo según complejidad; no convertir todo en asistentes de varios pasos.
- Usar lenguaje cotidiano del negocio. Traducir etiquetas de presentación como `OWNER` a «Propietario» sin cambiar los valores internos. No exigir UUID, versiones o nombres de columnas para tareas habituales.
- Mostrar nombres, fechas y referencias disponibles que permitan reconocer registros. No inventar folios ni nuevas relaciones para ocultar identificadores técnicos; proponer por separado los cambios de datos que hagan falta.
- Explicar unidades, moneda y fechas según las convenciones del proyecto. Respetar precisión monetaria y zona horaria; verificar conversiones si se simplifican filtros de fechas.
- Usar acciones específicas («Registrar entrada», «Guardar borrador»). Explicar el resultado y el siguiente paso en mensajes de éxito/error. Mantener detalles técnicos de diagnóstico fuera del mensaje principal.
- Dar confirmación adicional cuando la consecuencia lo justifique y explicar qué cambiará. No añadir confirmaciones a cada acción reversible.
- Mostrar resúmenes o estimaciones útiles solo si se pueden calcular correctamente; distinguirlos de importes definitivos del servidor.
- Reutilizar tokens, controles y componentes existentes. Mantener coherencia en botones, separación, densidad, tipografía y estados de interacción.

Para ejemplos propios del proyecto, consultar [patrones y casos](references/pandas11-patterns.md). Verificar siempre que sigan vigentes.

## 4. Preservar las reglas al simplificar

- Identificar los IDs RN aplicables en la versión actual de `specs/business-rules.md` y relacionarlos con los criterios de aceptación.
- No confundir confirmar una venta con cobrarla ni borrar información financiera al cancelar.
- No convertir una decisión obligatoria sobre devolución al inventario en un valor preseleccionado.
- No quitar permisos, validaciones, motivos obligatorios, control de concurrencia o protección contra duplicados para reducir pasos. Ocultar un botón no sustituye la autorización del servidor/RLS.
- Conservar el contenido y la identidad de solicitudes cuyo resultado sea desconocido. No generar un nuevo envío ni habilitar cambios incompatibles con un reintento seguro solo para desbloquear la pantalla. Explicar cómo resolver la operación pendiente.
- No presentar como disponible una función pendiente ni habilitarla mediante cambios de apariencia.

## 5. Presentar los cambios exactos y esperar aprobación

- Antes de editar archivos del proyecto, realizar únicamente análisis de lectura y entregar al usuario una propuesta concreta. Indicar las pantallas y archivos previstos, los elementos que cambiarán, el comportamiento resultante, las reglas o permisos afectados y cómo se comprobará. Si algún detalle depende de una decisión del usuario, señalarlo en la propuesta.
- Pedir aprobación explícita de esa propuesta y esperar la respuesta antes de modificar código, estilos, pruebas, especificaciones o datos. Una solicitud general como «mejora esta página» o «arregla estos problemas» inicia el análisis y la propuesta; no sustituye la aprobación de los cambios exactos.
- Si el usuario ya aprobó en la conversación un plan concreto que cubre exactamente el trabajo actual, aplicar ese plan sin pedir otra aprobación. Si durante la implementación aparece un cambio fuera de ese alcance, presentar la ampliación exacta y esperar su aprobación antes de aplicarla.
- Para diagnósticos e ideas, entregar solo hallazgos y propuestas. Para una funcionalidad nueva, un cambio importante de comportamiento o de esquema, seguir también el flujo SDD del proyecto; la aprobación debe cubrir los requisitos y el plan antes de implementar.
- Una vez aprobado, aplicar cambios acotados con los patrones instalados. No extender una mejora de pantalla a un rediseño global ni modificar producción.

## 6. Validar y entregar

- Revisar los criterios de aceptación con el recorrido completo y datos sintéticos, incluyendo los estados de error relevantes y diferencias entre roles.
- Cuando se cambie la aplicación, ejecutar compilación y pruebas pertinentes. Añadir pruebas cuando protejan un comportamiento relevante; evitar pruebas que solo repitan clases CSS o texto decorativo.
- Verificar visualmente teclado, móvil y temas afectados cuando haya herramientas disponibles. Una compilación correcta no demuestra usabilidad ni accesibilidad.
- Registrar resultados y limitaciones en la validación de la funcionalidad cuando corresponda. No afirmar pruebas visuales o con usuarios que no se realizaron.
- Entregar hallazgos por prioridad, propuesta concreta y criterio de aceptación; si se implementó, resumir cambios, pruebas y pendientes reales. Limitar la lista inicial a lo más útil para la tarea, sin auditorías interminables.
