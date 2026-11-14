# Agenda conectada a horarios configurables

Fecha: 2026-11-13 (America/Lima). Estado: propuesta pendiente de aprobación.

## Objetivo

Eliminar los límites fijos de 17:00/18:00 en la creación de citas y usar como autoridad la configuración vigente de “Horario del local”, el turno del trabajador, sus bloqueos y la ocupación de agenda.

## Diagnóstico comprobado

- `CalendarioComponent.validateNewItem()` rechaza inicios posteriores a las 18:00 y aplica una validación especial desde las 17:00.
- PostgreSQL conserva un corte fijo de inicio a las 17:00 en `private.validate_appointment`, `employee_availability` y `appointment_availability`.
- La pantalla de horarios todavía anuncia “Último inicio: 17:00”.
- En Supabase local, el viernes del local está configurado 07:00–23:50, pero los turnos personales del viernes observados terminan a las 19:00 y 18:00.
- Una cita 22:48–23:48 debe requerir simultáneamente un tramo comercial que incluya el inicio y un turno del trabajador que cubra el intervalo completo. Cambiar solo uno de ambos no habilita la cita.

## Requisitos

- AHC-01: no existe una hora fija universal de último inicio en Angular ni PostgreSQL. La primera atención puede comenzar mientras su inicio pertenezca a un tramo comercial configurado para ese día.
- AHC-02: cada etapa completa debe quedar cubierta por el turno del trabajador y no intersectar bloqueos ni reservas ocupadas.
- AHC-03: el horario del local y el turno personal son condiciones acumulativas. La UI debe explicarlo antes de guardar y en la pantalla de configuración.
- AHC-04: se conserva el comportamiento aprobado de continuidad: una atención iniciada dentro del horario comercial puede terminar después del cierre únicamente si el turno explícito del trabajador cubre el final y no cruza de día.
- AHC-05: domingo continúa sin atención porque la gestión de horarios no admite tramos dominicales; lunes a sábado y feriados dependen de los tramos configurados.
- AHC-06: `appointment_availability` y el guardado usan la misma interpretación. La consulta sigue siendo orientativa; el guardado revalida bajo mutex.
- AHC-07: cambiar horarios continúa rechazándose si invalida una cita vigente.
- AHC-08: no cambian permisos, tablas, pagos, tarifas ni reglas de una mascota por cita.

## Reglas relacionadas

- RN-01 se actualizaría: horario configurable de lunes a sábado, sin corte fijo 17:00/18:00; inicio dentro del horario comercial y cobertura completa del turno.
- RN-03/RN-07: trabajador libre y habilitado.
- RN-10/RN-15: continuaciones y relevos mantienen cobertura por etapa.
- RN-14: una mascota por cita.

## Criterios de aceptación

- AHC-A01: con local y trabajador configurados el viernes hasta 23:50, una cita 22:48–23:48 puede validarse y guardarse si no existe conflicto.
- AHC-A02: con local hasta 23:50 pero trabajador hasta 19:00, la misma cita se rechaza indicando falta de turno/cobertura.
- AHC-A03: con trabajador hasta 23:50 pero local cerrado antes de 22:48, se rechaza el inicio fuera del horario comercial.
- AHC-A04: no aparecen mensajes ni validaciones que fijen 17:00, 18:00 o 18:30 como límites universales.
- AHC-A05: consulta de disponibilidad y guardado coinciden para intervalos tardíos, bloqueos, ocupación y habilidad.
- AHC-A06: pruebas SQL/API/Angular, TypeScript, build, lint y seed pertinentes terminan correctamente.

## Fuera de alcance

No permitir cruces de medianoche, abrir domingos, crear turnos personales automáticamente al ampliar el horario del local ni modificar citas existentes.
