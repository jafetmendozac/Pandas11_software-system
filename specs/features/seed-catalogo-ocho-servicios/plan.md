# Plan técnico — ocho servicios y limpieza de pelaje

Estado: aprobado para ejecución mediante la solicitud de rehacer el seed y la confirmación posterior de conservar los servicios ajenos. Requisitos: [requirements.md](requirements.md).

1. Añadir una migración incremental posterior a las de razas: eliminar las reglas `service_prices` con `pet_coat_type` no nulo, retirar esa columna de tarifas y mascotas y el enum cuando no tenga dependencias; reconstruir la unicidad por servicio, tamaño y raza. Reemplazar `quote_service` para que ya no consulte el campo retirado. No ejecutar `Pandas11.sql` ni hacer reset.
2. Actualizar `seed-local.mjs` para crear ocho servicios demo con UUID estables y nombres solicitados, importes y minutos de ejemplo. Los cuatro servicios demo anteriores se archivan tras asegurar sus citas; las tarifas asociadas a esos cuatro servicios se eliminan después de crear los snapshots de citas. Las citas existentes conservan el precio capturado.
3. Adaptar el seed comercial y sus verificaciones para que las nuevas citas sintéticas usen el servicio demo de «Baño estético». Una ejecución previa con cita comercial histórica conservará su referencia antigua; el test distinguirá ambos casos.
4. Actualizar `test-local-seed.mjs`, `test-commercial-seed.mjs`, pruebas SQL/API y guías. Repetir el seed local y el comercial sin duplicados; comprobar que no quedan tarifas por pelaje y que las referencias históricas siguen válidas.
5. Aplicar solo a Supabase local tras comprobar el estado de la base. Registrar diferencias y resultados en `validation.md`. No tocar producción, cuentas no demo, otros módulos ni dependencias.

**Decisión de alcance:** «Servicio Duplex» y «Servicio Express» permanecen con sus dos tarifas; no pertenecen al seed.

**Datos de ejemplo propuestos:** «Baño estético» conserva el importe sintético S/ 25.00 y 30 minutos usados por el flujo comercial demo. Los otros siete tienen S/ 0.00; sus duraciones son 60/60/60/90/30/30/15 minutos en el orden de la lista. Son fixtures técnicos, no tarifas ni tiempos comerciales confirmados.
