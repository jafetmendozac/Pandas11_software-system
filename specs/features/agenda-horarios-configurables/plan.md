# Plan técnico — Agenda conectada a horarios configurables

Estado: aprobado por el usuario el 2026-11-18 e implementado localmente. El usuario pidió ejecutar solo las pruebas necesarias; la validación registra las pruebas focalizadas realizadas.

## Impacto del modelo

No cambian las tablas de `Pandas11.sql`. Se requiere una migración incremental que reemplace funciones vigentes; no se editan migraciones ya aplicadas ni se ejecuta el SQL raíz.

## Implementación propuesta

1. Crear una migración nueva sobre el esquema local vigente.
2. Sustituir en `private.validate_appointment` el corte fijo de 17:00 por la comprobación de que el primer inicio pertenece a un tramo de `business_hours`. Conservar `private.labor_coverage` para exigir turno, horario comercial, extensiones explícitas después del cierre, bloqueos y día único.
3. Actualizar `employee_availability` y `appointment_availability` para calcular `can_start_service` con los tramos comerciales configurados, sin `LATE_START`. Mantener continuidad, habilidad, ocupación y exclusión controlada de la cita editada.
4. Retirar de `CalendarioComponent.validateNewItem()` los límites 17:00/18:00. Conservar validaciones locales de fecha, hora y trabajador; mostrar que la cobertura real se comprueba con la configuración y nuevamente al guardar.
5. Actualizar textos de agenda y `WorkCalendarComponent`: explicar que deben coincidir “Horario del local” y “Turnos del empleado”; retirar la afirmación de último inicio fijo.
6. Añadir pruebas Angular para un intervalo 22:48–23:48 sin rechazo fijo y para mensajes de configuración.
7. Ampliar pgTAP/API con tres casos: ambos horarios cubren, solo local cubre y solo trabajador cubre. Probar coincidencia entre disponibilidad y guardado.
8. Actualizar RN-01 y documentos de Fases 3/4 conservando el historial de la regla anterior.
9. Aplicar solo a Supabase local, sin reset; ejecutar suites pertinentes, lint, seed, tipos, build y `git diff --check`.

## Protección y límites

- Ampliar el horario del local no amplía automáticamente ningún turno personal.
- Ampliar un turno personal no abre el local.
- El servidor sigue siendo la autoridad y revalida bajo el mutex de agenda.
- No se modifica producción ni se hace commit/push.
