# Validación — Agenda conectada a horarios configurables

Estado: implementación pendiente de aprobación.

| Criterio | Estado | Evidencia |
|---|---|---|
| AHC-A01 | Pendiente | SQL/API con local y turno hasta 23:50 |
| AHC-A02 | Pendiente | Rechazo por turno personal insuficiente |
| AHC-A03 | Pendiente | Rechazo por horario comercial insuficiente |
| AHC-A04 | Pendiente | Búsqueda de límites fijos y pruebas Angular |
| AHC-A05 | Pendiente | Comparación disponibilidad/guardado |
| AHC-A06 | Pendiente | Suites, tipos, build, lint, seed y diff |

## Evidencia previa

La consulta local del viernes devolvió horario comercial 07:00–23:50 y turnos personales con finales 19:00 y 18:00. El caso 22:48–23:48 no está cubierto por ningún trabajador observado, incluso después de retirar los límites fijos.

No se inspeccionó ni modificó el esquema remoto.
