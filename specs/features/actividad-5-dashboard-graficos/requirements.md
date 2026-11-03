# Actividad 5.2 — Gráficos del panel

Fecha: 2026-10-29 (America/Lima). Estado: **aprobado e implementado localmente**. El usuario aprobó el plan mediante «Vamos con eso» y pidió continuar. Evidencia: [validación](validation.md).

## Contexto

El punto 5.1 dejó `dashboard_kpis(p_month date)` aplicado y validado en Supabase local. Antes de 5.2, la ruta `/panel` montaba seis componentes de plantilla con cifras, metas, países, pedidos y series inventados. El punto 5.2 sustituye esa presentación por indicadores reales de cobros, servicios y productos. Las reglas RN-01, RN-12, RN-14, RN-19, RN-21, RN-24–RN-27 y RN-32–RN-36 afectan fechas, conteos, cancelaciones, precisión y permisos; RN-34–RN-36 documentan las definiciones aprobadas en este plan.

## Definiciones aprobadas

- **Periodo elegido:** un mes calendario de `America/Lima`, por defecto el mes actual en Trujillo. Se podrá elegir un mes anterior; los gráficos y tarjetas usarán el mismo periodo. La serie de cobros mostrará los 12 meses terminados en el mes elegido, con meses vacíos en cero.
- **Cobros por mes:** dos series en PEN, servicios desde `payments` `PAID` tipo BALANCE/DEPOSIT y productos desde `sale_payments` `PAID`, ambas por `paid_at`. Su suma para el mes elegido coincidirá con RN-32 y la RPC 5.1. Los movimientos de caja no se suman. Un cobro `PAID` de venta anulada sigue visible mientras el dinero permanezca conservado.
- **Servicios realizados:** número de `appointment_items` asociados a citas `COMPLETED` cuyo `starts_at` programado cae en el mes elegido. Cada item (servicio a una mascota) cuenta una vez; las etapas BATH/CUT no duplican el servicio. Agrupar por `service_id` y mostrar el nombre actual del catálogo, incluido un servicio hoy inactivo. La cita completada es la señal disponible de realización; no existe estado de ejecución por etapa.
- **Productos vendidos:** unidades descontadas por movimientos `inventory_movements.kind = SALE` creados en el mes elegido, cuya venta conserva estado `CONFIRMED`. Agrupar por producto y mostrar el nombre actual del catálogo. Una venta anulada sale del gráfico, incluso con disposición NO_RESTOCK; por eso el gráfico refleja **ventas confirmadas vigentes**, no salidas físicas netas ni dinero cobrado. La fecha procede del movimiento de confirmación porque `sales` no guarda `confirmed_at`.
- **Ranking:** mostrar los cinco servicios y cinco productos con mayor cantidad, ordenados por cantidad descendente e ID para empates, con el título «5 más frecuentes». No se presentará el ranking como total de todos los servicios/productos.

## Requisitos verificables

| ID | Criterio de aceptación |
|---|---|
| DG-01 | OWNER/ADMIN activos con `analytics.read` consultan gráficos agregados. STAFF conserva acceso a `/panel` sin cifras financieras ni datos de plantilla; CLIENT/anon no entran al panel. Un permiso delegado a un rol personalizado no expone la RPC. |
| DG-02 | Tarjetas del mes elegido muestran las cuatro cifras exactas de 5.1 con rótulos españoles: cobros de servicios, cobros de productos, total cobrado y citas completadas por inicio programado. Importes visibles en PEN sin perder centavos. |
| DG-03 | Gráfico de 12 meses muestra dos series separadas de cobros confirmados, con meses vacíos en cero. El mes elegido coincide con las tarjetas, incluso en fronteras de año y medianoche Lima. No hay doble conteo en ventas mixtas o caja. |
| DG-04 | Ranking de servicios cuenta items de citas completadas una vez por mascota/servicio, sin multiplicar por trabajadores o etapas. Citas canceladas/no asistidas no cuentan. |
| DG-05 | Ranking de productos cuenta unidades de ventas aún CONFIRMED a partir de salidas de inventario por venta. Borradores y ventas anuladas no cuentan; el cobro no define las unidades. |
| DG-06 | La página no renderiza cifras/países/pedidos/metas de demostración. Muestra carga, mes sin datos, error recuperable y reintento; conserva acceso operativo para STAFF. |
| DG-07 | Gráficos tienen título, unidad, leyenda y equivalente textual; controles de mes y reintento accesibles con teclado. La página se adapta a móvil y modo oscuro. |

## Alcance aprobado

La aprobación del [plan](plan.md) confirmó las definiciones de «servicio realizado», «producto vendido» y ranking, además de sustituir el contenido de demostración de `/panel`. No implica metas, rentabilidad, retención, facturación, recordatorios ni despliegue remoto.
