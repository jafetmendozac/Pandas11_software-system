# Actividad 4.1 — Modelo y lógica de venta mixta

Fecha: 2026-10-21 (America/Lima). Estado: **decisiones de alcance aceptadas mediante «Vamos con eso»; implementación local en curso**.

## Objetivo y alcance

Establecer el contrato de una venta interna con renglones de servicios y artículos, y su relación con citas y cobros. La Actividad 4.1 cubre el modelo, autorización y operaciones de servidor; la pantalla de registro y los cobros de ventas se abordarán en 4.2. Caja (4.3), existencias y movimientos (4.4–4.5), alertas (4.6) y documentos tributarios requieren sus propios planes.

Fuentes: [anexo comercial](../../actividad-4-modulo-comercial.md), [reglas de negocio](../../business-rules.md), [modelo local](../../../Pandas11.sql), [pagos de citas](../fase-5-pagos-adelantos/requirements.md) y migraciones locales. `Pandas11.sql` es referencia, no prueba del esquema remoto.

## Estado comprobado y reglas aplicables

- Las migraciones y Angular registran citas con servicios y cobros vinculados a `appointments.id`. No registran una venta mixta ni artículos de catálogo.
- `Pandas11.sql` contiene `payments` y tablas previstas de documentos de facturación, pero no `sales`, productos, stock ni caja. Las tablas de documentos no tienen migración operativa identificada.
- **RN-02:** cinco medios existentes para los cobros de citas; su reutilización en ventas requiere el diseño 4.2.
- **RN-09/RN-18:** la cita interna se cobra al finalizar; crear una venta no puede convertir un adelanto interno en válido.
- **RN-12:** precio en PEN con dos decimales como máximo; la cotización de servicios de cita es una captura y debe conservarse.
- **RN-16/RN-17:** OWNER/ADMIN registran cobros y OWNER verifica; el permiso de crear ventas no implica verificar dinero ni adjuntar comprobantes.
- **RN-08/PN-07:** adelantos online y devoluciones no están resueltos para este alcance.

## Requisitos aceptados para 4.1

| ID | Requisito y criterio de aceptación verificable | Reglas |
|---|---|---|
| V4-01 | Una venta conserva cabecera, cliente, moneda PEN, estado y líneas con tipo servicio/artículo, descripción, unidad, cantidad, precio unitario e importe capturados al registrar. La suma exacta de líneas coincide con el total; cero líneas no puede confirmarse. | RN-12 |
| V4-02 | Una venta vinculada a cita referencia una cita existente y conserva el importe de servicios pactado sin recalcular silenciosamente sus snapshots. Los cobros `PAID` de la cita se cuentan una sola vez en cualquier resumen combinado; `PENDING` no se trata como recibido. | RN-09, RN-12, RN-16, RN-18 |
| V4-03 | El servidor valida montos finitos y escala monetaria, cantidades positivas, referencias vigentes, transiciones de estado y simultaneidad. Un reintento no duplica venta ni líneas. | RN-12 |
| V4-04 | Solo usuarios autorizados pueden leer o modificar ventas. RLS protege tablas y las escrituras no aceptan actor, total, estado final ni fechas falsificadas desde Angular. STAFF/CLIENT/anon no ven importes comerciales internos sin autorización expresa. | RN-16, RN-21 |
| V4-05 | Una anulación conserva venta, líneas, actor y motivo; no borra pagos existentes ni supone una devolución. Si hay dinero confirmado, muestra resolución pendiente y evita una reversión implícita. | PN-07, RN-16, RN-21 |
| V4-06 | Una venta y un documento tributario son entidades distintas. Esta entrega no emite boletas/facturas ni afirma validez tributaria. Tampoco descuenta stock antes de aprobar la política de inventario. | RN-20 |

Los criterios V4-01–V4-06 se aplican al alcance acotado aceptado para 4.1. La venta mixta con productos confirmados y cobrados corresponde a fases posteriores.

## Decisiones que condicionan el plan

| ID | Decisión necesaria | Propuesta para evaluar |
|---|---|---|
| D4-01 | ¿Se permiten ventas de mostrador sin cita y ventas ligadas a cita? ¿Puede haber más de una venta por cita? | Ambas modalidades; una venta activa por cita para evitar doble facturación del servicio. |
| D4-02 | ¿Qué artículos se venderán y en qué unidad/presentación? ¿Se permite venderlos antes de tener inventario operativo? | Catálogo simple por unidad en 4.1; prohibir confirmar ventas con artículos hasta que 4.4 tenga stock, salvo aprobación expresa de venta sin control de existencias. |
| D4-03 | ¿Se aplican descuentos, impuestos o precios libres? ¿Quién los autoriza? | Mantener precio capturado sin descuentos/impuestos automáticos hasta acordar sus reglas; no inferir tributación desde `billing_documents`. |
| D4-04 | ¿Quién crea, consulta y anula ventas? ¿Qué ocurre al anular si ya hay un pago? | OWNER/ADMIN gestionan; OWNER decide anulaciones con dinero confirmado; no generar devolución automática. |
| D4-05 | ¿Cómo se usa el pago de cita al emitir una venta vinculada? | Reutilizar el cobro existente por referencia, sin crear otra fila de dinero; diseñar la asignación completa en 4.2. |

El usuario respondió «Vamos con eso» a la propuesta anterior. Para esta implementación se adoptan las propuestas D4-01–D4-05: venta con o sin cita, una venta activa por cita, artículo por unidad y solo borrador hasta contar con stock, sin descuentos/impuestos automáticos, OWNER/ADMIN gestionan y OWNER decide anulaciones con cobro confirmado. Una venta de mostrador de esta etapa solo contiene artículos: un servicio sin cita carece de mascota y tarifa resuelta según RN-12. Si el usuario precisa otra política, habrá que ajustar requisitos y plan antes de ampliar el comportamiento.
