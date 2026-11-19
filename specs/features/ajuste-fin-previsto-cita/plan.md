# Plan propuesto — ajuste del fin previsto

Estado: aprobado por el usuario e implementado en Supabase local y Angular. No desplegado de forma remota.

## Diagnóstico comprobado

`appointment_items.duration_minutes` conserva la duración cotizada, y `private.validate_appointment` exige que la suma de etapas coincida exactamente con ella. `appointment.models.ts` repite esa igualdad. `save_internal_appointment` solo edita CONFIRMED, reescribe las etapas y rechaza un inicio anterior al reloj actual. `appointments.ends_at` se deriva del máximo fin de etapa. Las restricciones y RLS de las tablas impiden resolverlo cambiando solo un campo Angular. `Pandas11.sql` y la migración local muestran el mismo modelo de duración/etapas; no se ha comprobado el esquema remoto.

## Implementación propuesta

1. Añadir una migración incremental con `planned_duration_minutes` opcional: NULL significa duración cotizada; un valor positivo representa la duración planificada ajustada, manteniendo el snapshot y precio. Ajustar la validación para comparar la suma de etapas con la duración prevista o, si no hubo ajuste, con la cotizada. La RPC específica cambia solo la última etapa del último servicio, sin huecos ni cambios en etapas anteriores. Conservar la cobertura y comprobación de conflictos del servidor.
2. Crear una RPC específica y versionada para cambiar solo el fin previsto de una cita INTERNAL/CONFIRMED de una mascota. Reutilizar permiso `appointments.manage`, mutex de agenda y validación completa, y actualizar `appointments.ends_at`, versión y `updated_at` de forma atómica. No exponer escritura directa de tablas. Permitir inicio pasado solo si el nuevo fin es futuro.
3. Actualizar modelos y servicio Angular; en la ficha de cita, presentar la hora prevista editable con selector de hora, la duración cotizada como referencia y un botón «Actualizar fin previsto». Mostrar error de disponibilidad junto al control y refrescar agenda/ficha al guardar.
4. Actualizar `Pandas11.sql`, reglas/specs afectadas y validación de la funcionalidad una vez aprobada e implementada la migración. No ejecutar cambios remotos ni alterar pagos.
5. Pruebas puntuales: ajuste más corto y más largo; rechazo por cruce/turno/permisos/versión; conservación de precio y etapas previas; compilación Angular y prueba focalizada de la ficha. No ampliar suites sin un riesgo concreto.

## Ampliación aprobada: hora prevista al crear

La captura del usuario mostró que faltaba el control en «Crear cita». Se aprobó añadirlo junto al horario calculado. El formulario usa la cotización como valor inicial; si se elige otra hora, modifica únicamente los minutos planificados de la última etapa en el payload, conservando precio y duración cotizada. La RPC de creación valida ese intervalo directamente y revierte todo si hay conflicto. Una migración posterior corrigió el primer enfoque, que intentaba reservar inicialmente todo el tiempo cotizado y podía rechazar un acortamiento válido. Las pruebas focalizadas comprueban este caso, el rechazo atómico y el flujo Angular.

## Riesgos y límites

Un aumento puede ocupar tiempo asignado a otra mascota o exceder el turno. Una reducción no debe borrar la duración cotizada original. La marca `COMPLETED` no equivale a hora real de fin; esta propuesta no añade ese dato. No hay evidencia del esquema desplegado fuera del entorno local.
