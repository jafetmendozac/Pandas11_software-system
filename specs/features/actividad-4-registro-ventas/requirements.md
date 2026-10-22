# Actividad 4.2 — Registro visual de ventas, primera entrega

Fecha: 2026-10-22 (America/Lima). Estado: plan aprobado mediante «Bamos con la implementación» el 2026-10-22; implementación local.

## Contexto comprobado

La [validación de 4.1](../actividad-4-ventas-mixtas/validation.md) registra modelo, RPC, RLS y contratos Angular implementados localmente. `SalesService` ofrece catálogo, creación, consulta, confirmación y anulación; no existe página comercial. `Pandas11.sql` y las tres migraciones de ventas definen `products`, `sales` y `sale_items`; `payments.appointment_id` es obligatorio. No existen stock ni pagos de mostrador operativos. No se ha inspeccionado el esquema remoto.

Los encabezados de requisitos/plan de 4.1 todavía indican implementación en curso y su contexto describe el estado anterior. Para el estado entregado se usa su validación; al cerrar esta entrega se aclarará esa diferencia documental, sin alterar decisiones históricas.

## Alcance propuesto y aceptación

| ID | Requisito y criterio verificable | Reglas aplicables |
|---|---|---|
| RV-01 | OWNER/ADMIN con permisos correspondientes consultan `/ventas`, buscan y paginan; ven cliente, cita, estado, total, detalle y cobros confirmados de cita por referencia. STAFF/CLIENT/anon no acceden. Un permiso delegado a otro rol no habilita esta pantalla. | RN-19, RN-21 |
| RV-02 | Crear borrador con cliente existente, con o sin cita. La cita debe ser interna, completada y del mismo cliente; el servidor importa sus servicios y preserva sus importes. Selecciones paginadas, sin cargar todo el catálogo o clientes. Una cita no admite dos ventas activas. | RN-09, RN-12, RN-18, RN-19 |
| RV-03 | Seleccionar productos activos por unidad y cantidad entera positiva; mostrar precios e importes en PEN. El resultado persistido del servidor determina el total. Una venta de mostrador contiene productos y requiere cliente; no se crean servicios libres ni cliente anónimo. | RN-12, RN-19, RN-20 |
| RV-04 | Confirmar únicamente borradores de servicios ligados a cita completada. Mostrar que los borradores con productos esperan control de stock y no habilitar su confirmación. Confirmar venta no representa recibir dinero. | RN-19, RN-20 |
| RV-05 | Anular con motivo y versión vigente. Con cobro confirmado, solo OWNER; conservar pagos y mostrar resolución pendiente sin devolución automática. Conflicto de versión obliga a recargar antes de reintentar. | RN-21 |
| RV-06 | Catálogo en `/productos`: búsqueda, paginación, alta, edición y activación/desactivación con permisos de productos y rol OWNER/ADMIN. Nombre, SKU opcional y precio decimal según contrato existente; sin eliminación física ni campos de stock ficticios. | RN-12, RN-20, RN-21 |
| RV-07 | Desde una venta con cita, acceso a `/pagos?cita=…` solo con permiso de pagos. El cobro sigue perteneciendo a la cita; nunca se presenta como saldo combinado ni se vuelve a registrar automáticamente. | RN-02, RN-16, RN-17, RN-18, RN-19 |
| RV-08 | Formularios conservados ante error; doble envío bloqueado; reintento de la misma creación conserva UUID y contenido. Modales con foco controlado, móvil, oscuro y RTL; respuestas antiguas no sobrescriben selección actual. | RN-12, RN-19, RN-21 |

## Límites y decisiones posteriores

Esta propuesta cubre la primera entrega de 4.2, no su cierre completo: no incorpora cobro de mostrador, saldo mixto, inventario, caja, devoluciones, impuestos/descuentos, documentos tributarios ni despliegue remoto. No permite editar líneas de un borrador persistido: esa operación no existe en la API actual; se conserva la anulación con motivo y la creación explícita de otro borrador.

Para habilitar ventas de productos y cobros de mostrador se debe aprobar otro plan que resuelva stock inicial/entradas, descuento transaccional, insuficiencia de existencias, reversión por anulación y asignación de cobros entre servicios y productos sin duplicar pagos de cita. PN-05/PN-07 y la duración del recojo no condicionan esta interfaz porque no se amplían reservas, transporte ni devoluciones.

La aprobación solicitada comprende RV-01–RV-08 y el [plan](plan.md); no aprueba anticipadamente aquellas reglas pendientes.
