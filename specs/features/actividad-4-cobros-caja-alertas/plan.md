# Plan — Cobros comerciales, caja básica y mínimos

Fecha: 2026-10-22. Estado: aprobado mediante «Vamos con eso»; implementación local y validación registradas en `validation.md`.

## Modelo y discrepancias

`Pandas11.sql` define `payments` con FK obligatoria a `appointments`, `sales`/`sale_items`, `products` e inventario; no define caja, cobros de venta ni mínimo. Las migraciones locales y los servicios Angular coinciden en esa separación. El archivo SQL raíz es referencia, no evidencia del esquema desplegado. Se crearán migraciones incrementales tras comprobar la instancia local; no se ejecutará el archivo raíz ni se editarán migraciones ya aplicadas.

Modelo incorporado a `Pandas11.sql` tras aprobación:

- `sale_payments`: venta, importe PEN, método, estado, referencias, autor, verificador, fechas, versión, solicitud UUID y payload canónico; FKs y restricciones. Solo cobro de subtotal PRODUCT. Pago PAID inmutable.
- `cash_sessions`: único OPEN, fondo inicial, apertura/cierre, contado, esperado, diferencia, actor y versión. El cierre no elimina movimientos.
- `cash_movements`: sesión, origen (`APPOINTMENT_PAYMENT`, `SALE_PAYMENT`, `MANUAL_IN`, `MANUAL_OUT`), referencia única al pago cuando corresponda, medio, importe firmado, motivo, actor y fecha. Sin DML directo de usuarios autenticados.
- `products.minimum_stock`: entero no negativo o NULL. Existentes quedan NULL para no inventar umbrales.

No volver nullable `payments.appointment_id` ni transformar cobros previos. Mantener `sales.total` y snapshots; calcular subtotal PRODUCT/SERVICE y cobros confirmados en servidor. La relación cita→venta existente sigue siendo opcional y única para ventas activas. Reconciliar movimientos automáticos solo con pagos nuevos verificados tras la migración; los PAID históricos no se adscriben a una caja sin evidencia.

## Secuencia aprobada

1. Preflight local: estado Git, migraciones aplicadas, tablas/funciones/RLS, saldos y pruebas base. Informar discrepancias antes de tocar esquema. Registrar COM-D01–COM-D05 como reglas nuevas con IDs RN y actualizar especificaciones.
2. Migración de cobros comerciales: tabla, permisos/RLS OWNER/ADMIN, RPC de registro, verificación/rechazo, consulta paginada y resumen por venta. Validar monto decimal y límite de subtotal de productos en servidor, bajo el mutex transaccional de citas/ventas; revalidar rol tras esperas. Ajustar cancelación de venta para reconocer cobro de productos PAID, sin alterar disposición de inventario.
3. Migración de caja: tablas, permisos/RLS, RPC de apertura, movimientos manuales, cierre, detalle y consulta. Integrar verificaciones de `payments` y `sale_payments` con ingreso automático atómico a sesión OPEN. Orden de bloqueo fijo: mutex de negocio → sesión → venta/cita/pago; comprobar contra los bloqueos de inventario para evitar ciclos. Revalidar permisos tras esperas. Registrar salida manual como importe negativo, sin confundirla con devolución de pago.
4. Migración de mínimo: columna y RPC/autorización de actualización; búsqueda con `stock`, `minimum_stock`, `low_stock` calculado por balance actual. Sin tabla de avisos, cron ni mensajes. Mantener coherencia con altas de producto y la búsqueda de catálogo ya paginada.
5. Angular: ampliar modelos/servicios de ventas/pagos/inventario, añadir servicio/modelos de caja y página `/caja` bajo guard/menú por permiso. En `/ventas`, mostrar saldos separados y cobro de productos; en `/pagos`, conservar cobro de cita y explicar caja abierta; en `/productos`, umbral/filtro/contador. Respetar componentes standalone y patrones existentes, sin dependencias ni reorganización.
6. Actualizar `Pandas11.sql`, reglas, arquitectura, matriz, roadmap, anexo comercial y `validation.md` solo con resultados observados. Ningún cambio remoto, reset, datos reales, commit o push.

## Seguridad y pruebas previstas

- SQL/RLS: OWNER/ADMIN/STAFF/CLIENT/anon, perfil inactivo, permisos nominales, DML directo, transición de estados, tope exacto PRODUCT y no duplicación con cita, referencias, reintentos y sobrecobro concurrente.
- Caja: una OPEN, apertura/cierre concurrente, verificación sin caja, ingreso único por pago y método, retiro sin saldo negativo, fondo/contado/diferencia, PAID históricos fuera de sesiones y autorización tras bloqueo.
- Inventario: mínimo NULL/0/positivo; umbral exacto con ventas, entradas, ajustes y RESTOCK; producto inactivo visible y no alteración del stock por caja.
- API local con usuarios/UUID sintéticos y limpieza delimitada; pruebas Angular de flujos/permisos/errores; compilación, lint SQL, `supabase test db`, scripts API pertinentes y recorrido visual Chrome móvil/oscuro/RTL. Documentar cualquier prueba no ejecutable y regresiones.

## Aprobación y ejecución

COM-D01–COM-D05 y las ampliaciones de modelo fueron aprobadas mediante «Vamos con eso». Se aplicaron seis migraciones incrementales locales: `20261022160000_commercial_payments_cash.sql`, `20261022163000_product_minimum_stock.sql`, `20261022164000_low_stock_balance_metadata.sql`, `20261022165000_cash_close_alias.sql`, `20261022166000_cash_post_permission_recheck.sql` y `20261022167000_product_minimum_lock.sql`. Las últimas cuatro ajustan el contrato de listado, corrigen una ambigüedad de SQL, revalidan permisos tras esperas y eliminan una variable innecesaria sin editar migraciones ya aplicadas. No hay cambios remotos.
