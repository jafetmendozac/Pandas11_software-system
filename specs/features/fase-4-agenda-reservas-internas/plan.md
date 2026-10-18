# Plan técnico — Fase 4

Fecha: 2026-10-17. Estado: aprobado mediante «Vamos procede» e implementado en identity-dev.

## Decisiones y alcance

Confirmado por el usuario: gestión de citas solo OWNER/ADMIN, STAFF consulta; varias mascotas del mismo cliente según capacidad; etapas con relevo y minutos definidos por recepción respetando el total del servicio. Las políticas operativas adicionales de [requirements.md](requirements.md) se presentan para aprobar con este plan.

Se adapta la agenda existente en `/calendario`, no se reconstruye el proyecto ni se amplía el calendario de demostración `/calendar`. Tablas del alcance: appointments, appointment_items, appointment_item_staff y appointment_internal; dependencias de Fases 0–3. No se implementan pagos, autorreserva online ni tareas automáticas de transporte.

## Discrepancias que se resolverían tras aprobación

1. Sustituir en Angular el contrato heredado de cabecera por mascota/perfil y appointment_services por los items del modelo y empleados de employees.
2. Cambiar fechas/horas separadas y estados minúsculos por timestamps y enums del modelo; preservar America/Lima en entrada, servidor y calendario.
3. Sustituir escrituras sucesivas/borrado físico por RPC atómica, transiciones y cancelación conservando datos.
4. Ampliar appointment_item_staff: hoy no tiene etapas ni intervalos; su PK impediría registrar dos etapas del mismo item con la misma persona.
5. Agregar ocupación de citas al calendario laboral de Fase 3 y coordinar las escrituras de horarios/bloqueos con las reservas. Filtrar empleados en UI por sí solo no ofrece esa garantía.

Son cambios propuestos, no aplicados silenciosamente al modelo o al código.

## Impacto aprobado en Pandas11.sql

| Elemento | Cambio propuesto y motivo |
|---|---|
| appointments | UUID default; starts_at/ends_at finitos obligatorios; estado/origen obligatorios; created_by y timestamps de servidor. Totales/adelanto/transporte numeric finitos no negativos con máximo dos decimales. version entero positivo default1 para rechazar ediciones desactualizadas |
| appointments | Conservar columnas de origen/hold/recojo/cancelación. RPC interna fija INTERNAL, CONFIRMED, adelanto0, holdNULL y sin recojo automático. Cliente fijo; total y extremos temporales se derivan de items/asignaciones. Cancelación consistente con estado y campos servidor |
| appointment_items | UUID/created_at por defecto; service_id, precio y minutos obligatorios; importe finito/no negativo, minutos enteros positivos. Conservar FKs compuestas a cita/cliente y mascota/cliente; peso positivo si existe. Unicidad propuesta (appointment_id,pet_id,service_id) |
| appointment_items | Agregar requires_specialist_snapshot boolean obligatorio: conservar la exigencia de habilidad aceptada junto al precio/duración; no depender de cambios posteriores del catálogo para interpretar un servicio histórico |
| appointment_item_staff | Agregar id uuid PK, stage text controlado SERVICE/BATH/CUT y starts_at/ends_at finitos obligatorios, con fin>inicio. Sustituir PK (item_id,employee_id) por id y unicidad (item_id,stage): permite baño/corte por la misma persona sin duplicar una etapa |
| appointment_item_staff | Mantener item_id/employee_id obligatorios y sus FKs. Índices por empleado/rango y relación a item; validación entre filas en RPC, no CHECK con consultas a otras tablas |
| appointment_internal | Conservar PK appointment_id; updated_by/updated_at de servidor y defaults apropiados; notas separadas y RLS propia |
| Enums existentes | Migrar appointment_status/appointment_source con sus valores actuales, sin agregar un estado scheduled ni retirar los previstos para otros flujos |

No se propone una quinta tabla ni duplicar cada cita en time_blocks. La ocupación se deriva de asignaciones y estado de la cita, unida a los bloqueos manuales. La actualización del modelo, migración y contratos se hará coordinadamente después de aprobar estas ampliaciones.

## Secuencia de implementación propuesta

### 1. Preflight local y migración incremental

Usar Supabase CLI para inspeccionar historial y comprobar, sin datos personales en salida, si las cuatro tablas/enums o appointment_services existen en identity-dev. Revisar contratos locales antes de tocar datos. Si aparecen tablas/datos heredados incompatibles, detener la aplicación de SQL y presentar un mapeo de conciliación; no eliminarlos, renombrarlos ni transformarlos automáticamente.

