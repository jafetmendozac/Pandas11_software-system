# Actividad 4 — Módulo comercial

Fecha de corte original: 2026-10-20 (America/Lima). Actualización de 4.1: 2026-10-21. Anexo de seguimiento para los puntos 4.1–4.6 de la [matriz S1–S14](matriz-seguimiento.md). Describe el estado **local** comprobado; una pantalla de plantilla o una tabla del modelo de referencia no demuestra una operación comercial implementada ni desplegada.

## Distinción necesaria para el informe al corte original

| Concepto | Situación comprobada |
|---|---|
| **Cita** | La [agenda interna](features/fase-4-agenda-reservas-internas/validation.md) registra servicios, mascotas, trabajadores, precio total y estados. Su precio es una captura de la cotización, no una venta comercial de productos. |
| **Cobro de cita** | El [módulo de pagos](features/fase-5-pagos-adelantos/validation.md) registra importes pendientes y confirmados ligados a `appointments.id`. Admite Yape, Plin, efectivo, tarjeta y transferencia de forma manual; OWNER verifica la recepción. Puede haber pagos parciales y saldo. |
| **Venta** | No se identificó una entidad operativa de venta, detalle mixto de productos/servicios, descuentos o devoluciones comerciales en las migraciones y servicios revisados. Un pago confirmado acredita dinero recibido para una cita, no una venta mixta registrada. |
| **Documento de facturación** | `billing_documents` y `billing_document_items` figuran en el [modelo SQL local](../Pandas11.sql), pero no tienen migración operativa identificada. La ruta [`/invoice`](../src/app/app.routes.ts) muestra una [factura de demostración](../src/app/shared/components/invoice/invoice-main/invoice-main.component.html) con datos fijos de otra empresa; no acredita emisión de comprobantes. |
| **Caja** | No se identificó apertura, registro de movimientos de caja, arqueo ni cierre. La suma de pagos confirmados no equivale por sí sola a un cierre de caja. |
| **Inventario** | No se identificaron tablas ni servicios operativos de productos, existencias, movimientos o mínimos en el modelo y migraciones revisados. Las referencias comerciales de la portada y los componentes de ecommerce son presentación, no control de stock. |

## Estado por punto del cronograma al 2026-10-20

| Punto | Estado | Evidencia aprovechable | Trabajo pendiente para cumplir el punto |
|---|---|---|---|
| **4.1 Modelo y lógica de venta mixta** | **Pendiente** | Citas con servicios e importes; pagos por cita. El SQL de facturación es solo referencia. | Definir una venta con líneas de servicio y producto, cantidades, precios, impuestos/descuentos si aplican, estados, anulaciones y permisos. Acordar su relación con cita y cobro. |
| **4.2 Registro de venta y métodos de pago** | **Parcial** | Cinco métodos de **cobro manual de citas**, pagos parciales, estado `PENDING`/`PAID`/`FAILED`, verificación OWNER y saldo exacto. | Registrar ventas comerciales y asociarles cobros sin duplicar el dinero ya recibido en la cita. Definir si una venta puede existir sin cita. |
| **4.3 Cita → venta y cierre de caja básico** | **Parcial** | Relación `appointments` → `payments` y resumen de cobros; cita interna completada admite cobro final. | Crear el vínculo cita → venta, reglas de cierre y conciliación de pagos; definir apertura, movimientos, responsable, arqueo y cierre de caja. |
| **4.4 Inventario y stock automático** | **Pendiente** | Ningún stock operativo acreditado. | Definir productos, variantes/unidades, existencias iniciales, entradas y salidas; vincular descuentos de stock a ventas confirmadas de forma transaccional. |
| **4.5 Movimientos e historial de inventario** | **Pendiente** | Ningún kardex o registro de movimientos acreditado. | Definir tipos de movimiento, motivo, actor, referencia, correcciones y consulta histórica; evitar sobrescribir el saldo sin trazabilidad. |
| **4.6 Alertas de stock mínimo** | **Pendiente** | No hay productos ni stock sobre los que calcular mínimos. | Acordar umbral por producto/variante, modo de aviso, responsable y pruebas en los límites del mínimo. |

