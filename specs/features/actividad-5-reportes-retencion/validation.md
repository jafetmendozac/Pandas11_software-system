# Validación — Actividad 5.4

Fecha: 2026-10-31 (America/Lima). Estado: **implementado y validado en entorno local**, con límites indicados abajo. El usuario aprobó R54-D01–D04 y el [plan](plan.md) mediante «Vamos».

| Criterio | Estado | Evidencia y límite |
|---|---|---|
| RR-01 / RN-32–RN-33, RN-40, RN-42 | Validado localmente | `monthly_business_reports` llama a `dashboard_kpis` por mes; pgTAP compara el total y comprueba precisión 10.25, rango inclusivo, borde de medianoche Lima y conteo de citas. La tabla y CSV muestran las mismas cadenas decimales. |
| RR-02 / RN-41 | Validado localmente | pgTAP comprueba clientes distintos, varias citas del mismo cliente, cancelación, baja posterior, año nuevo, 50.00 % y tasa nula sin base. La página rotula «Sin base». |
| RR-03 / RN-40 | Validado por pruebas de modelos y SQL | Tres pruebas Jasmine comprueban CSV UTF-8 con BOM, dos formatos, importes exactos, tasa vacía y mes provisional. La RPC no devuelve datos personales y sus filas se validan antes de exportar. No se abrió el CSV en aplicaciones externas. |
| RR-04 / RN-42 | Validado localmente | pgTAP verifica OWNER/ADMIN, denegación de STAFF/CLIENT/anon/rol delegado, rangos inválidos y mes futuro. La RPC requiere rol y permiso en servidor. La página y el enlace se ocultan por rol seleccionado; una prueba Angular comprueba la navegación. |
| RR-05 | Validación parcial | La página tiene estados, reintento, descarte de respuestas antiguas, tablas desplazables, etiquetas de campos y clases de modo oscuro. Build correcto. No se realizó inspección visual manual de móvil, teclado y oscuro con cuentas sintéticas. |
| RR-06 | Validación local con límite | Suite SQL y Angular completas, tipos y build correctos. No se consultó Supabase remoto ni se hizo aceptación operativa. |

## Cambios comprobados

- Migración `20261030100000_monthly_business_reports.sql` aplicada **solo a Supabase local**, sin reset. Añade una RPC `SECURITY DEFINER` con `search_path` vacío, `REVOKE` a `PUBLIC`/`anon` y acceso `authenticated` filtrado por rol/permiso. No añade tablas ni columnas; `Pandas11.sql` conserva el modelo estructural y referencia la nueva migración.
- `/reportes` ofrece dos reportes mensuales agregados y CSV descargados en el navegador. El intervalo va de 1 a 12 meses en `America/Lima`; el mes actual se marca provisional. No se usan Storage, secretos ni servicios externos.
- La retención es la intersección de clientes distintos con citas `COMPLETED` en meses consecutivos dividida por la base del mes anterior. La etiqueta «Histórico» evita sugerir que los meses anteriores son cierres contables inmutables.

## Ejecución

- `supabase migration up --local`: aplicada una migración 5.4, sin reset.
- `supabase test db`: **364/364 correctas** en 13 archivos, incluidos 22 casos nuevos de `monthly_business_reports.test.sql`.
- `npx ngc -p tsconfig.app.json --noEmit`: correcto.
- `npx tsc -p tsconfig.spec.json --noEmit`: correcto.
- `npm test -- --watch=false --browsers=ChromeHeadless`: **148/148 correctas**. La primera ejecución tuvo cuatro fallas en el mock del sidebar, que no exponía `selectedRole`; se corrigió el mock y se repitió la suite completa.
- `npm run build`: correcto fuera del sandbox restringido. Persiste el aviso previo del presupuesto CSS de `src/app/pages/inicio/inicio.component.css` (1,46 kB), ajeno a 5.4.
- `git diff --check`: correcto.

Las primeras ejecuciones de Angular en el sandbox terminaron con código 134 antes de compilar; las ejecuciones locales autorizadas terminaron correctamente. Se usaron datos sintéticos con `ROLLBACK` en SQL. La revisión visual manual, la aceptación del negocio y cualquier adopción remota siguen pendientes.
