# Validación — Inventario y movimientos

Fecha: 2026-10-22 (America/Lima). Estado: alcance INV-01–INV-08 implementado y validado en Supabase local y Angular.

## Autorización y contexto

El usuario aprobó requisitos, plan, cambio de modelo y decisiones INV-D01–INV-D05 mediante «Añadelo entonces» con `$sdd-feature`. Se aplicó [.agents/skills/sdd-feature/SKILL.md](../../../.agents/skills/sdd-feature/SKILL.md). Al empezar, únicamente estaba sin seguimiento el directorio de propuesta de inventario. Se conservaron los demás archivos y no se hicieron commits/pushes.

Preflight con PostgreSQL local: diez migraciones previas aplicadas, products/sales/sale_items con RLS y ninguna tabla de inventario. Modelo previsto contrastado con migraciones y código; sin revisión de base remota. Productos existentes se inicializan en cero, sin inferir cantidades reales ni insertar movimientos ficticios. La carga inicial solo está disponible antes del primer movimiento; después se usan entradas/reposiciones.

## Entrega y trazabilidad

| Criterio | Resultado y evidencia |
|---|---|
| INV-01 / RN-22, RN-26 | Balance por producto, stock cero al alta, listado paginado y búsqueda. Trigger de productos; carga inicial única; reconciliación con suma de movimientos. |
| INV-02 / RN-23 | OWNER/ADMIN registran entradas/carga inicial; ajustes solo OWNER con permiso. Motivo, enteros, versión y límites; rechazo de stock negativo, desbordamiento, campos falsificados y productos inactivos. |
| INV-03 / RN-19, RN-24 | Borrador no reserva. Confirmación mixta/mostrador descuenta stock en una transacción. Insuficiencia de una línea revierte todas; carreras venta/venta y ajuste/venta por la última unidad verificadas con conexiones concurrentes. |
| INV-04 / RN-21, RN-25 | Anulación de borrador sin movimiento; productos confirmados requieren OWNER y disposición explícita. RESTOCK registra entrada compensatoria única, incluso si el producto está inactivo; NO_RESTOCK conserva salida. Reintentos no duplican efectos ni permiten cambiar disposición ya aplicada. |
| INV-05 / RN-26 | Historial paginado por producto/tipo/fecha/venta, saldo anterior/posterior, actor y fecha de servidor. Clientes autenticados no insertan, editan ni borran movimientos por REST. |
| INV-06 / RN-23, RN-25 | RLS por rol activo OWNER/ADMIN y permisos; STAFF/CLIENT/anon denegados. Permiso delegado a STAFF no habilita acceso; ADMIN con permiso nominal de ajuste tampoco equivale a OWNER. Retirar actividad mientras una entrada espera por fila de producto termina en denegación. |
| INV-07 / RN-12, RN-16–RN-20 | UI de productos muestra stock/movimientos; ventas confirma con stock y solicita disposición al anular. Venta mixta compara subtotal de servicios separado; snapshots y cobro de cita permanecen intactos. Sin insertar/editar dinero desde inventario. |
| INV-08 / RN-24, RN-26 | UUID/payload de movimientos conservados tras red ambigua; errores definitivos liberan formulario para recargar. Conflictos, respuestas fuera de orden y bloqueo de doble envío cubiertos en Angular. Foco CDK, móvil, oscuro/RTL y recarga directa comprobados en Chrome. |

## Cambios de esquema y seguridad

Aplicadas solo mediante `supabase migration up --local`, sin reset:

- `20261022140000_inventory_movements.sql`: tablas, índices/restricciones, trigger de saldo cero, permisos/RLS, RPC de consulta/escritura y confirmación/anulación de ventas. `sales.inventory_disposition` y sus metadatos usan cancelled_by/at/reason; la firma anterior de cancel_sale se reemplaza sin vía de omitir disposición para artículos confirmados.
- `20261022143000_inventory_permission_recheck.sql`: refuerzo tras esperas por actualización del catálogo, sin editar la migración ya aplicada. Verificado con retirada de actividad durante espera real por fila.

`Pandas11.sql` describe las tablas/relaciones nuevas y referencia ambas migraciones para RPC/políticas. El orden común es mutex transaccional930003, productos por UUID y saldo bloqueado. La API exige Read Committed mediante el helper de agenda existente. No se conceden escrituras directas a authenticated; las operaciones son RPC autorizadas. service_role solo se usa en scripts Node locales para fixtures y permanece fuera del frontend/salida.