Crear una nueva migración con CLI; no editar las cuatro migraciones ya aplicadas. Añadir tablas, dependencias, constraints, índices, RLS/grants, RPC y cambios de funciones de Fase 3 en esa migración. Reflejar ampliaciones aprobadas en Pandas11.sql. Aplicar solo mediante `supabase migration up --local`, sin reset ni importación del SQL raíz. No sembrar citas, personal ni tarifas comerciales ficticias persistentes.

### 2. Contrato de servicio y tiempos

Un item representa un servicio por mascota, cotizado por SQL con la prioridad de quote_service. Mantener decimal exacto como texto hacia Angular; total numeric calculado por servidor.

SERVICE ocupa al empleado durante todo el item y aplica requires_specialist_snapshot. Para relevo, BATH y CUT forman exactamente dos tramos consecutivos, positivos y con suma de minutos igual al snapshot; CUT exige ALL_SERVICES. Un servicio especializado no puede eludir esa exigencia enviando solo BATH. No admitir simultáneamente SERVICE y descomposición BATH/CUT en un mismo item. No inferir etapas por nombres de catálogo ni fijar proporciones de minutos.

Cada mascota tiene una cadena de items/etapas sin huecos ni coincidencias, mientras mascotas distintas pueden ir en paralelo. Cabecera min(inicios)/max(finales); precio de cada item una sola vez. Validar el primer inicio por mascota hasta17 y cobertura laboral de cada etapa. Las continuaciones después de17 usan interval_covered de Fase 3, no can_start_service, para permitir un corte posterior al baño iniciado a17.

Preservar snapshots e IDs de items intactos en reprogramaciones; solo nuevos/reemplazados se cotizan explícitamente. Confirmar version y estado antes de cambiar. No introducir overrides de tarifa/duración total ni modificar citas terminales.

### 3. Transacción y concurrencia entre dominios

Propuesta: ampliar el mutex transaccional global 930003 ya usado para horarios. Toda creación/edición/transición/cancelación de cita, cambio de turno/local, bloqueo y modificación de empleado que afecte a reservas participa del mismo protocolo. Es conservador para el volumen actual y evita ordenaciones de locks entre mascotas, trabajadores, días y local.

En cada RPC de escritura: autorización; mutex; lectura nueva del registro y version; validación completa de entidades, horarios, habilidad, bloqueos y ocupación; escritura de cabecera/items/asignaciones; incremento de version; resultado. Una excepción revierte todos los cambios. Excluir de conflictos únicamente la cita que se está editando y que ya fue autorizada; no aceptar una exclusión arbitraria del payload.

