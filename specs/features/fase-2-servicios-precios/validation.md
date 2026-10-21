# Validación — Fase 2

Fecha: 2026-10-17. Estado: implementación local validada, sin despliegue remoto.

## Alcance

Migración incremental `20261017210343_services_prices.sql`: services/service_prices extraídos y alineados con Pandas11.sql, constraints/defaults, FK, unicidad NULLS NOT DISTINCT, permisos/RLS y RPC de cálculo/búsquedas. Preflight local confirmó ausencia de ambas tablas. Aplicación mediante Supabase CLI, sin reset y preservando cuentas/datos existentes.

Angular adapta pantallas existentes con persistencia confirmada, precios como texto decimal, comodines/TOY, paginación remota y permisos por ruta/acciones. Simulador en Tarifas y catálogo propio `/catalogo` desde perfil. No se integró persistencia de citas, transporte o pagos.

## Criterios

| Criterio | Resultado |
|---|---|
| F2-01 | Migración incremental aplicada, tablas con constraints y RLS, sin reset |
| F2-02 | Validación compartida money/minutes, precio vacío rechazado, servicio no vacío y guardado mediante callback asíncrono de tabla |
| F2-03 | TOY y dimensiones NULL en formulario; pruebas de unicidad exacta, general y una dimensión NULL |
| F2-04 | quote_service invoker devuelve precio texto, minutos y origen/regla; prioridad de cinco niveles comprobada; una sola regla completa |
| F2-05 | Simulador muestra cero, duración y procedencia; catálogo propio filtra visibles, acepta dimensiones desconocidas y descarta respuestas obsoletas |
| F2-06 | API prueba OWNER/ADMIN/STAFF/CLIENT/anon e inactivo; ocultos/inactivos no cotizables por cliente; escritura por permiso |
| F2-07 | SQL parametrizado, orden estable; prueba de 1002 servicios y 1002 tarifas con página posterior al límite API |
| F2-08 | Suites SQL/API/Angular correctas; tipos, lint y build correctos |

## Comandos y resultados

- `supabase migration new services_prices` y `supabase migration up --local`: correctos.
- `node scripts/test-services-prices-api.mjs`: 50 comprobaciones correctas con limpieza de fixtures propios.
- `supabase test db`: 48/48 (18 de Fase 2 y 30 de fases previas), PASS.
- `supabase db lint --local`: sin errores.
- `npm test -- --watch=false --browsers=ChromeHeadless`: 28/28 correctas (20 previas y 8 nuevas de validación/simulador).
- `npm run build`: correcto; bundle inicial 3,34 MB.
- TypeScript app/spec sin emisión: correctos, salida 0.
- Regresión API: identidad 26/26 y clientes/mascotas 42/42 correctas tras la migración.
- `git diff --check`: sin errores.

## Evidencia destacada

Precio cero no cae a base; decimal `9007199254740993.25` regresa exactamente sin conversión binaria. Exceso de decimales, NaN, Infinity, minutos cero/negativos/fraccionarios y campos NULL requeridos se rechazan. Se comprueban respuestas y filas afectadas en denegaciones por RLS.

La tarifa general se utiliza para dimensiones desconocidas; tamaño gana a pelaje y exacta gana a ambas. Eliminar exacta deja actuar la siguiente regla; desactivar servicio conserva sus tarifas. Cliente no ve reglas de servicio oculto/inactivo. El simulador no mezcla precio y duración y limpia cotización cuando cambian entradas.

## Límites

Sin recorrido manual completo de la aplicación; pruebas de componentes ejecutadas en ChromeHeadless. Valores comerciales no se inventaron ni se sembraron en catálogo: el usuario configura sus precios/duraciones. No modifica agenda, snapshots, pagos, transporte o impuestos; disponibilidad de personal fuera de esta fase. La base remota permanece sin cambios y su esquema no está verificado.
# Seguimiento visual de tarifas — 2026-10-21

Durante el recorrido de aceptación de actividades 1–3, la tabla Tarifas para STAFF mostraba el UUID del servicio aunque `search_service_prices` ya devolvía `service_name`. `TarifasComponent` ahora incorpora las etiquetas de las filas consultadas a las opciones de visualización, conservando UUID en los valores de formulario y permisos de gestión. Una nueva prueba de componente verifica nombre visible y ausencia de acción de alta para STAFF. Resultado: 93/93 pruebas Angular, compilación local y de producción correctas; Chrome local mostró «DEMO Baño» en lugar del UUID. La producción avisó un exceso de 118 bytes en el CSS de la portada, sin relación con este ajuste. Evidencia en el [paquete de revisión](../../aceptacion-actividades-1-3.md).
