# Plan — Actividad 5.2, dashboard de cobros, servicios y productos

Fecha: 2026-10-29 (America/Lima). Estado: **aprobado e implementado localmente**. Requisitos: [requirements.md](requirements.md). Evidencia: [validation.md](validation.md).

## Diagnóstico y modelo

`Pandas11.sql` define las tablas operativas `appointments`, `appointment_items`, `services`, `payments`, `sales`, `sale_items`, `products`, `inventory_movements` y `sale_payments`. Las migraciones locales implementan estas tablas y 5.1 añadió `dashboard_kpis(date)`, `analytics.read` y su validación SQL. El SQL raíz es referencia, no prueba del esquema remoto. El panel Angular actual usa componentes TailAdmin con cifras fijas; `AuthorizationService` ya dispone de permisos y rol seleccionado. La ruta `/panel` usa `panel.access` y debe seguir disponible para STAFF.

No se necesitan tablas ni columnas nuevas en `Pandas11.sql`. Sí se necesita una migración incremental para una RPC agregada de series/rankings, porque `dashboard_kpis` solo devuelve un mes y no sirve para construir gráficos sin múltiples consultas. La ampliación no modifica la RPC 5.1 ni inventa fechas de finalización de cita o confirmación de venta.

## Cambios exactos propuestos

1. **SQL local:** añadir `public.dashboard_analytics(p_month date)` en una migración posterior a 5.1. Validar primer día de mes y rol OWNER/ADMIN activo + `analytics.read`, usando `SECURITY DEFINER`, `search_path` vacío, `REVOKE` a `PUBLIC`/`anon` y `GRANT` solo a `authenticated`. Devolver JSON agregado con 12 meses de cobros separados y los dos rankings del mes elegido. Calcular periodos `[inicio, fin)` en `America/Lima`, sumar importes en `numeric` y enviarlos como texto decimal. Usar `dashboard_kpis` para las cuatro tarjetas sin cambiar su contrato.
2. **Pruebas SQL:** añadir `supabase/tests/database/dashboard_analytics.test.sql` con usuarios/fechas/productos sintéticos y `ROLLBACK`. Comprobar acceso por rol/perfil, meses vacíos, límite de diciembre/enero, venta mixta sin duplicados, citas con varios items/etapas, venta anulada con y sin RESTOCK, empates del ranking y ausencia de datos personales.
3. **Angular:** crear `DashboardAnalyticsService` y modelos tipados en `src/app/shared/services/` para las dos RPC. Sustituir solo la composición y plantilla de `EcommerceComponent` en `src/app/pages/dashboard/ecommerce/`; usar ApexCharts ya instalado para serie mensual y dos rankings, más listas/tablas textuales equivalentes. Las tarjetas usarán cadenas de importe exactas; los números convertidos para trazar no serán fuente de cálculo. Retirar del **renderizado** los componentes demo de clientes, pedidos, meta, países, estadísticas y órdenes recientes, sin borrar sus archivos ni rutas ajenas.
4. **Acceso y estados:** mostrar el panel analítico solo con rol seleccionado OWNER/ADMIN y permiso `analytics.read`; la RPC aplicará la autorización final. Para STAFF y otros roles con `panel.access`, mostrar un resumen operativo con enlaces ya permitidos, sin números inventados. Carga, error, reintento y ausencia de datos tendrán textos en español. Selector de mes hasta el mes actual de Lima; al cambiar rol o periodo, descartar respuestas antiguas.
5. **Documentación:** tras implementar, actualizar `business-rules.md` con las definiciones aprobadas, `architecture.md`, roadmap, matriz y `validation.md` con resultados comprobados. No editar diagnósticos históricos como si fueran evidencia actual.

## Validación y límites

- Preflight del estado Git, migraciones locales y permisos; informar discrepancias. Aplicar solo la migración de 5.2 en Supabase local, sin reset ni cambios remotos. No ejecutar `Pandas11.sql` completo.
- Ejecutar prueba SQL específica y suite SQL completa; pruebas Angular de autorización, periodo, carga/error/vacío y series. Compilar con `npm run build` y revisar regresiones.
- Recorrer `/panel` con cuentas sintéticas OWNER/ADMIN/STAFF en escritorio y móvil; revisar oscuro, teclado y valores contra la RPC. Si no hay navegador o entorno local, registrar el límite sin declarar aceptación visual.
- Sin nuevas dependencias, cuentas reales, claves secretas en Angular, commits, pushes ni despliegue remoto.

## Aprobación

El usuario aprobó este plan mediante «Vamos con eso» y pidió continuar. La implementación y su validación se registran en [validation.md](validation.md).
