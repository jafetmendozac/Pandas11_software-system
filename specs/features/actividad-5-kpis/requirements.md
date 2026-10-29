# Actividad 5.1 — Consultas SQL para indicadores

Fecha: 2026-10-29 (America/Lima). Estado: decisiones y plan aprobados; implementación SQL local validada.

## Contexto y alcance

La [matriz de seguimiento](../../matriz-seguimiento.md) sitúa 5.1 como el primer punto funcional pendiente después del módulo comercial 4.1–4.6. `/panel` todavía muestra componentes con datos de demostración. Este punto prepara una consulta agregada segura; conectar tarjetas y gráficos corresponde a 5.2 y requiere su propio alcance.

Aplican RN-01 (zona `America/Lima`), RN-02 (medios manuales), RN-09 (cobro final de cita interna), RN-12 (importe decimal exacto), RN-16 (solo `PAID` verificado), RN-19 (la venta con cita no duplica cobros), RN-27 (cobros de productos separados) y RN-28/RN-29 (caja no sustituye el registro de pagos).

## Indicadores aprobados

Para el mes calendario solicitado en `America/Lima`, con inicio inclusivo y fin exclusivo:

| Indicador | Fórmula y fecha | Presentación |
|---|---|---|
| Cobros de servicios | `SUM(payments.amount)` con `status = PAID`, `type` BALANCE/DEPOSIT y `paid_at` en el mes | PEN decimal exacto |
| Cobros de productos | `SUM(sale_payments.amount)` con `status = PAID` y `paid_at` en el mes | PEN decimal exacto |
| Total cobrado | Suma de los dos indicadores anteriores | PEN decimal exacto |
| Citas completadas | `COUNT(appointments.id)` con `status = COMPLETED` y `starts_at` en el mes | Entero |

Los cobros se cuentan una vez en su tabla de origen, aun cuando una venta esté ligada a una cita. Los movimientos de caja no se suman de nuevo: incluyen asientos automáticos de esos pagos y los pagos históricos pueden no tener sesión. Ingresos/retiros manuales de caja, fondo inicial, ventas sin pago, pagos tipo REFUND, `PENDING`, `FAILED` y `REFUNDED` no forman parte del total cobrado. Una venta anulada con pago `PAID` conserva el dinero según RN-21/RN-27; su cobro sigue en la cifra hasta que exista una política de devolución aprobada. La cifra no representa utilidad ni facturación tributaria.

“Citas completadas” se agrupa por inicio **programado**, pues el modelo actual no registra fecha efectiva de finalización; el rótulo debe expresar esa diferencia. No se calculan aún servicios individuales atendidos, unidades de producto vendidas, rentabilidad, metas ni retención. Esos indicadores necesitan fechas/definiciones adicionales y pertenecen a 5.2 o 5.4.

## Requisitos verificables

| ID | Criterio de aceptación |
|---|---|
| KPI-01 | OWNER/ADMIN activos con permiso `analytics.read` consultan el mes; STAFF, CLIENT, anónimo, perfil inactivo y rol personalizado sin papel OWNER/ADMIN no obtienen cifras, aun si se les asigna el permiso. |
| KPI-02 | La API acepta solo un primer día de mes válido; calcula límites en `America/Lima`, usa `[inicio, fin)` y devuelve el mes consultado. |
| KPI-03 | Solo `PAID` con `paid_at` aporta cobros. Los importes se suman en `numeric` y se devuelven como texto decimal para evitar redondeo JavaScript. Un mes vacío devuelve ceros. |
| KPI-04 | El total es exactamente la suma de cobros de cita y productos. Una venta mixta, un asiento de caja o varios pagos parciales no duplican una misma recepción. |
| KPI-05 | Las citas se cuentan una vez por `id`; las canceladas, no asistidas y en curso no cuentan. La frontera de medianoche y fin de mes de Lima se respeta. |
| KPI-06 | La consulta es de solo lectura, sin datos personales ni desglose por cliente. No modifica estados, saldos ni movimientos. |

## Decisiones aprobadas

1. Confirmar que **“ingresos” significa cobros `PAID`** y que el total incluye servicios y productos, incluso pagos conservados de ventas anuladas.
2. Confirmar mes calendario de Lima y citas completadas por **inicio programado** como primer periodo del panel.
3. Confirmar acceso a cifras solo para OWNER/ADMIN activos con permiso específico.

El usuario confirmó que está en Trujillo y aprobó el [plan](plan.md) mediante «sí apruebo el plan». Las tres decisiones quedan confirmadas para 5.1; Trujillo utiliza `America/Lima` conforme a RN-01.
