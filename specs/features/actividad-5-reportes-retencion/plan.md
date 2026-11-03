# Plan — Actividad 5.4, reportes y retención

Fecha de propuesta: 2026-10-30 (America/Lima). Estado: **aprobado mediante «Vamos» e implementado localmente el 2026-10-31**. Requisitos: [requirements.md](requirements.md). Resultados: [validation.md](validation.md).

## Diagnóstico técnico

`Pandas11.sql` describe `appointments(id, client_id, starts_at, status)`, `clients(id, deleted_at)`, `payments(status, type, amount, paid_at)` y `sale_payments(status, amount, paid_at)`. Las migraciones locales de citas, pagos y cobros comerciales contienen esas relaciones; 5.1 y 5.2 añadieron `dashboard_kpis(date)`, `dashboard_analytics(date)` y `analytics.read`. El SQL raíz es modelo local, no prueba del esquema remoto. No se propone cambiar tablas, columnas, enums o relaciones de `Pandas11.sql`.

La ruta `/panel` ya presenta analítica con control visual por rol y una RPC protegida. `AuthorizationService` mantiene el rol seleccionado. `src/app/app.routes.ts` y el sidebar registran rutas operativas por permiso. La pantalla de facturas sigue siendo de plantilla: no se adaptará ni se usará como fuente de datos. La fórmula de retención de R54-D03 es nueva y requiere aprobación.

## Cambios propuestos tras la aprobación

1. **Migración incremental local:** añadir `public.monthly_business_reports(p_from date, p_to date)` que valide primer día de mes, rango inclusivo máximo de 12 meses y límite hasta el mes actual de Lima. Exigir OWNER/ADMIN activo y `analytics.read` en servidor; `SECURITY DEFINER`, `search_path` vacío, `REVOKE` de `PUBLIC`/`anon` y `GRANT` a `authenticated`. Devolver por mes importes `numeric` como texto, conteos enteros y retención con numerador/denominador/tasa; sin datos personales. Reutilizar `dashboard_kpis` por mes o una consulta equivalente contrastada con sus resultados, sin cambiar su contrato.
2. **Retención:** calcular conjuntos de `client_id` distintos desde `appointments` `COMPLETED` por `starts_at` en `America/Lima`. Para cada mes incluir el mes anterior aunque quede fuera del intervalo elegido. Contar la intersección como clientes repetidores. Evitar multiplicación por `appointment_items`; tasa `NULL` si base cero. Los clientes con baja posterior permanecen en el conteo agregado histórico.
3. **Pruebas de base de datos:** crear `supabase/tests/database/monthly_business_reports.test.sql` con datos sintéticos y reversión. Comparar mes a mes con `dashboard_kpis`; verificar duplicados por cliente, exclusión de estados, año nuevo, borde de medianoche Lima, intervalos inválidos y roles/permisos/RLS. Revisar que la respuesta no exponga identificadores o datos personales.
4. **Angular:** crear modelos/servicio tipados para la RPC y una página independiente en `src/app/pages/reportes/`, con dos tablas, selector de intervalo, estados de carga/error y botones de exportación CSV por reporte. Añadir ruta `/reportes` y enlace de sidebar únicamente para el rol seleccionado permitido. Mantener `/panel` y facturas de plantilla sin cambios de comportamiento. La exportación se genera en el navegador a partir de la respuesta autorizada, sin Storage ni dependencias nuevas.
5. **CSV:** implementar serialización pequeña y probada que preserve importes textuales exactos, campos vacíos para tasa sin base y protección frente a interpretación de celdas como fórmulas. Descargar únicamente la vista agregada mostrada, con encabezados y nombre de archivo identificables. Documentar en pantalla la fórmula de retención y el carácter provisional del mes actual.
6. **Documentación posterior:** solo si se aprueba e implementa, registrar las nuevas reglas de negocio en `specs/business-rules.md`, actualizar roadmap/matriz/anexo de Actividad 5 y completar `validation.md` con evidencia real. No modificar diagnósticos históricos para simular validación retrospectiva.

## Validación prevista

- Revisar estado Git y migraciones locales; no sobrescribir trabajo pendiente. Aplicar únicamente la nueva migración a Supabase local, sin reset ni cambios en producción; no ejecutar `Pandas11.sql` entero.
- Ejecutar prueba SQL específica y suite SQL pertinente; probar autorización de OWNER/ADMIN, STAFF, CLIENT, anon y rol delegado con datos sintéticos.
- Ejecutar pruebas Angular de rangos, conversión, exportación CSV, cambio de rol y estados de interfaz; `ngc`/TypeScript, `npm test` y `npm run build` según disponibilidad.
- Revisar visualmente escritorio/móvil, teclado y modo oscuro; comparar dos meses de salida con cálculo manual y con `dashboard_kpis`. Registrar límites si alguna comprobación no puede ejecutarse.

## Riesgos y límites

- El mes actual es parcial; la interfaz y el CSV deben señalarlo. La métrica no identifica causas de abandono.
- La exportación desde navegador requiere cuidado con fórmulas CSV, precisión y datos personales. Solo se entregan agregados autorizados; no se descargan filas de clientes.
- Las pruebas locales no acreditan el estado remoto. Cualquier adopción o despliegue remoto requiere plan y aprobación independientes.
- No se añaden dependencias, se cambian claves, se hacen commits ni se ejecutan operaciones remotas.

## Aprobación requerida

El usuario aprobó R54-D01–D04 y este plan mediante «Vamos» antes de modificar código o SQL. Cualquier cambio posterior de formato, fórmula, audiencia o nivel de detalle requiere actualizar requisitos y plan.
