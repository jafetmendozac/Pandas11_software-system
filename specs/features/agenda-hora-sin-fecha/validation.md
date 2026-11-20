# Hora de inicio sin selector de fecha — validación

El formulario de agenda ya no muestra «Fecha de la atención». Conserva «Hora de inicio» y mantiene internamente el día seleccionado en el calendario o la fecha inicial de «Añadir cita +».

Prueba focalizada de agenda: **30/30** casos correctos. Incluye selección del día en el calendario, cambio de hora sin alterar ese día y apertura del selector de hora sobre el modal. La compilación Angular terminó correctamente. No se cambió el esquema ni se desplegó a un entorno remoto.