Mantener lecturas de conflictos en instrucciones posteriores a adquirir el lock y verificar Read Committed en la ejecución real. No confiar en que una consulta previa o la existencia de una transacción eviten carreras: PostgreSQL toma snapshots por instrucción en ese nivel. Esta elección de protocolo es una propuesta de arquitectura basada en el comportamiento documentado de [aislamiento PostgreSQL17](https://www.postgresql.org/docs/17/transaction-iso.html) y [bloqueos de aplicación](https://www.postgresql.org/docs/17/explicit-locking.html); se comprobará con peticiones concurrentes reales.

Revocar INSERT/UPDATE/DELETE directos sobre las cuatro tablas a anon/authenticated para impedir eludir el protocolo. Los procesos privilegiados futuros deberán usarlo también. No añadir extensiones ni dependencias para esta estrategia.

Actualizar mediante nueva migración save_work_period/remove_work_period y save_time_block/remove_time_block para tomar el mismo mutex y rechazar cambios que invaliden CONFIRMED/IN_PROGRESS. Evaluar modificaciones de actividad/habilidad en save_employee bajo el protocolo: informar citas afectadas y exigir reasignación previa cuando el cambio sea administrativo. Bloquear perfiles usados en la validación con locks de fila compatibles y revalidar al iniciar atención; una desactivación de cuenta por seguridad no se impide ni modifica roles de identidad y debe mostrarse como incidencia operativa.

No reservar una misma persona ni mascota en intervalos superpuestos, incluso en distintas citas del mismo cliente. Permitir límites adyacentes y diferentes personas/perros en paralelo. CONFIRMED/IN_PROGRESS y tramos registrados COMPLETED cuentan como ocupación; CANCELLED/NO_SHOW se excluyen. Revalidar cobertura y ocupación programada al pasar a atención, sin deducir actividad real indefinida del estado agregado de una cita con varias etapas. Las demoras requieren bloqueo adicional y resolver reservas afectadas; seguimiento real por etapa fuera de este contrato.

Dos envíos simultáneos del mismo formulario deben dejar una única reserva, no dos. Bloquear doble clic; si se pierde la respuesta de una escritura, recargar estado y no reintentar ciegamente. version evita sobrescrituras entre editores: una segunda actualización con versión vieja devuelve conflicto y conserva el formulario.

### 4. RPC, estados y seguridad

Nombres propuestos de contratos, ajustables durante implementación sin cambiar su alcance:

- save_internal_appointment: alta/edición atómica con items y asignaciones, validaciones y cálculo servidor; exige appointments.manage y appointments.read, revalidados tras esperar el mutex.
- change_appointment_status: transición con version; exige appointments.status o appointments.cancel según destino. Cancelación con motivo/actor/fecha servidor; sin DELETE ni reapertura.
- save_appointment_internal: escritura separada por appointment_internal.manage, autor/fecha servidor y control de version de cita para evitar pérdida de edición.
- search_appointments/get_appointment: rango solapado [desde,hasta), filtros/paginación y ficha completa, permiso appointments.read; sin notas internas en respuesta ordinaria.
- appointment_availability: combina calendario laboral, bloqueos y ocupación de asignaciones con permisos availability.read y appointments.read. Consulta orientativa, sin crear reserva; guardado vuelve a validar.

Mantener employee_availability como contrato laboral actual (occupancy_verified=false) para no convertir su aviso en una garantía falsa. La nueva agenda usa la consulta que incluye citas; no prometer automatización de recojos ausentes de time_blocks. Ocupación visible solo al personal autorizado.

Implementar RLS de lectura por permisos en tablas padre/hijas y notas por permiso independiente. RPC de escritura con SECURITY DEFINER, search_path vacío, nombres de objetos cualificados, EXECUTE mínimo y checks explícitos por operación. Es necesario restringir ejecución y resolver objetos de forma segura al usar privilegios elevados, como describe [Supabase Database Functions](https://supabase.com/docs/guides/database/functions).

Matriz de requisitos: OWNER/ADMIN gestionan, STAFF lee, CLIENT/anon/inactivos denegados. Agregar solo permisos del dominio y sus asignaciones; no conceder profiles.read global a STAFF, no alterar roles Auth ni permisos de gestión de empleados. Datos de cancelación, totales, origen y autor nunca se confían al payload.

### 5. Angular sobre la página existente

Reescribir los tipos y consultas de AppointmentsService para el modelo aprobado; eliminar su dependencia funcional de appointment_services sin borrar una tabla remota. Reutilizar búsquedas de clientes/mascotas, empleados y tarifas ya migradas; seleccionar solo activos al crear. Conservar lectura histórica por RPC controlada de la cita incluso si después se retira una ficha.

Adaptar CalendarioComponent y su formulario para cliente fijo, varias mascotas, servicios/items, asignación y tiempos por etapa, cotización, disponibilidad, estados y cancelación. Observaciones internas en sección aparte por permiso; no utilizarlas como título del evento. Guardado asíncrono confirmado, campos preservados ante error, bloqueo de doble envío y respuestas obsoletas descartadas. Deshabilitar arrastre/resize si no pasan por el mismo contrato transaccional.

Cargar por rango visible con paginación estable y completa, también para catálogos/opciones; probar más de1000 registros sin truncado silencioso. Representar asignaciones/etapas de forma que no parezca que un trabajador ocupa toda una cita paralela cuando solo cubre un tramo. Ficha agrupada por cita y filtros por empleado/estado.

Mostrar horas Lima independientemente del navegador y todos los eventos que terminen después de18. Verificar soporte efectivo de zona horaria en FullCalendar7 instalado antes de elegir su adaptación; no asumir que un formato local de Date conserva Lima ni instalar un plugin automáticamente. Probar selección, edición y rango visible en zonas diferentes. Renderizar nombres/notas con texto/nodos seguros, sin interpolar contenido del usuario dentro de html.

Agregar permission appointments.read a `/calendario`; filtrar el subitem anidado Citas → Calendario y retirar el grupo vacío. No basta filtrar item.path porque esta ruta está dentro de subItems. Acciones de edición/estados/cancelación/notas según permiso; mantener `/calendar` como demo.

### 6. Validación y documentación

Aplicar [validation.md](validation.md): tests SQL/RLS, API concurrente y componentes Angular. Repetir suites de Fases 0–3 sin reset, lint, tipos y build. Registrar evidencia por criterio y reglas RN; no presentar resultados históricos como ejecuciones nuevas.

Actualizar business-rules, arquitectura, baseline, roadmap y supabase/README con comportamiento aprobado, comandos y límites. La adopción remota requiere su propio inventario y plan; no se hace db push/link ni se usan datos reales.

## Archivos previstos después de aprobar

- Pandas11.sql y nueva `supabase/migrations/<timestamp>_internal_appointments.sql` creada por CLI.
- Nuevo test SQL de agenda y `scripts/test-appointments-api.mjs` con fixtures locales.
- AppointmentsService, CalendarioComponent TS/HTML y pruebas; componentes de dominio dentro de shared/components si el formulario lo necesita.
- Rutas/sidebar, pruebas de guard y servicios de soporte estrictamente relacionados; sin mover la estructura existente.
- Funciones de Fase 3 actualizadas por la nueva migración, conservando su contrato público salvo la nueva protección frente a reservas conflictivas.
- Documentos SDD y README local. Sin dependencias nuevas, commits ni cambios de producción.

## Aprobación y cierre

El usuario aprobó requirements.md y este plan, incluidas las ampliaciones del modelo y las políticas operativas, mediante «Vamos procede». La aplicación fue incremental y exclusivamente local. Se conservan los documentos como trazabilidad de decisiones; las secciones anteriores describen el plan aprobado.

Decisiones concretas de implementación:

- Nueva migración `20261017220427_internal_appointments.sql`; no se editaron las cuatro migraciones anteriores.
- Validación privada de toda la cita tras escribir items/asignaciones dentro de la misma transacción, con rollback ante fallo; control version en edición, estados y notas.
- Funciones laborales actualizadas por esta migración y triggers que comparten mutex930003 y validan configuración contra citas vigentes. Reducciones/bloqueos incompatibles se revierten con identificación de cita afectada.
- Se mantiene employee_availability laboral; appointment_availability combina reservas y bloqueos. Ninguna consulta crea por sí sola una reserva.
- FullCalendar7 admite la zona Lima con la dependencia temporal-polyfill ya instalada. Se utiliza también para conversiones de fecha/hora sin zona del navegador. La vista muestra07–24 para incluir finales después18, sin cambiar reglas de atención.
- Eventos por etapa, texto DOM seguro y protección frente a recargas repetidas del mismo rango. Formularios conservan datos ante error y descartan respuestas antiguas.
- Sin transporte automático, pagos, autorreserva, seguimiento real por etapa o auditoría de versiones anteriores. Las filas actuales conservan la cancelación y los snapshots; no hay borrado físico API.

Resultados y límites en [validation.md](validation.md). El despliegue remoto no forma parte de esta aprobación.

## Restitución del estilo de plantilla — 2026-10-18

Autorizada expresamente por el usuario tras la explicación de la diferencia visual. Extraer una configuración de apariencia local a la carpeta agenda usando las clases/vistas de CalenderComponent como referencia, sin modificar la demostración. Recuperar las vistas mes/año con los plugins ya instalados; cabecera Angular con navegación, título, acción por permiso y selector de vista accesible. Mantener carga por rango con protección contra recargas repetidas y el contrato de eventos por asignación.

Representar eventos con las tarjetas y colores de plantilla mediante nodos DOM/textContent: nunca interpolar nombres en HTML. Acomodar los filtros y textos de ayuda a los componentes y tokens existentes. Conservar íntegro el formulario de reservas y los límites laborales; al seleccionar un día mensual/anual usar inicio07:00 local como sugerencia, que el servidor vuelve a validar. Mantener arrastre/resize deshabilitados.

Sin impacto en las cuatro tablas de Pandas11.sql ni necesidad de cambios SQL, servicios, dependencias o RLS. Verificar TypeScript, build y pruebas Angular existentes; adaptar la prueba con FullCalendar real para recorrer las vistas recuperadas, abrir etapas y verificar seguridad de texto y final después18. Documentar límites visuales sin presentar comprobaciones de componente como E2E real con Supabase.
