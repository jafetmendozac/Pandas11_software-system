# Servicios principales y adicionales — validación local

Fecha: 2026-11-20 (America/Lima). Estado: implementación y pruebas locales realizadas; sin despliegue remoto ni revisión visual manual de la interfaz.

## Resultado

| Criterio | Evidencia y resultado |
|---|---|
| SPA-01 / SPA-03 (RN-43) | Catálogo local con tres `MAIN` y tres `ADD_ON`. `service_addon_allowed` tiene cinco relaciones: Baño medicado y Corte higiénico solo con Baño estético; Desparasitación con los tres. La RPC rechaza adicional no vendible solo y combinación incompatible. Corte higiénico y Desparasitación tienen `can_sell_alone=true`. |
| SPA-02 (RN-11/RN-12/RN-44) | `quote_service` devuelve mínimo, máximo y minutos. La RPC de citas exige precio explícito cuando hay rango; prueba API rechaza precio ausente, menor, mayor y más de dos decimales, y conserva S/ 110.10 seleccionado en snapshot. Angular muestra rangos y exige importe final. |
| SPA-04 (RN-04/RN-05/RN-07/RN-15/RN-44) | Tarifas por cinco tamaños y minutos aprobados instalados localmente. Cada adicional es un item consecutivo con sus minutos y habilidad; el servidor conserva la comprobación de turnos y etapas. |
| SPA-05 (RN-19/RN-45) | Preflight: 12 servicios antiguos, siete items históricos de cita y uno de venta referenciados. Después de migrar: cero servicios antiguos, siete items de cita y uno de venta conservados con nombre e importe y FK de servicio NULL. `private.appointment_json`, venta y analítica leen snapshot. API de ventas correcta. La UI de cita histórica muestra nombre/precio y bloquea reprogramación del servicio retirado. |
| SPA-06 (RN-13) | RLS de `services`/`service_prices` conservada; `service_addon_allowed` tiene políticas de lectura por permiso o catálogo visible y escritura para `services.manage`. Suite API de tarifas y suite SQL correctas. No se inspeccionó el esquema remoto. |

## Comprobaciones ejecutadas

- Preflight de PostgreSQL local y ensayo de la migración en transacción con rollback: correctos. Migraciones `20261119010000`, `20261119020000` y `20261119030000` aplicadas únicamente a Supabase local, sin reset.
- `supabase test db`: **372/372** correctas en 13 archivos. Se actualizó una expectativa de horarios anterior a la regla ya aprobada de cierre configurable.
- `node scripts/test-appointments-api.mjs`: **93 comprobaciones correctas**, incluidas las dos aserciones finales de incompatibilidad. Docker Desktop estuvo pausado durante un intento intermedio y después volvió a estar disponible.
- `node scripts/test-services-prices-api.mjs`: **44 comprobaciones correctas**.
- `node scripts/test-sales-api.mjs`: **26 comprobaciones correctas**.
- `node scripts/seed-local.mjs` repetido sin recrear servicios retirados; `node scripts/test-local-seed.mjs`: **40 comprobaciones correctas**. `node scripts/test-commercial-seed.mjs`: **19 comprobaciones correctas**.
- `npm test -- --watch=false --browsers=ChromeHeadless`: **216/216** correctas tras actualizar el fixture del catálogo con `kind: 'MAIN'`. `npm run build` y TypeScript app/spec sin emisión: correctos.
- `supabase db lint --local`: terminó correctamente con una advertencia preexistente de volatilidad en `public.contact_queue`, ajena al catálogo.
- `git diff --check` y sintaxis Node de scripts modificados: correctos.

## Límites y seguimiento

No se realizó recorrido visual manual en móvil, modo oscuro o teclado por falta de herramienta de navegador interactivo. El esquema remoto y producción no se inspeccionaron ni modificaron. No se hicieron commits ni pushes.

Las citas históricas con `service_id=NULL` son de consulta; conservan estado y cobros, pero no se reprograman con servicios eliminados. Una instalación nueva usa el catálogo de seis prestaciones. La instancia local actual conserva las citas demo previas con sus snapshots; el seed no las recalcula.
