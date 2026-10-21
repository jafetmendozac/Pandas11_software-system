# Paquete de revisión — actividades 1, 2 y 3

Preparado el 2026-10-21 (America/Lima) para revisión de Alex y Caro. Versión local de referencia: Git `2d2e19d` más los cambios de esta entrega. Las capturas muestran exclusivamente datos sintéticos del entorno Supabase local `127.0.0.1:55321/55322`. La revisión de los dueños, las actas y la aceptación formal **siguen pendientes**.

## Evidencia disponible

| Punto | Evidencia visual de esta entrega | Qué se comprobó y límite |
|---|---|---|
| 2.2, 2.4 | [CLIENT consulta su ficha](evidencia-2-cliente-propio.png), [CLIENT sin acceso a agenda](evidencia-2-cliente-denegado.png) | Inicio de sesión CLIENT, lectura de ficha vinculada y denegación de `/calendario`. La captura no prueba por sí sola registro, entrega de correo ni todas las políticas RLS. |
| 3.1 | [Clientes filtrados por DEMO](evidencia-3-1-clientes.png) | STAFF consulta fichas; búsqueda con datos sintéticos. Alta, edición y baja lógica siguen en las pruebas locales previas y requieren recorrido de aceptación. |
| 3.2 | [Mascotas filtradas por DEMO](evidencia-3-2-mascotas.png) | STAFF consulta mascotas, tamaño y datos visibles. Revisar ficha/vacunas/notas con los dueños. |
| 3.3 | [Servicios DEMO](evidencia-3-3-servicios.png), [tarifas DEMO](evidencia-3-3-tarifas.png) | STAFF consulta precios y duraciones ficticios. Durante el recorrido se corrigió que Tarifas mostrara UUID en lugar del nombre de servicio; prueba Angular y captura final lo verifican. Los precios reales del negocio no están aprobados. |
| 3.5 | [Cita pasada completada](evidencia-3-5-completada.png), [cita pasada cancelada](evidencia-3-5-cancelada.png) | STAFF abrió ambas fichas desde el calendario; se ven fecha, estado, cliente, mascota, servicio, precio, duración, trabajador y motivo de cancelación. La completada fue un fixture temporal insertado con SQL privilegiado **solo en la instancia local** y eliminado al terminar; la cancelada proviene del seed DEMO. La transición normal a COMPLETED está validada por las pruebas API, no por la creación de esta captura. |

Las capturas se obtuvieron en Chrome Headless 155, ancho 1440 px, sobre una compilación Angular con configuración local. El recorrido terminó sin excepciones JavaScript ni solicitudes a Supabase remoto. `node scripts/test-local-seed.mjs`: 41 comprobaciones correctas. Tras corregir la presentación de Tarifas, `npm test -- --watch=false --browsers=ChromeHeadless`: 93/93 correctas; compilaciones local y de producción correctas. La compilación de producción avisó que el CSS de la portada excede en 118 bytes su presupuesto de 4 kB; ese archivo no se modificó. La validación anterior de 3.5 registró 82 comprobaciones API de agenda y 92 pruebas Angular; las 93 incluyen la nueva prueba de Tarifas. No se suman suites acumulativas como pruebas distintas. La consulta final de la base local encontró **cero** citas con la marca del fixture temporal.

## Revisión que deben realizar Alex y Caro

| Punto | Decisión/observación a registrar | Estado |
|---|---|---|
| 1.1 | Completar fecha, medio, acuerdos y responsables de la reunión inicial en el [acta parcial](actividad-1-acta-plantilla.md). | Pendiente de información de quienes participaron. |
| 1.2, 1.4, 1.5 | Revisar [ERD conceptual/físico](actividad-1-modelo-datos.md), [diccionario](actividad-1-diccionario-datos.md) y [conciliación H-03 a H-23](features/revision-modelo-base-datos/conciliation.md). Aceptar o anotar correcciones. | Pendiente de conformidad; el esquema remoto no está acreditado. |
| 1.3 | Aportar constancias y fechas del proyecto Supabase y repositorio GitHub, sin claves ni datos privados. | Pendiente de evidencia externa. |
| 2.1–2.4 | Recorrer registro, confirmación de correo, acceso OWNER/ADMIN/STAFF/CLIENT, perfil y salida. Confirmar el alcance de roles y del panel. | Capturas parciales y pruebas técnicas disponibles; aceptación pendiente. |
| 3.1–3.3 | Revisar alta/edición/baja lógica, ficha, vacunas, notas internas, catálogo y **precios/duraciones comerciales reales**. | Capturas de consulta y pruebas técnicas disponibles; aceptación pendiente. |
| 3.4 | Recorrer creación de cita, varias mascotas, relevo, conflicto, reprogramación y cancelación. | Pruebas técnicas previas disponibles; recorrido humano pendiente. |
| 3.5 | Confirmar que consultar citas pasadas y canceladas con detalle satisface «históricos». | Alcance definido por el usuario y demostrado en navegador local; conformidad de Alex y Caro pendiente. |

## Registro de conformidad

| Revisor | Actividades revisadas | Resultado (acepta / observa) | Observaciones o referencia a acta | Fecha y medio |
|---|---|---|---|---|
| Alex | Pendiente | Pendiente | Pendiente | Pendiente |
| Caro | Pendiente | Pendiente | Pendiente | Pendiente |

Una captura y una prueba correcta muestran comportamiento técnico; no sustituyen la conformidad del negocio. Registrar aquí solo respuestas reales de los revisores. Si solicitan cambios funcionales o de esquema, crear requisitos y plan SDD específicos antes de implementarlos.
