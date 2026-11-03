# Actividad 4.2, 4.3 y 4.6 — Cobros comerciales, caja básica y mínimos

Fecha: 2026-10-22 (America/Lima). Estado: COM-D01–COM-D05 aprobadas mediante «Vamos con eso»; implementación local en validación.

## Contexto comprobado

Inventario 4.4–4.5 y ventas se validaron localmente. Una venta confirmada descuenta artículos, pero no acredita dinero. `payments.appointment_id` es obligatorio; las RPC existentes solo cobran citas internas completadas. `sales` puede vincular una cita o representar mostrador; sus líneas `SERVICE` se originan en la cita y `PRODUCT` en el catálogo. No hay entidades de caja ni umbrales mínimos en `Pandas11.sql` o en las migraciones actuales. No se ha inspeccionado la base remota. El diagnóstico inicial de `specs/actividad-4-modulo-comercial.md` es histórico; prevalecen su actualización final, la matriz y las validaciones recientes.

Reglas vigentes al preparar el plan: RN-02 (cinco medios manuales), RN-09 (cobro final de cita interna), RN-12 (PEN exacto), RN-16–RN-18 (registro OWNER/ADMIN, verificación OWNER y referencias), RN-19 (venta con o sin cita), RN-21 (anulación conserva dinero), RN-22–RN-26 (inventario y disposición). Las decisiones nuevas siguientes se aprobaron después y se registraron como RN-27–RN-30.

## Decisiones aprobadas

| ID | Política aprobada |
|---|---|
| COM-D01 | Mantener `payments` para la cita. Registrar cobros de productos en una entidad distinta `sale_payments`, vinculada a `sales`; en venta mixta, el techo cobrable por este canal es solo el subtotal de productos. El subtotal de servicios continúa en la cita. Mostrar ambos saldos separados y el total comercial como información, sin duplicar pagos. |
| COM-D02 | OWNER/ADMIN registran cobros de productos PENDING con YAPE, PLIN, CASH, CARD o TRANSFER; solo OWNER verifica o rechaza, incluido efectivo. Referencias opcionales de hasta 120 caracteres. No hay pasarela ni archivos. Los cobros PAID son inmutables y no se devuelven automáticamente. |
| COM-D03 | Una sola caja abierta para el local. OWNER/ADMIN pueden abrir y cerrar; ambos consultan. Toda verificación nueva de un cobro de cita o producto requiere caja abierta y genera una entrada única, separada por medio. Cobros históricos PAID anteriores a esta migración quedan fuera de sesiones y se muestran como históricos sin asignación; no se fabrican movimientos. |
| COM-D04 | La caja registra fondo inicial en efectivo, entradas automáticas y movimientos manuales de efectivo (ingreso/retiro) con motivo. Solo OWNER registra movimientos manuales; un retiro no puede exceder el efectivo esperado. Al cerrar, se ingresa el efectivo contado; se conserva diferencia contra efectivo esperado y un resumen por medio, sin alterar pagos. Cierre irreversible; correcciones en una nueva sesión. |
| COM-D05 | Cada producto puede tener `minimum_stock` entero no negativo o NULL para desactivar alerta. Alertar cuando stock ≤ mínimo, incluido cero; mostrar solo en `/productos` con filtro/contador. Es informativo: no bloquea ventas ni envía mensajes. OWNER/ADMIN configuran el umbral bajo `products.manage`; STAFF/CLIENT no consultan el inventario. |

Estas propuestas y el cambio de modelo de `plan.md` fueron aprobados mediante «Vamos con eso». Trazabilidad confirmada: COM-D01/02 → RN-27, COM-D03 → RN-28, COM-D04 → RN-29, COM-D05 → RN-30.

## Requisitos y criterios de aceptación

| ID | Criterio verificable | Trazabilidad |
|---|---|---|
| COM-01 | Venta de mostrador confirmada admite registrar y verificar cobros hasta el subtotal de productos. Venta mixta muestra subtotal de cita, subtotal de productos, cobrado confirmado y pendiente por cada origen. Un pago de cita no reduce el saldo de productos ni se inserta otra vez. | RN-12, RN-19; COM-D01 |
| COM-02 | Solo OWNER/ADMIN activos registran cobros de productos; solo OWNER activo verifica/rechaza. PENDING no reduce saldo; PAID sí. Reintento con UUID/contenido iguales no duplica. Versiones, sobrecobro, venta no confirmada y acceso STAFF/CLIENT/anon se rechazan en servidor. | RN-02, RN-16–RN-18, RN-21; COM-D02 |
| COM-03 | Anular una venta con cobro de producto PAID conserva ese dinero, exige OWNER y marca resolución pendiente; se mantiene la disposición explícita de inventario. No hay devolución implícita ni reutilización del cobro en otra venta. | RN-21, RN-25; COM-D02 |
| COM-04 | Una sola sesión OPEN; apertura con fondo en PEN exacto no negativo, actor/fecha de servidor. Verificar pagos nuevos sin sesión OPEN se rechaza. Cada transición PENDING→PAID genera exactamente un ingreso en la sesión y método correspondientes. | RN-12, RN-16; COM-D03 |
| COM-05 | Ingresos/retiros manuales de efectivo requieren OWNER, importe positivo y motivo; un retiro no deja efectivo esperado negativo. El cierre conserva esperado, contado, diferencia y totales por método; no cambia pagos ni stock. Reintentos/concurrencia no duplican entradas ni permiten cerrar dos veces. | RN-12, RN-21; COM-D04 |
| COM-06 | Umbral NULL desactiva alerta; entero ≥0 la activa cuando `quantity <= minimum_stock`. Se actualiza desde catálogo con permiso; listados/filtros reflejan entradas, salidas, ajustes y anulaciones sin crear alertas persistentes duplicadas. | RN-22–RN-26; COM-D05 |
| COM-07 | UI en español de ventas, pagos, caja y productos: separar claramente confirmado/pendiente; indicar diferencia de cierre y resolución de ventas anuladas. Formularios accesibles, móvil, oscuro y RTL; errores/reintentos recuperables. | COM-01–COM-06 |

## Fuera de alcance

Facturas/boletas, impuestos/descuentos, pasarela, devolución de dinero, conciliación bancaria, múltiples cajas/locales/monedas, arqueo por denominación, gastos contables, notificaciones por correo/WhatsApp/push y mínimos por variante. La caja registra flujos operativos; no acredita depósitos bancarios ni contabilidad formal. No se migra ni despliega una base remota en esta entrega.
