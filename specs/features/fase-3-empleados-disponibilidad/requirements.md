# Fase 3 — Empleados y disponibilidad

Fecha: 2026-10-17. Estado: plan aprobado por el usuario («Vamos implementala»); implementación local validada.

## Objetivo y alcance

Mantener empleados, turnos semanales, horario de atención y bloqueos. Consultar capacidad laboral por empleado para una fecha/intervalo, respetando actividad, habilidades y bloqueos. Modelo local de referencia: employees, employee_schedules, business_hours y time_blocks en Pandas11.sql; dependencias profiles y skill_level. No asumir esquema remoto.

## Hechos comprobados y límite del resultado

Ya hay CRUD/desactivación de employees en Angular; no se identificó gestión de las otras tres tablas ni migraciones de estas cuatro. Agenda elige empleados desde profiles y conserva contrato de citas incompatible con el modelo local.

Estas cuatro tablas permiten conocer disponibilidad laboral menos bloqueos registrados. No permiten acreditar ausencia de citas/recojos que no se hayan registrado como bloqueos: la ocupación automática requiere integrar agenda y tareas en una fase posterior o ampliar este plan.

La UI debe indicar «Horario habilitado; ocupación de citas/recojos no verificada» al no detectar impedimentos, y no «Disponible para reservar». En esta fase se pueden representar recojos y compromisos mediante bloqueos manuales; no se crean automáticamente ni se reserva una cita.

## Reglas relacionadas y propuesta operativa

- RN-01: lunes–sábado incluidos feriados, atención habitual 07:00–18:00; domingo descanso y último inicio de servicio 17:00. Confirmar zona America/Lima para convertir fechas/horas independientemente del navegador.
- RN-03: hoy trabajan dos personas; una por perro según habilidad. No limitar el catálogo a dos empleados para siempre. La consulta no reserva ni garantiza exclusividad entre solicitantes.
- RN-07: ALL_SERVICES puede bañar/cortar; ASSISTANT solo bañar. Un perfil activo no equivale a empleado; solo empleados activos con perfil activo asociado tienen disponibilidad en esta propuesta.
- RN-06: trabajador que recoge está ocupado durante traslado. Representarlo manualmente mediante time_blocks con reason, sin automatización ni precio de transporte.
- RN-10: relevo baño/corte permitido como regla futura; aquí se consulta cada intervalo/empleado, no se distribuye una cita entre etapas.
- Turnos recurrentes pueden ser partidos. Ausencia de turno u horario de atención implica que no se habilita ese tramo. No inventar turnos personales ni pausa de almuerzo.
- Sembrar únicamente horario comercial confirmado lunes–sábado 07:00–18:00, no horarios de trabajadores ni datos reales.
- Intervalos [inicio, fin): consecutivos no chocan. Turnos de un mismo empleado/día y tramos comerciales de un mismo día no se solapan; bloqueos sí pueden coincidir y se consideran unión, sin doble descuento.
- time_blocks.employee_id NULL significa cierre/bloqueo de todo el local. Bloqueos con inicio/fin absolutos pueden abarcar varios días; motivos visibles solo al personal autorizado. created_by y timestamps de servidor.
- Turnos recurrentes dentro del mismo día, sin cruces de medianoche en esta fase. Domingo no admite turnos/horarios laborales; feriados no cierran automáticamente.
- Finalización después de 18:00: permitida solo si el turno configurado cubre ese tiempo y no hay bloqueo. No prolongar un turno implícitamente ni inferir hasta qué hora acepta trabajar cada empleado. La consulta distingue cobertura laboral completa y admisión de un nuevo inicio de servicio (hasta 17:00 y dentro de tramo comercial).

## Matriz aprobada

Permisos: employees.read/manage, schedules.read/manage, availability.read, time_blocks.read/manage.

| Actor | Lecturas | Escrituras |
|---|---|---|
| OWNER/ADMIN | Empleados, turnos, horario comercial, bloqueos y disponibilidad de todos | Crear/editar/desactivar empleados; mantener turnos, horario comercial y bloqueos |
| STAFF | Consulta operativa de empleados, horarios, bloqueos y disponibilidad | Ninguna por defecto |
| CLIENT/anon/perfil inactivo | Sin acceso a fichas laborales, motivos o consulta por empleado | Ninguna |

No exponer teléfonos o motivos al cliente. Acceso público a huecos para reservar corresponde a integración futura. Crear empleado no asigna roles Auth ni otorga acceso al panel. Decisión aprobada: exigir profile_id activo y único al crear, sin cambiarlo después para preservar historial; sin borrado físico de empleados.

## Criterios de aceptación

- F3-01: cuatro tablas y skill_level en migración incremental, defaults/constraints/FKs/índices alineados con Pandas11.sql; preservar cuentas, catálogos y datos existentes sin reset.
- F3-02: empleados asociados a perfiles activos, nivel de habilidad y desactivación; consulta paginada por nombre/teléfono sin truncar límite API. Empleado o perfil inactivo no habilita horarios.
- F3-03: configurar turnos partidos y horario comercial por día, validar inicio < fin y días permitidos; impedir solapamiento en escritura concurrente, permitir turnos consecutivos.
- F3-04: registrar/editar/quitar bloqueos de empleado o globales con rango obligatorio y motivo; validar pertenencia, autor servidor y gestión por permiso. Eliminar bloqueo no altera otras ausencias/turnos.
- F3-05: RPC autoritativa consulta fecha/intervalo y habilidad requerida; devuelve cobertura laboral, impedimentos (sin turno, cerrado, inactivo, habilidad insuficiente, bloqueo) y límites. No habilitar tramo parcialmente cubierto ni omitir bloqueo que lo atraviese.
- F3-06: inicio de servicio posterior a 17:00 denegado; fin posterior a 18:00 posible con turno extendido explícito. Domingo no habilitado y feriado no implica cierre. Tests independientes de zona del navegador.
- F3-07: ventanas libres descuentan unión de bloqueos personales/globales; sin dobles descuentos. UI declara falta de verificación de ocupación de citas/recojos, sin crear reservas ni prometer capacidad transaccional.
- F3-08: RLS y grants aplican matriz incluso por API directa/RPC; solo servidor autoriza y establece created_by; STAFF no cambia horarios ni se autoasigna habilidad.
- F3-09: interfaz en español, guard/menú/acciones por permisos; guardado confirmado conserva formulario ante error, maneja cargas y respuestas obsoletas sin desmontar vistas.
- F3-10: pruebas SQL/API/Angular de intervalos, roles, concurrencia y regresiones de Fases 0–2; lint, tipos y build; sin cambios remotos.

## Decisiones aprobadas para esta implementación

1. America/Lima y STAFF solo lectura.
2. Perfil activo vinculado, único e inmutable por empleado.
3. Turnos extendidos explícitos para finalizar después de 18:00; sin otra hora límite inventada.
4. Disponibilidad laboral con bloqueos manuales; ocupación automática de citas/recojos pendiente de otra fase.

Aprobación: solicitud de implementación del usuario el 2026-10-17. El esquema remoto y el despliegue continúan fuera del alcance.
