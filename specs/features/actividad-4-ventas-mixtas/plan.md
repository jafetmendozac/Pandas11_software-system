# Plan técnico — Actividad 4.1

Fecha: 2026-10-21. Estado: **alcance aceptado mediante «Vamos con eso»; implementación local validada; ver validation.md**.

## Secuencia aprobada

1. Aplicar las [decisiones comerciales aceptadas](requirements.md#decisiones-que-condicionan-el-plan): artículos por unidad solo en borradores, ventas con cita o de mostrador, sin impuestos/descuentos automáticos.
2. Comparar `Pandas11.sql` con migraciones y esquema **local** antes de tocar datos. Crear migración incremental para cabecera/detalle de venta y, si se acuerda un catálogo simple, productos. Añadir restricciones de FK, unicidad, montos, estados y trazabilidad; RLS de lectura y escrituras por RPC. No ejecutar el SQL raíz sobre la base existente.
3. Implementar operaciones de servidor para crear/consultar/anular según permisos, con idempotencia y cálculos `numeric`. Vincular la cita sin copiar ni volver a insertar sus pagos. Las reglas de bloqueo y saldo compartidas con pagos se definirán explícitamente antes de confirmar ventas o abrir cobros de mostrador.
4. Añadir contratos TypeScript y servicio Angular para la futura página de 4.2; no publicar una pantalla que sugiera cobro de mostrador operativo antes de conectar sus pagos. Actualizar `Pandas11.sql`, migraciones, especificaciones y matriz con el alcance realmente entregado.
5. Validar en Supabase local con datos sintéticos: FK, límites monetarios, RLS por rol, idempotencia, concurrencia, venta ligada a cita ya cobrada y anulaciones. Ejecutar pruebas Angular pertinentes y build si se modifica código Angular. Registrar resultados en [validation.md](validation.md).

## Impacto en el modelo

| Elemento | Cambio local aprobado |
|---|---|
| Nuevas entidades de venta | Cabecera y detalle con FK a cliente; FK opcional a cita si D4-01 la autoriza. Identificadores y estados propios; instantáneas de línea para preservar el precio histórico. |
| Catálogo de artículos | Entidad mínima solo si D4-02 define unidad y venta previa a inventario. Las existencias y movimientos pertenecen a 4.4–4.5; no inventar columnas de stock operativas aquí. |
| `appointments` y `payments` | Mantener los cobros de cita existentes y su verificación OWNER. Una venta vinculada no duplica filas `payments`; 4.2 deberá definir el cobro de ventas sin cita y el saldo combinado. |
| `billing_documents` | Sin migración ni emisión en 4.1. Su relación futura con ventas requiere una decisión tributaria separada. |

Concreción aprobada: `products` contiene catálogo simple sin existencias; `sales` guarda cliente, cita opcional, estado DRAFT/CONFIRMED/CANCELLED, total calculado, versión y trazabilidad; `sale_items` guarda instantáneas de servicio de cita o producto con precio exacto. El servidor importa las líneas de servicio de una cita completada y puede añadir productos. Las ventas de mostrador son borradores de productos. Solo se confirma una venta de servicios sin artículos, vinculada a cita completada; los cobros existentes siguen en `payments` y se muestran por referencia, sin duplicación. Una anulación con pago confirmado exige OWNER y deja resolución pendiente.

La implementación local quedó en tres migraciones incrementales: creación de entidades/RPC, consulta paginada de artículos con precio decimal en texto y refuerzo de RLS/RPC para exigir rol activo OWNER/ADMIN aun si un permiso se delega a otro rol. No se modificaron migraciones anteriores.

No se asume que el SQL local represente producción; no habrá despliegue remoto, dependencias nuevas ni cambios en otros proyectos.

## Condición para iniciar implementación

Las decisiones de alcance fueron aceptadas por el usuario mediante «Vamos con eso». La ejecución se limita al esquema y API local de 4.1 descritos arriba. La pantalla y el cobro de mostrador siguen en 4.2; confirmar productos y descontar stock requiere 4.4.
