# Ajuste del fin previsto de una cita

Decisión del usuario: la cita puede acortarse o alargarse según la atención que requiera el perro. Se ajusta únicamente el fin previsto; no se registra un fin real.

## Requisitos y aceptación

- AFP-01 (RN-04, RN-05, RN-12, RN-15): OWNER/ADMIN pueden cambiar la hora prevista de término de una cita interna de una mascota, conservando el inicio, los servicios, sus precios y la duración cotizada como referencia. El ajuste modifica los minutos planificados de la última etapa del último servicio; deben seguir siendo enteros positivos. Si hay baño y corte, no altera el inicio ni los minutos de las etapas anteriores.
- AFP-02 (RN-01, RN-03, RN-13): el nuevo intervalo exige cobertura laboral explícita del trabajador, habilidad válida, mismo día local y ausencia de solapamientos con otras citas o bloqueos. El servidor revalida al guardar bajo el protocolo de concurrencia de agenda. Si falla, la cita conserva su horario anterior y se muestra el motivo.
- AFP-03 (RN-13, RN-14): STAFF solo consulta. Citas históricas con varias mascotas permanecen de consulta. Las citas canceladas o atendidas no cambian sus intervalos.
- AFP-04 (RN-06): la agenda y la ficha muestran el nuevo fin previsto luego de persistir. El ajuste no altera automáticamente otra cita, un turno o un bloqueo. No se representa como fin real.
- AFP-05 (RN-09, RN-18): precio, total y cobro al finalizar permanecen iguales.
- AFP-06 (RN-01, RN-03, RN-04, RN-05, RN-12, RN-13, RN-15): al crear una cita, OWNER/ADMIN pueden elegir una hora prevista de término distinta de la calculada. La pantalla muestra la duración prevista resultante y conserva la duración cotizada como referencia. El servidor valida directamente el intervalo elegido y crea la cita de forma atómica; si lo rechaza, no persiste ninguna reserva y el formulario conserva los datos.

## Criterios aprobados

- Se puede ajustar una cita CONFIRMED cuyo inicio programado ya pasó mediante una operación específica, siempre que el nuevo fin sea posterior al reloj del servidor.
- No se exige motivo; el modelo actual no registra un historial de cada modificación.
