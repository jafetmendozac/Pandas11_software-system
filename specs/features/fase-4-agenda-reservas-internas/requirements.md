# Fase 4 — Agenda y reservas internas

Fecha: 2026-10-17 (America/Lima). Estado: plan y ampliaciones aprobados por el usuario («Vamos procede»); implementación local completada. Evidencia en validation.md.

## Objetivo

Recepción registra, consulta, reprograma, cambia estados y cancela citas internas, asociando mascotas, servicios y trabajadores. El servidor debe impedir reservas incompatibles incluso ante solicitudes concurrentes. Se mantienen la arquitectura existente y Pandas11.sql como modelo de referencia, con las ampliaciones justificadas en plan.md.

## Hechos comprobados

- Existen AppointmentsService y CalendarioComponent, ruta `/calendario`; `/calendar` es otra pantalla de demostración.
- Angular usa appointment_date/start_time/end_time, pet_id y employee_id en cabecera, appointment_services y estados en minúsculas. El modelo usa starts_at/ends_at, appointment_items, appointment_item_staff y appointment_status en mayúsculas. El empleado actual se selecciona desde profiles, no desde employees.
- Alta/edición actual escribe cabecera y servicios en varias peticiones; remove elimina físicamente. No integra tarifas por mascota, habilidad, turnos, bloqueos ni ocupación transaccional. El calendario corta la vista a18 y construye horas con la zona del navegador.
- appointment_item_staff solo tiene `(item_id, employee_id)` como PK: no representa cuándo trabaja una persona ni permite dos etapas del mismo item con el mismo empleado.
- Hay cuatro migraciones versionadas de Fases 0–3; no hay migración de estas cuatro tablas. Esto no acredita su ausencia en una base remota, que no se ha consultado.
- Fase 3 consulta turnos menos bloqueos y devuelve occupancy_verified=false. Sus RPC de horarios toman un mutex; las de bloqueos no comparten todavía un protocolo con citas.

## Decisiones confirmadas por el usuario en esta sesión

1. Solo OWNER/ADMIN crean, reprograman, cambian estados y cancelan; STAFF consulta.
2. Incluir ahora etapas y relevo de baño a corte. Recepción define los minutos de cada etapa, respetando la duración total configurada del servicio.
3. Una cita puede incluir varias mascotas del mismo cliente, según disponibilidad real de los trabajadores. No fijar dos mascotas como máximo por cita.

Después de estas respuestas, el usuario autorizó el plan completo mediante «Vamos procede», incluidas las propuestas operativas y ampliaciones del modelo.

## Reglas aplicables

| Regla | Aplicación |
|---|---|
| RN-01 | America/Lima, lunes–sábado incluidos feriados, domingo cerrado, último inicio17 y fin posterior a18 solo con turno que lo cubra |
| RN-03, RN-14 | Una persona atiende un perro a la vez; varias mascotas por cita, sin máximo arbitrario independiente de trabajadores disponibles |
| RN-04, RN-05, RN-11, RN-12 | Precio/duración por mascota usando tarifa vigente de Fase 2; snapshots completos y decimales exactos. No inventar duraciones por tamaño |
| RN-06 | Recojos ocupan al empleado a través de bloqueos manuales existentes. Su generación/cotización automática no entra en esta propuesta |
| RN-07, RN-10, RN-15 | Asistente solo baño; corte requiere ALL_SERVICES. Etapas con tiempos explícitos y validación del relevo |
| RN-09 | Cita creada por personal: INTERNAL, sin adelanto obligatorio, tenga o no cuenta el cliente; cobro al finalizar, fuera del módulo de pagos en esta fase |
| RN-13 | OWNER/ADMIN gestionan, STAFF consulta; CLIENT/anon no acceden a esta agenda interna |

RN-02/RN-08 no autorizan implementar cobros, autorreserva online ni verificación de adelantos aquí.

## Contrato operativo aprobado

### Cita, servicios y etapas

Una cita corresponde a un cliente fijo. Sus mascotas deben pertenecerle y estar activas/no retiradas al crear o sustituir servicios. Cada item corresponde a una mascota y un servicio. Se usan items distintos por combinación mascota/servicio, evitando duplicados accidentales.

Modalidad simple: un tramo SERVICE para un trabajador cualificado por todo el item. Modalidad con relevo: BATH seguido de CUT, minutos enteros positivos, sin hueco ni solapamiento entre ambas etapas, suma igual a la duración cotizada. El mismo empleado puede hacer ambas etapas. Recepción elige explícitamente cuándo el servicio es baño+corte; no se infiere por el nombre del catálogo ni se inventa un reparto de minutos. requires_specialist obliga a un tramo cualificado, y un payload no puede convertir todo un corte en baño para asignarlo a un asistente.

