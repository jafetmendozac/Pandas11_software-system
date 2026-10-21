# Validación — Actividad 4.1

Fecha: 2026-10-21. Estado: **implementación local de la base de 4.1; alcance parcial del módulo comercial**.

| Criterio | Estado | Evidencia y límite |
|---|---|---|
| V4-01 | Cumplido en base local para servicios de cita y artículos por unidad | `sales`, `sale_items`, instantáneas y total `numeric`; pruebas SQL de suma exacta. |
| V4-02 | Cumplido para vínculo a cita interna completada | Servicio importado del item de cita; `confirmed_appointment_payments` consulta `payments` sin crear otra fila. |
| V4-03 | Cumplido para creación, confirmación y anulación | Validaciones de payload, constraints, clave de reintento, versión, unicidad por cita y mutex compartido. |
| V4-04 | Cumplido en base local | Permisos/RLS y RPC; OWNER/ADMIN consultan y gestionan; STAFF sin lectura. |
| V4-05 | Cumplido en base local | Anulación con motivo; si hay cobro confirmado, solo OWNER; `requires_resolution` sin devolución. |
| V4-06 | Cumplido como límite de alcance | No se crean documentos tributarios ni movimientos de stock; artículo solo en venta DRAFT. |
| RN-02, RN-09, RN-12, RN-16–RN-21 | Validación local pertinente | Cobros de cita conservados; importes exactos, roles y restricciones en `sales.test.sql`. |

Se aplicaron **solo en Supabase local** `20261021090000_sales_foundation.sql`, `20261021093000_sales_product_queries.sql` y `20261021100000_sales_role_guard.sql`, sin reset ni producción. La última migración exige pertenencia activa a OWNER/ADMIN además del permiso, incluso cuando se delega a un rol personalizado. `Pandas11.sql` refleja las nuevas entidades; Angular incorpora modelos y `SalesService`, sin ruta ni pantalla todavía. La prueba `sales.test.sql` utiliza datos sintéticos dentro de transacción y rollback.

| Verificación | Resultado |
|---|---|
| `supabase test db` | **171/171**; 34 nuevas comprobaciones de ventas y regresión de suites anteriores. |
| `supabase db lint --local` | Sin errores de esquema tras las tres migraciones. |
| TypeScript `tsc --noEmit` | Correcto. |
| `npm run build` | Correcto fuera del sandbox; advertencia previa de presupuesto CSS en `inicio.component.css` (+118 bytes). |
| `npm test -- --watch=false --browsers=ChromeHeadless` | **93/93** pruebas Angular correctas fuera del sandbox. |
| Revisión remota y recorrido humano | No realizados. No se ejecutó prueba API independiente de PostgREST para las nuevas RPC; pgTAP ejercita permisos y funciones con identidad simulada. |

Las ejecuciones de build y tests Angular dentro del sandbox abortaron en esbuild (código 134); las mismas órdenes terminaron correctamente fuera del sandbox. No se instalaron dependencias ni se hizo despliegue remoto.

**Pendiente para 4.2/4.4:** página de ventas, cobro de mostrador, regla de cobro combinado, inventario y autorización de confirmación de artículos. Una venta que incluya productos permanece en DRAFT; por tanto no se declara el módulo de venta mixta de punta a punta como terminado.
