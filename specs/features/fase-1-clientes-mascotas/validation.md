# Validación — Fase 1

Fecha: 2026-10-17. Estado: implementación local completada y validada; sin despliegue remoto.

## Alcance entregado

Migración incremental `20261017201505_clients_pets.sql`: cinco tablas del modelo local y enums, constraints/defaults, permisos, RLS y RPC de clientes/baja lógica/búsqueda. Se aplicó sobre identity-dev existente con `supabase migration up --local`, sin reset ni modificaciones de cuentas del usuario. Pandas11.sql actualizado con las mismas restricciones y defaults.

UI reutiliza clientes y mascotas, incorpora búsqueda/paginación en servidor, vacunas, notas internas, archivo de lectura y consulta propia en `/mis-datos`. Tabla compartida conserva modo legacy por eventos y añade callback asíncrono optativo que mantiene formulario/datos ante fallo. Fichas públicas e internas usan consultas separadas.

## Criterios

| Criterio | Evidencia |
|---|---|
| F1-01 | Migración aplicada incrementalmente; preflight confirmó ausencia de las cinco tablas. Sin reset ni datos reales en fixtures |
| F1-02 | Clientes con/sin perfil, vínculo por RPC con permiso y mascotas asociadas; UI desde listado y ficha |
| F1-03 | RPC invoker bajo RLS, búsqueda literal parametrizada; prueba de apóstrofe/teléfono/dueño y 1002 filas con página posterior a límite 1000 |
| F1-04 | SQL/API comprueba TOY, allergies boolean, nombres/peso/fechas; tipos/formularios alineados |
| F1-05 | Vacunas de mascota: lectura, registro/corrección y validación temporal por SQL/API y servicio |
| F1-06 | CLIENT sin filas internas, incluido join embebido; autor/fecha controlados por servidor. Prueba de componente comprueba ausencia de consulta/textarea interna para cliente |
| F1-07 | Pruebas OWNER/ADMIN/STAFF/CLIENT A y B/anon, no transferencia, no vínculo propio, no falsificar autor |
| F1-08 | Retiro conserva mascota/vacunas/notas, cliente deja de verlas; STAFF consulta archivo y escrituras de archivo afectan cero filas o se rechazan |
| F1-09 | Pruebas tabla: mantener formulario/datos ante error, esperar confirmación, validar selectores, modo legacy, paginación remota; guard exige permiso de dominio |
| F1-10 | SQL/API y regresión Angular ejecutadas; tipos, lint y build; sin cambios remotos |

## Ejecuciones

- `supabase migration new clients_pets`: creó nueva migración con CLI.
- Preflight SQL local de tablas en modo lectura: ninguna de las cinco existía; se evitó cualquier conciliación destructiva.
- `supabase migration up --local`: correcta; no reset.
- `node scripts/test-clients-pets-api.mjs`: 42 comprobaciones correctas, incluida paginación con 1002 fixtures. Limpieza por UUID/prefijo aleatorio exclusivamente propio.
- `supabase test db`: 30/30 correctas (14 Fase 1 + 16 identidad).
- `supabase db lint --local`: sin errores.
- TypeScript app y specs sin emisión: correctos.
- `npm test -- --watch=false --browsers=ChromeHeadless`: 20/20 correctas, incluidas pruebas de detalle, permiso de ruta y regresión de tabla/Fase 0.
- `npm run build`: producción correcta tras últimos ajustes; total inicial 3,33 MB.
- `node scripts/test-identity-api.mjs`: 26 comprobaciones correctas tras aplicar Fase 1.
- `git diff --check`: sin errores.

## Hallazgos corregidos durante validación

Una aserción API esperaba error al denegar UPDATE por RLS; se corrigió para comprobar cero filas y nombre original intacto. Las pruebas de detalle detectaron falta de notificación al completar cargas asíncronas; se añadió markForCheck en páginas/detalle y callbacks de tabla. El textarea de consulta se hizo readOnly para impedir que la inicialización de ngModel alterara su estado disabled.

## Límites

No hubo recorrido manual de la aplicación con datos reales. ChromeHeadless valida componentes y controles de lectura; no sustituye una revisión visual completa del negocio. No hay Storage, adjuntos/fotos gestionados, historial de revisiones, diagnósticos, citas o pagos en esta fase. document_url/photo_url se conservan en modelo pero no se cargan automáticamente ni se ofrecen controles de subida.

No se modifican políticas de identidad; únicamente catálogo/asignaciones de permisos por migración privilegiada. OWNER/ADMIN editan, STAFF consulta, CLIENT solo consulta ficha vinculada. Detalles de alergias en notas internas; notas 1:1 con último autor/fecha. Las declaraciones históricas de baseline/architecture sobre ausencia de estas tablas ya no describen identity-dev actual.
