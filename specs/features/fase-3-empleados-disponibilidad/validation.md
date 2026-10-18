# Validación — Fase 3

Fecha: 2026-10-17 (America/Lima). Estado: implementación local validada tras aprobación «Vamos implementala». Sin despliegue remoto.

## Alcance y estado inicial

Preflight de solo lectura en identity-dev: no existían employees, employee_schedules, business_hours ni time_blocks. Git: rama chore/introducir-sdd, HEAD 3ded0a5; solo las especificaciones de Fase 3 estaban sin seguimiento. No se sobrescribieron cambios ajenos.

Migración `20261017212614_employees_availability.sql` creada y aplicada con Supabase CLI. Incluye enum, cuatro tablas, restricciones/defaults/relaciones/índices del modelo, permisos, RLS y RPC. Pandas11.sql refleja el endurecimiento aprobado. No se ejecutó el SQL raíz ni reset; no se migró ni consultó una base remota. Se siembran únicamente seis tramos comerciales lunes–sábado 07–18.

Angular reutiliza `/empleados` y la tabla existente: búsqueda por nombre/teléfono paginada, vínculo de perfil activo al crear, habilidad, teléfono opcional, activación/desactivación. Incorpora calendario laboral, horario del local, bloqueos y consulta de intervalos en Lima. No se crean turnos de personas ni reservas automáticamente.

## Criterios y evidencia

| Criterio | Resultado comprobado |
|---|---|
| F3-01 | Cuarta migración incremental aplicada localmente con tablas, enum, FKs y constraints; sin reset ni borrado de cuentas existentes. Modelo alineado |
| F3-02 | Perfil único/activo al crear e inmutable por API, habilidad obligatoria y desactivación. search_employees prueba 1002 filas y página 101, con nombres disponibles a STAFF sin profiles.read global |
| F3-03 | Turnos partidos/consecutivos válidos; solapados, domingo, rangos invertidos y medianoche denegados. Dos RPC concurrentes con comienzos distintos y rangos superpuestos dejan solo una escritura, tanto personal como comercial |
| F3-04 | Bloqueos personales/globales, edición y eliminación por permiso, rango/motivo/FK obligatorios. Se prueba que created_by viene de auth.uid y editar no permite reemplazarlo |
| F3-05 | employee_availability verifica fecha, actividad empleado/perfil, habilidad y cobertura completa. Detecta bloqueos interiores/multidía y mantiene cierres comerciales intermedios |
| F3-06 | Feriado 28/07 entre semana admite consulta, domingo no. Inicio17 permitido y17:01 denegado aunque exista cobertura; fin19 solo con turno explícito. Hora Lima19 corresponde a UTC del día siguiente sin confundir fechas |
| F3-07 | Unión de bloqueos personales/globales 09–11 y10–12 resta09–12 una sola vez. Límites adyacentes no bloquean. occupancy_verified=false y aviso visible en UI; no reserva ni certifica ausencia de citas |
| F3-08 | OWNER/ADMIN gestionan, STAFF consulta y no cambia habilidad/turnos/bloqueos; CLIENT/anon e inactivos sin acceso laboral. RLS protege lecturas y escrituras REST están revocadas para impedir saltarse RPC |
| F3-09 | Menú/ruta empleados exigen employees.read; acciones por permiso. UI española, carga/error y descarte de respuestas obsoletas. Pruebas de componentes confirman conservación de formularios tras fallo de persistencia y guardado de bloqueo global con empleado NULL |
| F3-10 | SQL, API, Angular, tipos, lint y build correctos; regresión Fases 0–2 repetida con cuentas existentes y fixtures propios |

## Comandos ejecutados y resultados finales

| Comando | Resultado |
|---|---|
| `supabase migration new employees_availability` | Migración creada por CLI |
| `supabase migration up --local` | Aplicada incrementalmente, sin reset |
| `supabase db lint --local` | Sin errores ni advertencias |
| `supabase test db` | 76/76 PASS: 28 Fase 3 +48 anteriores |
| `node scripts/test-employees-availability-api.mjs` | 72 comprobaciones correctas; limpieza de IDs/prefijo propios |
| `node scripts/test-identity-api.mjs` | 26 comprobaciones correctas |
| `node scripts/test-clients-pets-api.mjs` | 42 comprobaciones correctas |
| `node scripts/test-services-prices-api.mjs` | 50 comprobaciones correctas |
| `npm test -- --watch=false --browsers=ChromeHeadless` | 43/43 PASS: 15 nuevas +28 anteriores |
| `./node_modules/.bin/tsc --noEmit -p tsconfig.app.json` | Correcto |
| `./node_modules/.bin/tsc --noEmit -p tsconfig.spec.json` | Correcto |
| `npm run build -- --configuration development` | Correcto |
| `npm run build` | Correcto; inicial 3,35 MB |
| `node --check scripts/test-employees-availability-api.mjs` | Correcto |
| `git diff --check` | Sin errores |

Las 190 comprobaciones API acumuladas se ejecutaron secuencialmente tras la migración. Pruebas SQL dentro de transacciones con rollback; API usa Auth sintético, UUIDs/prefijos aleatorios y limpia solo sus registros. El ensayo comercial usa un hueco libre y elimina únicamente sus propios tramos, comprobando que el calendario previo queda igual. No se exponen secretos ni se usan cuentas reales para los tests. Se corrigió una advertencia inicial del linter sobre inicialización de text[]; el resultado final está limpio.

## Reglas aplicables

- RN-01: America/Lima, lunes–sábado/feriado, domingo descanso, último inicio17 y turno extendido explícito; evidencia SQL/API/UI.
- RN-03: estado por trabajador y ventanas independientes; no se impone límite permanente de dos empleados ni se promete exclusividad transaccional de reserva.
- RN-06: bloqueo manual por recojo ocupa al trabajador en el intervalo registrado. No se calcula transporte ni se genera el bloqueo desde una cita.
- RN-07: habilidad ALL_SERVICES/ASSISTANT y pruebas de rechazo de corte a asistente.
- RN-10: consulta por empleado/intervalo permite analizar capacidad; asignación de relevo por etapas sigue pendiente del contrato de citas.

## Archivos principales

- `Pandas11.sql`; migración y `supabase/tests/database/employees_availability.test.sql`.
- `scripts/test-employees-availability-api.mjs`.
- `src/app/pages/empleados/empleados.component.{ts,html,spec.ts}`.
- `src/app/shared/services/empleados.service.ts`, `work-calendar.service.{ts,spec.ts}`.
- `src/app/shared/components/employees/work-calendar/` y sus pruebas.
- Rutas/sidebar y tabla compartida: tipos time/datetime-local, precisión de segundos y total remoto mostrado correctamente.
- Arquitectura, reglas, roadmap, baseline y `supabase/README.md` actualizados.

## Límites y siguientes decisiones

Disponibilidad laboral es un snapshot de turnos menos bloqueos registrados; no se verifica ocupación de citas/recojos ausentes de time_blocks, ni se reserva capacidad. La UI lo indica expresamente. La integración automática requiere otro plan para reconciliar AppointmentsService con Pandas11.sql y definir asignación/etapas/transacciones.

No hay recorrido E2E manual completo del panel ni inspección visual en todos los tamaños/temas; los componentes sí se ejecutaron en ChromeHeadless. No se verificó reconstrucción completa de una instancia nueva ni despliegue remoto: se comprobó la adopción incremental local preservando datos. No se instalaron dependencias ni se hicieron commits/pushes.

A continuación, revisión del usuario sobre la implementación y sobre la experiencia de gestión laboral. La siguiente fase no se inicia automáticamente.
