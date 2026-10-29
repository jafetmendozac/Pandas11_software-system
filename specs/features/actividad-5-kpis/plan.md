# Plan — Actividad 5.1, consultas SQL de indicadores

Fecha: 2026-10-29 (America/Lima). Estado: **aprobado e implementado localmente** mediante «sí apruebo el plan». Requisitos: [requirements.md](requirements.md). Evidencia: [validation.md](validation.md).

## Diagnóstico y modelo

`Pandas11.sql` y las migraciones locales contienen `appointments`, `payments`, `sales`, `sale_items`, `sale_payments` y `cash_movements`. Las fuentes necesarias son `payments.paid_at/amount/status`, `sale_payments.paid_at/amount/status` y `appointments.starts_at/status`. `cash_movements` registra entradas derivadas de pagos y movimientos manuales; sumarlo con pagos duplicaría ingresos. `Pandas11.sql` es referencia local, no prueba del esquema remoto. La Actividad 4 se validó en Supabase local; no hay adopción remota acreditada.

El dashboard Angular en `src/app/pages/dashboard/ecommerce/` sigue siendo de plantilla. 5.1 entrega el contrato SQL probado; la sustitución de tarjetas y gráficos queda para 5.2. No se necesitan tablas/columnas nuevas ni modificar `Pandas11.sql`; sí una migración incremental para permiso, función y concesiones.

Hay cambios de autorización sin confirmar en el árbol de trabajo (`authorization.service`, layout y una migración de contexto de rol). Antes de implementar, revisar su estado y evitar sobreescribirlos. El plan 5.1 no los modifica.

## Implementación propuesta

1. Revisar el estado Git y la instancia Supabase **local**. Confirmar que están aplicadas las migraciones de pagos/caja y que las políticas/funciones vigentes coinciden con el modelo. Si hay discrepancias, documentarlas antes de cambiar SQL. No ejecutar el archivo raíz ni un reset de una base con datos del usuario.
2. Crear una migración nueva posterior a las existentes con permiso `analytics.read` asignado a OWNER/ADMIN. Añadir `public.dashboard_kpis(p_month date)` como RPC de solo lectura. Validar que `p_month` sea el primer día; calcular los límites UTC de ese mes desde `America/Lima`. Usar agregados independientes por tabla y combinarlos, sin joins multiplicadores. Devolver JSON con mes, cuatro indicadores y montos en texto decimal.
3. Proteger la RPC en servidor: perfil activo, rol OWNER/ADMIN activo y permiso `analytics.read`; revocar ejecución a `PUBLIC`/`anon` y conceder solo a `authenticated`. Usar `SECURITY DEFINER` con `search_path` vacío y nombres calificados, conforme a las RPC existentes. La consulta no entrega filas ni nombres de clientes.
4. Añadir pruebas SQL con datos sintéticos en transacción para roles, mes vacío, límites Lima, pagos `PENDING`/`PAID`/`FAILED`, pagos parciales, venta mixta con cobro de cita y producto, venta anulada con cobro conservado y asientos de caja. Comparar totales exactos y confirmar que la consulta no escribe datos.
5. Actualizar `validation.md`, la matriz/roadmap y arquitectura con resultados observados. Registrar decisiones aprobadas en `business-rules.md` solo después de la aprobación. No desplegar ni conectar todavía componentes del dashboard.

## Comprobaciones y límites

Ejecutar `supabase test db` en entorno local reproducible y revisar la migración/RLS/GRANT. Si la instancia local no está accesible, registrar el bloqueo de prueba sin afirmar validación. No se requiere build Angular al no tocar código Angular. Revisar diff y consistencia con `Pandas11.sql`; no usar cuentas reales, claves de servicio en frontend, cambios remotos, commit ni push.

## Aprobación

El usuario aprobó este plan y las tres decisiones de [requirements.md](requirements.md) el 2026-10-29. La aprobación cubre la consulta SQL local, sus permisos y las pruebas descritas; no cubre la conexión visual del dashboard de 5.2 ni despliegue remoto.

La migración `20261029120000_dashboard_kpis.sql` se aplicó en Supabase local usando una copia temporal del catálogo de migraciones para excluir `20261028120000_user_role_context.sql`, pendiente y ajena a 5.1. Esa migración anterior permanece sin aplicar; al retomarla debe tratarse explícitamente en el historial local. La suite SQL completa pasó con 289/289 pruebas; detalles en [validation.md](validation.md).
