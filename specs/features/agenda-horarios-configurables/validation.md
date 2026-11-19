# Validación — Agenda conectada a horarios configurables

Estado: implementado y validado en Supabase local y Angular el 2026-11-18. No se aplicó en producción.

| Criterio | Estado | Evidencia |
|---|---|---|
| AHC-A01 | Comprobado para 20:10–20:35 | SQL sintético: local y turno hasta 22:00 permiten disponibilidad y crear la cita. El caso 22:48–23:48 sigue la misma regla, pero no se probó por separado. |
| AHC-A02 | Comprobado | Turno hasta 19:00 rechaza 20:10–20:35 en ambas consultas. |
| AHC-A03 | Comprobado | Turno hasta 23:30 y local hasta 22:00 rechazan inicio 22:20 en ambas consultas. |
| AHC-A04 | Comprobado | Retirados los topes 17:00/18:00 del formulario y SQL; 32 pruebas Angular correctas. |
| AHC-A05 | Comprobado para esos casos | Ambas consultas coinciden; el guardado funciona en el caso permitido. |
| AHC-A06 | Comprobación focalizada | SQL transaccional con `ROLLBACK`, 32 pruebas Angular, `ngc`, `tsc`, build de desarrollo y `git diff --check` correctos. Sin lint, seed ni suite completa por la preferencia del usuario de limitar pruebas. |

## Alcance y observaciones

La migración `20261119000000_configurable_appointment_hours.sql` se aplicó solo a Supabase local. La prueba `scripts/test-configurable-appointment-hours.sql` usa datos sintéticos en una transacción que se revierte. La compilación emitió dos avisos NG8113 de importaciones sin uso en componentes ajenos a agenda.

En la configuración local observada, el miércoles el local abre 07:00–22:00, pero el turno de Diego Ramos acaba a las 19:00. La cita de la captura requiere ampliar su turno al menos hasta las 20:35 o elegir otro trabajador que cubra el intervalo.

No se inspeccionó ni modificó el esquema remoto.
