# Validación — Cobros comerciales, caja básica y mínimos

Fecha: 2026-10-22 (America/Lima). Estado: COM-01–COM-07 implementados y validados localmente, incluido el recorrido visual de móvil, oscuro y RTL. Pendientes: aceptación operativa y adopción remota.

## Autorización y preflight

El usuario aprobó COM-D01–COM-D05 y el cambio de modelo del [plan](plan.md) mediante «Vamos con eso». Al iniciar, Git solo mostraba sin seguimiento la propuesta SDD de esta funcionalidad; se conservaron los demás archivos. `Pandas11.sql`, migraciones, RLS, servicios y pantallas de ventas/pagos/inventario se contrastaron. `payments` seguía exigiendo cita y no existían cobros de productos, caja ni mínimos. El esquema remoto no fue inspeccionado. `supabase status` necesitó acceso al socket Docker local; se obtuvo para validar únicamente la instancia 55321/55322. No se ejecutó el SQL raíz, reset, cambios remotos, commits ni pushes.

## Entrega y reglas

| Criterio | Evidencia local |
|---|---|
| COM-01 / RN-12, RN-19, RN-27 | `sale_payments` cobra solo subtotal PRODUCT de venta confirmada. Resumen y detalle de venta exponen servicios/cita y productos por separado. SQL verifica venta mixta sin duplicar cobro de cita. |
| COM-02 / RN-02, RN-16–RN-18, RN-27 | OWNER/ADMIN registran PENDING con cinco métodos; solo OWNER verifica/rechaza. RPC con UUID de reintento, versión, tope de producto, RLS y DML directo revocado. SQL/API comprueban rechazo por rol, sobrecobro y dos verificaciones simultáneas del último saldo. |
| COM-03 / RN-21, RN-25, RN-27 | Anulación OWNER de venta confirmada con producto y dinero conserva PAID y marca resolución; disposición RESTOCK/NO_RESTOCK existente permanece obligatoria. |
| COM-04 / RN-28 | Una caja OPEN como máximo. Trigger transaccional impide verificar sin caja y publica una entrada única por cita/producto y método. Cobros PAID históricos no reciben movimientos inventados. Revalidación de permiso después de esperar sesión. |
| COM-05 / RN-29 | Fondo, ingreso/retiro manual OWNER, retiro sin efectivo esperado negativo, totales por medio, contado y diferencia de cierre. Cierre y movimientos con reintentos/versiones; sesiones y movimientos consultables. |
| COM-06 / RN-22–RN-26, RN-30 | `minimum_stock` NULL/entero, consulta paginada de stock ≤ mínimo y filtro en `/productos`. Pruebas de cruce por venta y eliminación de alerta por reposición; sin bloqueo de venta. |
| COM-07 / RN-27–RN-30 | `/caja`, saldos y cobros en `/ventas`, enlace de caja desde `/pagos`, mínimos en `/productos`; build, pruebas Angular y recorrido Chrome con datos sintéticos a 1280 y 390 px en claro, oscuro y RTL. |

## Migraciones y archivos

Se aplicaron seis migraciones incrementales **solo localmente**, en orden: `20261022160000_commercial_payments_cash.sql` (tablas, RLS, RPC y triggers), `20261022163000_product_minimum_stock.sql`, `20261022164000_low_stock_balance_metadata.sql`, `20261022165000_cash_close_alias.sql`, `20261022166000_cash_post_permission_recheck.sql` y `20261022167000_product_minimum_lock.sql`. Las cuatro últimas afinan contratos/correcciones sin editar migraciones ya aplicadas. El modelo de referencia `Pandas11.sql` contiene las entidades nuevas y remite a las migraciones para funciones/políticas. `CommercialService`, modelos, páginas y rutas Angular incorporan el contrato.

## Pruebas ejecutadas

