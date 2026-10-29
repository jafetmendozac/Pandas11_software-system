# Validación — Actividad 5.2

Fecha: 2026-10-29 (America/Lima). Estado: **implementado y validado en entorno local**. El plan fue aprobado mediante «Vamos con eso» y el usuario pidió continuar. Requisitos: [requirements.md](requirements.md); plan: [plan.md](plan.md).

## Cambios comprobados

- La migración `20261029121000_dashboard_analytics.sql` se aplicó solo a Supabase local. `dashboard_analytics(date)` reutiliza `dashboard_kpis(date)`, calcula 12 meses y los dos rankings mediante SQL agregado. No añade tablas ni columnas, y no se ejecutó `Pandas11.sql` completo.
- La migración de contexto de roles `20261028120000_user_role_context.sql`, pendiente al cierre de 5.1, también se aplicó **localmente**. Ya estaba aprobada en el trabajo de selección de roles y `my_roles` es dependencia del panel. No se modificó esa migración.
- `/panel` usa `DashboardAnalyticsService` y ApexCharts existente. OWNER/ADMIN con `analytics.read` ven tarjetas, serie de cobros y rankings; STAFF ve enlaces según sus permisos. Los importes visibles conservan el texto decimal exacto; la conversión a número se usa solo para trazar.
- Las tablas/listas textuales complementan los gráficos. Hay estados de carga, error con reintento y mes sin actividad. El selector limita meses futuros según Lima; un cambio de rol o mes descarta respuestas antiguas.

| Criterio | Evidencia |
|---|---|
| DG-01 | Pruebas SQL de OWNER, ADMIN, STAFF, CLIENT, anon, usuario inactivo y rol personalizado con permiso delegado. Pruebas Angular de rol seleccionado y respuesta antigua. La RPC exige rol OWNER/ADMIN activo y `analytics.read`; `EXECUTE` solo para `authenticated`. |
| DG-02–DG-03 | Pruebas SQL comparan el mes elegido con 5.1 y cubren 12 meses, ceros, cruce de año y frontera horaria Lima; ventas mixtas y pagos de venta anulada sin duplicar caja. Pruebas Angular verifican el periodo enviado y el formato exacto de PEN. |
| DG-04–DG-05 | Pruebas SQL con varias mascotas/items, relevo BATH→CUT, servicio inactivo, `NO_SHOW`, ventas anuladas RESTOCK/NO_RESTOCK y desempate del ranking. Solo cuenta cada item o salida de inventario elegible una vez. |
| DG-06 | Pruebas del componente comprueban ausencia de widgets demo, estados de carga/error/reintento/vacío y enlaces operativos para STAFF. |
| DG-07 | La plantilla contiene títulos, unidades, leyenda, tablas/listas equivalentes, foco visible y clases responsivas/oscuras. La compilación de plantillas y las pruebas DOM pasan. **Revisión visual manual de escritorio/móvil, oscuro y teclado pendiente**; los tests sustituyen el gráfico ApexCharts por un componente falso y no certifican su dibujo real. |

## Ejecución

- Suite SQL local: **316/316 correctas** en 11 archivos, incluyendo **27 pruebas** de `dashboard_analytics.test.sql`. Los datos de prueba son sintéticos, se ejecutan dentro de transacciones con `ROLLBACK` y no usan cuentas reales.
- `npx ngc -p tsconfig.app.json --noEmit`: correcto.
- `npx tsc -p tsconfig.spec.json --noEmit`: correcto.
- Suite Angular en ChromeHeadless: **141/141 correctas**.
- `npm run build`: correcto. Se mantiene un aviso previo de presupuesto CSS en `src/app/pages/inicio/inicio.component.css` (exceso de 1,46 kB), ajeno a 5.2.
- `git diff --check`: correcto.

No se consultó ni modificó Supabase remoto, no se hizo despliegue ni se generó un commit. El estado local acredita consultas, autorización y renderizado de estados bajo pruebas, pero queda pendiente la inspección visual manual del gráfico real y la aceptación operativa con usuarios del negocio. 5.3 (recordatorios y lista por contactar) conserva su propio ciclo SDD.