Los servicios de una misma mascota son consecutivos, sin atención simultánea a la misma mascota por dos personas. Mascotas distintas pueden avanzar en paralelo con distintos trabajadores. La cabecera abarca el primer inicio y último fin de sus items; el total es la suma de precios de items, sin duplicarlo por trabajador/etapa.

Regla adoptada para RN-01: cada mascota inicia su primera atención hasta17 dentro del horario comercial; etapas y servicios consecutivos de esa atención pueden empezar más tarde. Todo tramo debe tener cobertura laboral completa, incluidos fines después de18. No aplicar la prohibición de nuevo inicio después de17 a una etapa de corte que continúa un baño iniciado a17. Sin cruces de medianoche en esta fase.

Para tiempo, empleado o estado, conservar snapshots ya aceptados. Agregar/sustituir mascota/servicio requiere cotizar explícitamente esos items en servidor; no recalcular silenciosamente items intactos, incluso si luego cambian tarifas o datos de mascota. Sin descuentos ni overrides de precio/duración total en esta fase.

### Estados aprobados

Altas internas directamente CONFIRMED, source INTERNAL, deposit_required=0 y hold_expires_at=NULL. No se crean pagos ni se afirma que ya se haya cobrado.

| Estado actual | Operaciones admitidas |
|---|---|
| CONFIRMED | Editar/reprogramar; pasar a IN_PROGRESS, CANCELLED o NO_SHOW |
| IN_PROGRESS | Pasar a COMPLETED; cambios de agenda/cancelación durante atención requieren otra decisión |
| COMPLETED, CANCELLED, NO_SHOW | Consulta; sin reapertura ni edición de horarios/items |
| REQUESTED, PENDING | Reservados en el enum para otro flujo; no se admiten desde la API interna de esta fase |

IN_PROGRESS y NO_SHOW solo una vez llegado el inicio programado, según reloj del servidor. COMPLETED requiere IN_PROGRESS. CONFIRMED/IN_PROGRESS reservan sus tramos; COMPLETED conserva ocupación en sus intervalos registrados hasta el fin previsto y en consultas históricas. CANCELLED/NO_SHOW liberan capacidad sin borrar registros. Sin creación o reprogramación a un inicio pasado; cancelación de CONFIRMED requiere motivo y registra actor/fecha de servidor. No imponer multas, plazos de cancelación ni reembolsos no acordados.

La ocupación se basa en los intervalos programados. Retrasos que extiendan la atención deben representarse con bloqueos adicionales y resolver primero reservas incompatibles; no se prolongan tiempos ni se cancelan otras citas automáticamente. La ejecución real por etapa y la política completa de demoras requieren otra decisión: el estado IN_PROGRESS de una cita con varios trabajadores no identifica por sí solo cuál sigue trabajando en cada etapa. No inventar una ocupación indefinida por ese estado.

### Ocupación y cambios del calendario laboral

Comprobar trabajador y perfil activos, habilidad, turnos, local, bloqueos y otras citas en servidor. Impedir también que la misma mascota tenga dos atenciones simultáneas, aunque se elijan trabajadores distintos. Intervalos [inicio, fin): consecutivos permitidos.

Crear/reprogramar/cancelar y cambiar horarios/bloqueos deben seguir un protocolo común de concurrencia. Se rechaza un bloqueo o reducción de turno/horario que invalide citas CONFIRMED/IN_PROGRESS; mostrar cuáles necesitan reprogramación/cancelación, sin modificar esas citas automáticamente. La desactivación de cuenta por seguridad conserva prioridad: no se impide en identidad, pero se señalan citas afectadas y se exige reasignación antes de atender. La consulta es informativa; el guardado vuelve a validar y es la autoridad final.

### Recojo y separación de información

Alcance adoptado: esta API interna crea citas sin recojo automático (`requires_pickup=false`, pickup_fee=0, dirección vacía). Los campos del modelo se conservan para otra fase. Si hay un recojo operativo, recepción bloquea manualmente al trabajador durante el traslado y esta fase respeta ese bloqueo. No presentar una cita como recojo gestionado si falta ese registro. Habilitar solicitud/asignación/precio de transporte enlazados exige ampliar el plan.

