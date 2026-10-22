# Actividades 4.4–4.5 — Inventario y movimientos

Fecha: 2026-10-22 (America/Lima). Estado: plan y decisiones INV-D01–INV-D05 aprobados mediante «Añadelo entonces» con `$sdd-feature`.

## Contexto y dependencias

Revisados misión, stack, arquitectura, baseline, reglas, matriz, anexo comercial y entrega visual de ventas. `Pandas11.sql` y migraciones de ventas contienen catálogo `products` por unidad, cabecera `sales` y detalle `sale_items`; no contienen existencias ni movimientos. `confirm_sale` solo confirma servicios de cita y `cancel_sale` no afecta stock. `SalesService` y las páginas de ventas/productos respetan esa restricción. `payments` exige cita: no permite cobro de mostrador. No se inspeccionó el esquema remoto.

Fuentes: [reglas](../../business-rules.md), [modelo](../../../Pandas11.sql), [última validación](../actividad-4-registro-ventas/validation.md), [cronograma](../../matriz-seguimiento.md).

Se propone abordar 4.4–4.5 antes de completar caja 4.3 porque RN-20 impide confirmar artículos sin stock. Esto no cambia las semanas históricas del cronograma ni declara cerrado 4.2.

## Reglas aplicables y decisiones propuestas

RN-19 conserva cliente obligatorio, cita opcional y una venta activa por cita. RN-20 exige artículos por unidad y stock antes de confirmar productos. RN-21 conserva permisos OWNER/ADMIN y anulación con dinero solo OWNER, sin devolución automática. RN-12 conserva exactitud monetaria; RN-16–RN-18 y RN-02 permanecen en pagos de cita.

Las siguientes decisiones fueron aprobadas para esta entrega:

| ID propuesto | Política propuesta |
|---|---|
| INV-D01 | Un solo inventario del local, por producto y unidades enteras; sin variantes, lotes, caducidad ni ubicaciones. Productos existentes empiezan con saldo cero, sin inferir cantidades reales. |
| INV-D02 | OWNER/ADMIN consultan, registran carga inicial y reposiciones. Solo OWNER realiza ajustes manuales positivos/negativos; todos requieren motivo. No se permite saldo negativo. |
| INV-D03 | Borradores no reservan ni descuentan stock. Confirmar una venta descuenta todas sus unidades en la misma transacción; si falta cualquier artículo, no se confirma ni descuenta ninguno. Confirmación comercial no acredita pago. |
| INV-D04 | Anular borradores no afecta stock. Para ventas confirmadas con productos, solo OWNER anula y elige explícitamente entre reponer todas las unidades (mercadería conservada o devuelta apta para venta) o no reponer ninguna (mercadería no recuperada/no apta); el motivo registra la decisión. Sin opción predeterminada ni reposiciones/devoluciones parciales. No se devuelve dinero. |
| INV-D05 | Movimientos inmutables: carga inicial, entrada, ajuste, salida por venta y reposición por anulación; cantidades, saldo anterior/posterior, actor, fecha de servidor, motivo y referencias. Un error se corrige mediante otro movimiento, nunca editando el historial. |

INV-D04, aprobada, amplía explícitamente la restricción de RN-21 para anular ventas confirmadas con productos incluso sin dinero recibido. En ventas solo de servicios se mantiene la política actual. Un ajuste no se usa para volver a reponer una anulación ya registrada.

## Requisitos y aceptación

| ID | Criterio verificable | Trazabilidad |
|---|---|---|
| INV-01 | Consultar stock paginado por producto y búsqueda. Catálogo existente sin cantidades inferidas; primera carga identificada y no repetible para el mismo producto. Saldo igual a suma de movimientos. | RN-20; INV-D01, INV-D05 |
| INV-02 | Entrada/carga inicial con cantidad entera positiva y motivo; ajuste OWNER con delta entero no cero. Rechazar insuficiencia, desbordamiento, campos falsificados y cantidades fraccionarias. No se aceptan movimientos manuales sobre productos inactivos; permanecen consultables. | RN-20, RN-21; INV-D02 |
| INV-03 | Confirmación con productos activos, stock suficiente y versión vigente; salida única por línea, atomicidad e idempotencia. Dos ventas concurrentes no consumen la última unidad dos veces. Borradores y confirmaciones fallidas no alteran saldo. | RN-19, RN-20; INV-D03 |
| INV-04 | Anulación con versión y motivo; decisión explícita de reposición para productos confirmados. Historial conserva salida original y posible entrada compensatoria única, incluso si el producto está inactivo. Reintentos no duplican reposición; dinero permanece sin cambios. | RN-21; INV-D04, INV-D05 |
| INV-05 | Historial paginado por producto, tipo, fechas y venta; actor y fecha de servidor, referencia y saldos. Sin edición o borrado desde clientes autenticados. | RN-20, RN-21; INV-D05 |
| INV-06 | RLS y RPC exigen cuenta activa OWNER/ADMIN y permisos correspondientes; ajustes y anulación de productos confirmados requieren OWNER activo. STAFF/CLIENT/anon y roles personalizados con permiso delegado no acceden. Verificación en servidor tras bloqueos. | RN-21; INV-D02, INV-D04 |
| INV-07 | Integrar stock/historial/movimientos en productos y confirmación/anulación en ventas; preservar precios capturados. Mostrar que se registra salida comercial y no cobro. Mantener pagos de cita por referencia sin saldo combinado ficticio. | RN-12, RN-16–RN-20 |
| INV-08 | Errores recuperables, reintentos con UUID y contenido idénticos, conflictos exigen recarga; modales accesibles, móvil, oscuro y RTL. | INV-02–INV-07 |

## Fuera de esta entrega

Cobro de mostrador, caja, pasarelas, facturación, costos/valorización contable, descuentos/impuestos, mínimos/alertas 4.6, devoluciones parciales, múltiples locales, servicios libres, datos reales y despliegue remoto. Una venta de productos puede quedar confirmada comercialmente sin cobro registrado; la interfaz debe explicar que dicho cobro aún no está habilitado.

Las preguntas de adelantos online y transporte no condicionan este inventario. Las decisiones INV-D01–INV-D05 y el cambio de modelo del [plan](plan.md) fueron aprobados para iniciar esta entrega.

Trazabilidad confirmada: INV-D01 → RN-22, INV-D02 → RN-23, INV-D03 → RN-24, INV-D04 → RN-25, INV-D05 → RN-26. Estos IDs complementan los vínculos de INV-01–INV-08 de la tabla anterior.
