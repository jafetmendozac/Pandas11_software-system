# Validación — Actividad 5.5

Fecha: 2026-10-31 (America/Lima). Estado: **implementado y validado localmente; pendiente de aceptación operativa**. [Requisitos](requirements.md) y [plan aprobado](plan.md).

| Criterio | Resultado y evidencia |
|---|---|
| UX55-01 | El sidebar presenta solo las 14 rutas operativas según permiso y rol seleccionado; se retiraron de su render las páginas de plantilla y la sección «Ejemplos». Conserva `aria-current` para el enlace activo. Prueba de componente actualizada y recorrido de rutas. |
| UX55-02 | El encabezado muestra el selector de rol también en su menú móvil; botones de menú con nombre español, `aria-controls`, `aria-expanded` y foco visible. Se retiraron búsqueda y atajo sin acción. Prueba de componente y selección visual de Propietario desde móvil. |
| UX55-03 | El diálogo de Productos muestra saldo y formulario antes de un historial plegable; ajustes usan dirección y cantidad entera positiva, con traducción a `delta` firmado. Ya no presenta la versión de stock. Pruebas de ajuste positivo/negativo y validación de entrada. |
| UX55-04 | El código conserva motivo, permisos, saldo validado por RPC, `expected_version` y el mismo `request_id`/payload en reintento incierto. Durante un pendiente se bloquean campos, cierre y recarga. Prueba de reintento existente y revisión del componente. |
| UX55-05 | Reportes explica intervalos sin cobros ni citas completadas y conserva meses/CSV; tablas desplazables con foco y nombre accesible, pista móvil y controles legibles en oscuro/RTL. La vista de rol sin permiso oculta informe y descargas. Pruebas de componente y revisión visual. |
| UX55-06 | Recorrido local de 14 rutas operativas en viewport de 390 px con cuenta sintética y rol Propietario: 14/14 cargaron sin alertas ni desbordamiento horizontal del documento. Capturas e inspección visual de panel, calendario, ventas, caja, Productos y Reportes; Reportes/Productos también en oscuro y RTL real. Compilación y pruebas Angular correctas. |

## Comprobaciones técnicas

- `npx ngc -p tsconfig.app.json --noEmit`: correcto.
- `npx tsc -p tsconfig.spec.json --noEmit`: correcto.
- `npm test -- --watch=false --browsers=ChromeHeadless`: **152/152** pruebas correctas.
- `npm run build`: correcto. Advertencia previa de presupuesto CSS en `inicio.component.css` (1.46 kB sobre 4 kB), no introducida por 5.5.
- `git diff --check`: correcto.
- No se modificó SQL, esquema, migraciones, RLS ni contratos RPC; no corresponde una suite SQL nueva a esta entrega.

## Hallazgos y límites

- La revisión visual local usó la instancia Supabase y una cuenta sintética; no consultó producción ni acredita aceptación humana. No hubo evaluación formal con lector de pantalla o auditoría automatizada de accesibilidad. La inspección de teclado se limita a estados y focos implementados, pruebas de componentes y controles nativos; requiere recorrido asistido en aceptación.
- La cuenta sintética con CLIENT y OWNER inicia con CLIENT seleccionado; desde el menú móvil pudo cambiarse a Propietario y consultar las rutas autorizadas. La selección inicial procede del servicio de autorización actual y puede generar confusión. Requiere decisión específica sobre preferencia de rol, fuera del plan aprobado.
- En el calendario móvil, la etiqueta «Cliente o mascota» del filtro se estrecha demasiado en la rejilla. Es un hallazgo de la revisión integral y requiere un ajuste de agenda con plan propio.
- Las rutas de plantilla siguen presentes por decisión aprobada; ya no aparecen en el menú operativo. No se hizo despliegue remoto, commit ni push.