**Texto utilizable en el informe:** «La Actividad 4 se encuentra en desarrollo parcial. Existe un módulo local de cobros manuales vinculados a citas, con cinco métodos de pago y verificación por el propietario. La venta mixta de servicios y productos, el cierre de caja y el inventario aún no están implementados; su diseño requiere definir el modelo comercial y las reglas de operación».

## Evidencia y reglas relacionadas

La [migración de pagos](../supabase/migrations/20261018225928_payments_advances.sql), las [consultas complementarias](../supabase/migrations/20261018230255_payments_queries.sql), [PaymentsService](../src/app/shared/services/payments.service.ts), la [página de pagos](../src/app/pages/pagos/pagos.component.ts) y la [validación Fase 5](features/fase-5-pagos-adelantos/validation.md) sustentan lo realizado. La validación histórica registra 137/137 pruebas SQL acumuladas, 107 comprobaciones API específicas de pagos y 90/90 pruebas Angular acumuladas; también registra un recorrido visual local. Estos resultados prueban el alcance de **pagos de citas**, no ventas ni inventario. Este anexo no los ejecutó de nuevo.

Las [reglas RN-02, RN-09, RN-12 y RN-16 a RN-18](business-rules.md) sustentan medios de pago, cobro final interno, exactitud monetaria y verificación OWNER. RN-08 conserva el adelanto de autorreserva como alcance separado; los pagos actuales no acreditan reservas online. No hay reglas de negocio aprobadas para venta mixta, caja, unidades de inventario, movimientos, mínimos ni emisión tributaria. Por ello, las decisiones sugeridas en esta sección son **preguntas de diseño**, no reglas confirmadas.

## Decisiones necesarias antes de implementar

1. **Venta:** qué productos y servicios se venden juntos, quién crea/anula, si la venta nace de una cita o también de mostrador, y cómo se representa un pago parcial sin duplicar `payments`.
2. **Precios y documentos:** moneda, descuentos/impuestos aplicables y diferencia entre registro interno de venta y comprobante tributario. La presencia de `billing_documents` en el SQL no define por sí sola el flujo legal ni técnico.
3. **Caja:** si habrá una caja por local o turno, quién abre/cierra, cómo se registran efectivo y medios digitales, ajustes y diferencias de arqueo.
4. **Inventario:** catálogo y unidades de artículos, variantes, carga inicial, momento exacto del descuento por venta, devoluciones, correcciones y política ante stock insuficiente.
5. **Alertas:** mínimo por artículo o variante, destinatario, canal y si solo informa o bloquea ventas.

La secuencia técnica razonable es acordar primero **venta y su relación con cobros**, después **movimientos y descuento de stock**, y finalmente **caja y alertas** según sus dependencias. Cada nueva funcionalidad debe pasar por requisitos, plan SDD aprobado, implementación y validación. Este anexo no constituye ese plan ni autoriza cambios de esquema o despliegue.

El trabajo SDD de 4.1 está en [requisitos](features/actividad-4-ventas-mixtas/requirements.md), [plan](features/actividad-4-ventas-mixtas/plan.md) y [validación](features/actividad-4-ventas-mixtas/validation.md). El estado actualizado se registra en la matriz.

**Actualización 2026-10-21:** el usuario aceptó la propuesta mediante «Vamos con eso». Las migraciones locales de 4.1 crean catálogo simple, ventas y detalle; una cita completada aporta sus servicios, las ventas pueden incluir artículos solo como borrador y los cobros de cita se consultan sin duplicarlos. Hay API, RLS, pruebas y contrato Angular, pero aún no pantalla de ventas, cobro de mostrador, stock ni emisión de comprobantes. Ver [validación de 4.1](features/actividad-4-ventas-mixtas/validation.md). Los párrafos de diagnóstico anteriores describen el estado **antes** de esta actualización.

## Evidencia pendiente para cierre formal

Para 4.1–4.6 harán falta especificaciones aprobadas, migraciones y código correspondientes, pruebas con datos sintéticos, recorridos de aceptación y resultados fechados. La verificación de un esquema Supabase remoto no se realizó. No se modificó código, base de datos ni funcionalidad al preparar este anexo.
