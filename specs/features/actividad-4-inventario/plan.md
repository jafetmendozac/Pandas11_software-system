# Plan — Inventario y movimientos

Fecha: 2026-10-22. Estado: aprobado mediante «Añadelo entonces» con `$sdd-feature`; implementación y validación local completadas; ver validation.md.

## Cambio de modelo propuesto para revisión

Conservar `products`, `sales`, `sale_items` y `payments`. Añadir mediante migración incremental:

- `inventory_balances`: una fila por `products.id` (PK/FK), cantidad entera no negativa, indicador de carga inicial y versión. Inicializar productos existentes en cero; alta futura también queda en cero, sin entrada ficticia ni estimación de stock.
- `inventory_movements`: UUID, FK de producto, tipo, delta entero con signo, saldos anterior/posterior, motivo, actor FK a profiles, fecha del servidor, FK opcionales de venta/línea y UUID de solicitud con contenido canónico de reintento. Sin borrado en cascada que elimine historial. Para una salida o reposición de venta: referencia obligatoria y unicidad por línea/tipo.
- Trazabilidad explícita de disposición de mercancía en anulación de venta confirmada con productos (`RESTOCK`/`NO_RESTOCK`, actor/fecha y motivo); fuera de ese caso, no exigir disposición. Cambiar contrato de `cancel_sale` sin dejar una firma anterior que permita omitir esta política.

Los nombres son diseño propuesto, no tablas acreditadas. Mantener `Pandas11.sql`, migración, contratos TypeScript y documentación coherentes al implementar. No ejecutar el SQL raíz ni modificar migraciones ya aplicadas. Sin adopción remota ni reset.

## Secuencia técnica tras aprobación

1. Comprobar esquema, migraciones y RLS de la instancia local prevista antes de aplicar cambios; informar diferencias con el modelo. Conservar datos existentes. Registrar aprobación de INV-D01–INV-D05.
2. Crear tablas, restricciones y permisos `inventory.read`, `inventory.receive`, `inventory.adjust`; OWNER/ADMIN reciben lectura/entradas y solo OWNER ajustes. RLS por rol y permiso, RPC de escritura, sin DML directo authenticated y sin service_role en Angular. Saldos/historial sin acceso STAFF/CLIENT/anon.
3. Implementar RPC de carga inicial, entrada, ajuste y búsquedas paginadas. Validar payload cerrado, cantidades, motivos, identidad, productos y reintentos; impedir cambiar cantidad directamente desde el catálogo. Calcular saldos exclusivamente en PostgreSQL.
4. Extender confirmación/anulación de ventas. Mantener primero el mutex de agenda/ventas existente y después bloquear saldos por UUID de producto en orden estable; todas las operaciones de inventario respetan el mismo protocolo. Revalidar permisos después de esperar. Confirmación actualiza venta, saldo y movimientos en una transacción. Reintento de confirmación ya realizada devuelve el resultado sin nueva salida; conflicto real de versión obliga a recargar. Cancelación repetida con el mismo contenido no repone dos veces y no admite cambiar disposición después.
5. Revalidar cita completada, cliente y suma de snapshots de servicios sin exigir que el total mixto sea igual al total de cita: comparar el subtotal de servicios por separado. Validar artículos activos y saldo sin alterar precios capturados. Conservar política de pagos y resumen por referencia; ninguna operación de stock inserta/edita dinero.
6. Añadir servicio/modelos de inventario en `shared/services/` y extender las páginas existentes `productos` y `ventas`; sin reorganización de carpetas. Productos muestra stock, formulario de carga/entrada/ajuste según permiso e historial paginado. Ventas permite confirmar artículos con aviso de efecto sobre stock, y OWNER elige disposición al anular productos confirmados. No introducir cobro de mostrador ni botón que sugiera pagos de productos habilitados.
7. Ejecutar validación, documentar resultados y actualizar reglas aprobadas, matriz, anexo comercial, arquitectura y roadmap. RN-20 distinguirá nuevo alcance operativo de su restricción histórica. Sin dependencias nuevas, commits o pushes.

## Pruebas previstas

- SQL/RLS: saldo cero inicial, primera carga única, reconciliación saldo/historial, enteros y límites, motivo, actividad de productos, roles/permisos, DML directo denegado y movimientos inmutables.
- Ventas: borrador sin descuento, confirmación de mostrador/mixta, snapshots de servicios preservados, stock exacto, insuficiencia de un renglón revierte todos, dos ventas por la última unidad, ajuste concurrente, reintentos y versiones. Cancelar borrador sin efecto; confirmar/anular repetidamente sin duplicados; ambas disposiciones, producto inactivo y pagos conservados.
- API local: autenticación real de usuarios sintéticos, RPC por PostgREST, errores, paginación y concurrencia con conexiones independientes. Limpieza solo de fixtures propios; SQL con rollback cuando corresponda.
- Angular: permisos, cantidades, saldos mostrados, reintento, conflictos, decisión explícita al anular y manejo de respuestas antiguas. Tipos app/spec, suite disponible, build, lint SQL y `git diff --check`.
- Chrome local: carga/entrada/ajuste OWNER, entrada ADMIN, denegación de ajustes ADMIN y acceso STAFF/CLIENT; confirmar producto y anular con reposición, variante sin reposición, foco, escritorio/móvil, oscuro/RTL y recarga directa.

Registrar pruebas no ejecutables y resultados sin convertirlos en aprobación. La entrega concluye el alcance INV-01–INV-08, no caja, alertas ni cobro de mostrador. Ver [validación](validation.md).


## Concreción de implementación

Preflight: diez migraciones previas aplicadas en la instancia local; products/sales/sale_items con RLS y sin entidades de inventario. Se aplica `20261022140000_inventory_movements.sql` sin reset. Una segunda migración `20261022143000_inventory_permission_recheck.sql` revalida permisos tras posibles esperas por actualizaciones del catálogo, conservando intacta la primera migración ya aplicada. Cambios solo locales.

La disposición usa `sales.inventory_disposition`; cancelled_by/at/reason conservan actor, fecha y motivo. Se elimina la firma SQL anterior de cancel_sale y la firma nueva admite argumento opcional NULL únicamente para casos sin productos confirmados; llamar con tres argumentos no evita la validación de disposición. Resumen de venta añade capacidad OWNER calculada por servidor para mostrar la anulación correspondiente. La carga inicial no puede introducirse después de otra entrada/ajuste: esos ingresos usan reposición y conservan historial.
