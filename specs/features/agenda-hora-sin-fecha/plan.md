# Hora de inicio sin selector de fecha — plan

Cambio exacto solicitado por el usuario en la agenda.

1. Retirar solo el componente de fecha del bloque «Inicio de atención»; conservar el selector de hora y la fecha interna fijada al abrir la cita desde el calendario.
2. Eliminar la importación y el método de cambio de fecha que deja de usar la plantilla; conservar la fecha interna usada al actualizar la hora.
3. Verificar con la prueba focalizada que seleccionar un día y cambiar la hora mantiene ese día, y compilar Angular.
