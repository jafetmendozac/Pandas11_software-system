# Hora de inicio sin selector de fecha — requisitos

Solicitud del usuario: retirar «Fecha de la atención» del bloque «Inicio de atención» y conservar «Hora de inicio».

| ID | Criterio de aceptación | Reglas |
|---|---|---|
| AHS-01 | El formulario de cita no muestra un selector de fecha junto a la hora de inicio. El día procede de la selección en el calendario o, al pulsar «Añadir cita +», de la fecha inicial ya calculada por la agenda. | RN-01, RN-03 |
| AHS-02 | Cambiar la hora conserva el día de la cita y recalcula las etapas consecutivas, disponibilidad y fin previsto existentes. | RN-01, RN-03, RN-15 |

No cambia el esquema, las tarifas, los permisos ni la validación del servidor. `Pandas11.sql` y las migraciones existentes se mantienen como referencia.