## Pruebas ejecutadas

| Comprobación | Resultado |
|---|---|
| `supabase test db` final | **230/230**, ocho suites: 59 comprobaciones nuevas de inventario y regresiones existentes. Se actualizó una expectativa anterior para reflejar confirmación idempotente aprobada. |
| `node scripts/test-inventory-api.mjs` | **87 comprobaciones** correctas; API autenticada real, RLS, enteros, conflictos, historial/paginación, reintentos, disposiciones, concurrencia y retirada de permisos tras espera. |
| `node scripts/test-sales-api.mjs` | **26 comprobaciones** de regresión correctas. |
| `node scripts/test-payments-api.mjs` | **107 comprobaciones** de regresión correctas. |
| `npm test -- --watch=false --browsers=ChromeHeadless` | **109/109** correctas; siete pruebas nuevas de productos/inventario y dos de autorización/disposición en ventas; se actualiza el criterio de confirmación de artículos. |
| TypeScript app/spec sin emisión | Correctos. |
| `supabase db lint --local` | Sin errores de esquema. |
| `npm run build` | Correcto; persiste advertencia previa CSS de inicio, 118 bytes sobre presupuesto. |
| Build local temporal | Correcto en `/private/tmp/pandas11-inventory-build`. |
| Reconciliación PostgreSQL posterior | Cero saldos distintos de suma de movimientos y cero productos sin balance; ambas migraciones registradas. |
| `git diff --check` | Correcto. |

Las pruebas SQL hacen rollback. Scripts API y Chrome usan exclusivamente instancia local55321/55322, UUID/cuentas sintéticas propias, y limpian solo esos fixtures, incluyendo movimientos antes de productos/ventas. Las carreras se coordinan con un bloqueo mantenido por otra conexión: se verifica que las dos RPC estén esperando simultáneamente antes de liberarlo. La retirada de permisos usa una espera real por fila y desactiva solo su usuario sintético. No se ejecutaron migraciones/pruebas remotas, reset ni datos reales.

## Recorrido Chrome y revisión visual

Harness temporal fuera del repositorio, sin dependencias nuevas; formulario de acceso real y usuarios OWNER/ADMIN/STAFF/CLIENT sintéticos. Recorrido final correcto:

- OWNER crea producto, carga10 unidades y ajusta−1, con stock9.
- Crea borrador desde UI y confirma: salida1 y saldo8. Anula con RESTOCK: saldo9.
- Segunda venta sintética preparada/confirmada por API y anulada desde UI con NO_RESTOCK: saldo8, sin reponer.
- ADMIN registra reposición2: saldo10, sin opción de ajuste en el formulario. STAFF/CLIENT reciben denegación comercial.
- Foco dentro del modal, recarga directa de productos, escritorio y móvil390px oscuro/RTL; sin desborde horizontal, excepciones JS de aplicación ni conexiones Supabase remotas.

Capturas inspeccionadas: `/private/tmp/pandas11-inventory-review-1FEyVV/inventory-desktop.png` y `inventory-mobile-dark-rtl.png`; también `sale-cancelled.png`. Artefactos temporales; no se incorporan cuentas/capturas de pruebas al producto. Los primeros intentos del script no se contabilizan: se corrigieron esperas de render/navegación, selección de listado y un selector que confundía el filtro del historial con el formulario de ajuste.

## Límites y siguientes entregas

No incluye cobro de mostrador/productos, saldo mixto, caja, alertas/mínimos, lotes, ubicaciones, costos/valorización, impuestos/descuentos, devoluciones parciales, documentos tributarios ni despliegue remoto. Confirmar productos registra compromiso comercial y salida física según política aprobada; no acredita pago. Los datos del catálogo existente comienzan en cero y su carga operativa requiere cantidades verificadas por personal autorizado; estas pruebas no acreditan inventario físico.

La UI revisada no cubre visualmente cada combinación de filtros/roles ni todas las carreras; esos casos se complementan con SQL/API y pruebas Angular. El harness Chrome no es una suite E2E versionada. No se ha conciliado una base remota ni se ha aplicado el SQL raíz.