client_notes e items.notes se tratan como información de la ficha de cita potencialmente comunicable al cliente, sin prometer publicación aquí. Las observaciones reservadas van exclusivamente a appointment_internal, con permisos propios y sin incluirlas en eventos/títulos del calendario. Su edición es independiente de horarios/items congelados por un estado terminal y mantiene control de versión. No se implementa un historial clínico ni auditoría de todas las revisiones.

## Matriz de permisos aprobada

| Actor | Citas/items/asignaciones y disponibilidad para agenda | Crear/reprogramar/estados/cancelar | appointment_internal |
|---|---|---|---|
| OWNER/ADMIN | Sí | Sí | Leer/escribir |
| STAFF | Sí | No | Leer, siguiendo el acceso operativo interno actual; sin editar |
| CLIENT/anon/inactivo | No | No | No |

Permisos independientes de dominio: appointments.read/manage/status/cancel y appointment_internal.read/manage. Conservar internal.read/manage de clientes/mascotas sin ampliarlos implícitamente a citas. Cambiar esta matriz requiere otro acuerdo explícito.

## Criterios de aceptación

| ID | Resultado verificable |
|---|---|
| F4-01 | Migración incremental CLI de las cuatro tablas/enums y ampliaciones aprobadas, FKs compuestas, defaults/constraints/índices, RLS y modelo coherentes; sin reset ni pérdida de datos previos |
| F4-02 | OWNER/ADMIN gestionan una cita INTERNAL con uno o varios perros del mismo cliente y servicios; perfiles/mascotas/servicios inválidos rechazados; STAFF consulta sin escrituras por UI, REST o RPC |
| F4-03 | Alta y edición de cabecera/items/asignaciones son atómicas: un fallo en cualquier elemento revierte toda la operación; cancelación conserva detalle/historial |
| F4-04 | Cotización por tamaño/pelaje en servidor, snapshots y total numeric exactos; no confiar importes/minutos/status/source/autor del payload; precio se cobra una vez por item y no por etapa |
| F4-05 | Etapas explícitas permiten asistente en baño y especialista en corte, incluso mismo empleado en ambas; suma de minutos válida, orden y cobertura continua; sin fases ficticias ni solapamientos de mascota |
| F4-06 | Sin dobles reservas por trabajador o mascota ante dos peticiones concurrentes, incluso reprogramaciones; turno, actividad, habilidad y bloqueos se revalidan al persistir. Dos perros con trabajadores distintos sí pueden coexistir |
| F4-07 | America/Lima independiente del navegador, feriados válidos, domingo inválido, último inicio17, continuación después de17 y fin posterior a18 según turno explícito; respetar tramos partidos y límites adyacentes |
| F4-08 | Transiciones y campos de cancelación solo en servidor, motivo obligatorio, NO_SHOW/CANCELLED liberan según reglas aprobadas, estados terminales no se reabren y no existe borrado físico API |
| F4-09 | Nuevos bloqueos/reducciones laborales y citas compiten bajo protocolo común; una cita vigente no queda invalidada silenciosamente. Desactivación de cuenta se refleja como impedimento antes de atención |
| F4-10 | Notas internas aisladas de lecturas ordinarias/eventos y denegadas al cliente; autor/timestamps de servidor y matriz independiente comprobados |
| F4-11 | Agenda por rango visible con paginación completa, selección de opciones no truncada a1000, carga/error/respuesta obsoleta y guardado confirmado conservando formulario. Conflictos devueltos de forma comprensible; edición desactualizada rechazada |
| F4-12 | Calendario muestra todas las citas incluidas prolongaciones después de18; títulos sin inyección HTML; ruta/menú anidado/acciones por permisos; no altera `/calendar` de demostración |
| F4-13 | SQL/API concurrentes, Angular, regresión Fases 0–3, lint, tipos y build correctos con fixtures propios; documentar resultados y límites sin declarar remoto validado |

## Límites y datos desconocidos

Esquema remoto, posibles citas heredadas y su transformación; tiempos comerciales concretos por tamaño; incidencias de retrasos, huecos entre etapas, cancelación durante atención, transporte enlazado, portal online y pagos. No inventar ni importar esos datos.

Las decisiones iniciales y el plan fueron aprobados. Se implementan estados/cancelación, continuidad de etapas, primer inicio por mascota, snapshots, notas internas, rechazo de cambios laborales conflictivos y alcance manual del recojo. Esperas entre etapas y cancelación durante atención quedan fuera del contrato aprobado. Ver [plan.md](plan.md) y [validation.md](validation.md).