| Comprobación | Resultado |
|---|---|
| `supabase test db` | **272/272** en nueve suites. 37 comprobaciones nuevas en `commercial_cash.test.sql` y cinco de venta mixta añadidas a inventario; regresiones previas verdes. Las pruebas SQL hacen rollback. |
| `node scripts/test-commercial-api.mjs` | **36 operaciones** con autenticación real y fixtures sintéticos: roles/RLS, mínimos, venta, cobro, caja, sobrecobro concurrente, cierre y limpieza. |
| `node scripts/test-payments-api.mjs` | **107 comprobaciones** correctas; fixture actualizado para abrir/cerrar caja y limpiar solo registros propios. |
| `node scripts/test-sales-api.mjs` | **26 comprobaciones** correctas. |
| `node scripts/test-inventory-api.mjs` | **87 comprobaciones** correctas. |
| `npm test -- --watch=false --browsers=ChromeHeadless` | **114/114** correctas, incluidas nuevas pruebas de caja, alerta exacta y reintento de cobro. |
| `npx tsc --noEmit -p tsconfig.app.json` y `tsconfig.spec.json` | Correctos. |
| `npm run build` | Correcto. Persiste advertencia previa: CSS de inicio excede presupuesto en 118 bytes. |
| `supabase db lint --local --schema public` | Sin errores ni advertencias del esquema público. Lint de todas las extensiones reporta diagnósticos preexistentes de pgTAP. |
| `git diff --check` | Correcto para archivos seguidos. |

La primera ejecución de suites SQL mostró fallos esperados en fixtures previos que verificaban cobros sin caja; se actualizaron para abrir sesión. La nueva prueba reveló una ambigüedad de alias en `close_cash`, corregida con migración incremental. La prueba de venta mixta comparó inicialmente `99.00` con el texto exacto `99`; se ajustó la expectativa sin alterar el importe. Una compilación inicial en sandbox terminó con código 134 y una revisión automática posterior agotó su plazo; el build final con acceso autorizado completó correctamente.

## Recorrido visual de cierre

Se inició sesión con la cuenta ficticia OWNER del entorno local y se crearon, exclusivamente en Supabase local, un cliente y producto sintéticos, una venta confirmada de dos unidades, un cobro pendiente de S/ 4.25 y una caja con fondo de S/ 10.00. Se inspeccionaron `/caja`, `/ventas` y `/productos` en Chrome de escritorio (1280 px) y móvil (390 px) en claro, oscuro y RTL; también el diálogo de venta y el filtro de mínimos. No se observó desbordamiento horizontal de la página a 390 px; el diálogo mantuvo desplazamiento interno y foco inicial en «Cerrar». Al verificar el cobro desde la UI, ventas pasó de cobrado S/ 0.00/saldo S/ 10.00 a cobrado S/ 4.25/saldo S/ 5.75, y caja mostró un único movimiento de S/ 4.25 con efectivo esperado S/ 14.25. El filtro mostró 1 unidad frente a mínimo 2. Los registros sintéticos se eliminaron al concluir.

Se corrigieron textos observados en el recorrido: códigos internos de método/estado/rol visibles en ventas y movimientos de caja, instrucción de confirmar una venta ya confirmada y plural «1 unidades». Se reutilizaron las etiquetas de pago existentes; no cambió la lógica financiera ni el esquema. Las capturas y el harness exploratorio fueron temporales y no forman una suite E2E versionada.

Tras estas correcciones, `npm test -- --watch=false --browsers=ChromeHeadless` volvió a pasar **114/114**, `npm run build` terminó correctamente con la misma advertencia previa de 118 bytes en CSS de inicio y `git diff --check` no encontró errores.

## Límites y pendientes

No se probó adopción ni datos de base remota. Para aceptación operativa aún se requiere que personal autorizado revise con casos propios la apertura/cierre de caja, verificación y rechazo de cobros, anulación con disposición de stock y alerta de mínimos. Antes de una adopción remota se necesita identificar el entorno destino, comparar sus migraciones/RLS/datos con `Pandas11.sql` y las seis migraciones, preparar respaldo y secuencia de aplicación, y obtener aprobación específica; no se ejecutan cambios en producción en esta tarea. Los mínimos son avisos dentro de productos, sin notificaciones externas. La caja es un registro operativo; no incluye conciliación bancaria, factura, devolución, múltiples locales ni contabilidad. Los pagos históricos anteriores a esta función permanecen sin sesión y no se asignan por inferencia. Un guardado de producto y su mínimo son dos RPC consecutivas: ante un fallo entre ambas, la UI conserva el formulario y el operador debe recargar/reintentar el mínimo.
