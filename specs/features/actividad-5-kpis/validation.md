# Validación — Actividad 5.1

Fecha: 2026-10-29 (America/Lima). Estado: **implementado y validado en Supabase local**.

## Evidencia disponible

| Criterio | Revisión realizada | Resultado |
|---|---|---|
| KPI-01 | La RPC exige `private.sales_operator()` y `analytics.read`; la migración concede el permiso a OWNER/ADMIN y revoca ejecución anónima. La prueba SQL incluye OWNER, ADMIN, STAFF, CLIENT, rol personalizado, anónimo y perfil inactivo. | Correcto. |
| KPI-02 | `p_month` debe ser primer día; los límites `[inicio, fin)` se convierten desde `America/Lima` a `timestamptz`. La prueba cubre fronteras de mes. | Correcto. |
| KPI-03 | Se suman solo pagos `PAID` tipo BALANCE/DEPOSIT por `paid_at` con `numeric`; el JSON entrega importes como texto. La prueba incluye un registro sintético tipo REFUND que no altera el total. | Correcto. |
| KPI-04 | Las sumas de `payments` y `sale_payments` son independientes; no se consulta `cash_movements`. La prueba crea venta vinculada a cita y un asiento de caja. | Correcto. |
| KPI-05 | `COUNT(*)` sobre `appointments` con `COMPLETED` y `starts_at`; prueba incluye NO_SHOW y fronteras Lima. | Correcto. |
| KPI-06 | Función `STABLE` de solo lectura, respuesta agregada sin datos de cliente. | Correcto en revisión y prueba de respuesta. |

Archivos: migración `20261029120000_dashboard_kpis.sql` y prueba `dashboard_kpis.test.sql`. `git diff --check` pasó. No se cambió Angular ni el modelo de tablas de `Pandas11.sql`.

## Comandos y resultados

- Preflight: el historial local tenía hasta `20261023135240`; la migración `20261028120000_user_role_context.sql` estaba sin aplicar y correspondía a cambios de autorización ajenos. Se verificó que las tablas fuente existían y que el periodo sintético 2097 estaba vacío.
- Prueba transaccional previa: migración + pgTAP en una misma transacción con `ROLLBACK`: **17/17** casos correctos. No dejó cambios.
- `supabase migration up --local` desde una copia temporal del catálogo que excluyó únicamente la migración de roles pendiente: aplicó **solo** `20261029120000_dashboard_kpis.sql` en Supabase local. No se hizo reset ni se tocó Supabase remoto.
- `supabase test db supabase/tests/database/dashboard_kpis.test.sql --local`: **17/17** correctas.
- `supabase test db --local`: **289/289** correctas en 10 archivos; no se observaron regresiones SQL.
- Consulta de cierre: versión `20261029120000` registrada, `dashboard_kpis(date)` presente y `analytics.read` asignado a ADMIN/OWNER. La migración `20261028120000` sigue pendiente.
- `git diff --check`: correcto. No corresponde build Angular, pues 5.1 no modifica Angular.

## Límites

El dashboard de `/panel` mantiene sus datos de plantilla; conectar indicadores y gráficos es 5.2. La migración de roles anterior sigue pendiente: deberá gestionarse explícitamente al retomar ese trabajo porque su versión es anterior a la de 5.1 ya aplicada. No se inspeccionó ni modificó Supabase remoto ni se probó con datos reales. La prueba usa datos sintéticos y transacciones que hacen `ROLLBACK`.
