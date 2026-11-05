# Corrección de razas y modalidad de transporte

Estado: corrección solicitada el 2026-11-05 tras revisión de los tres commits del 2026-11-04.

## Requisitos y aceptación

- CR-01 (RN-11, RN-12): las cotizaciones y la agenda usan UUID de raza. Se conservan precio y duración de reglas generales o por tamaño; las reglas antiguas solo por pelaje permanecen almacenadas para conciliación, sin asignarlas arbitrariamente a razas.
- CR-02 (RN-11): mascotas con raza de texto reciben la FK UUID correspondiente sin perder el texto histórico. La búsqueda devuelve nombre de raza para las fichas.
- CR-03 (RN-06): una base ya migrada recibe `pickup_type`; `requires_pickup=true` se traduce a `PICKUP_ONLY`, y `false` a `NONE`. No se asigna automáticamente personal, tiempo o tarifa de transporte.
- CR-04 (RN-11, RN-12): las opciones Angular y pruebas usan UUID reales de raza; CLIENT activo consulta razas, y solo roles con `service_prices.manage` las administran.
- CR-05: migraciones locales, pruebas SQL/API/Angular, compilación y documentación verifican la corrección. No hay despliegue remoto.

## Discrepancia del modelo

`Pandas11.sql` describe el modelo final sin columnas de pelaje ni texto libre. Las migraciones correctivas conservan `pets.breed`, `pets.pet_coat_type`, `service_prices.pet_coat_type` y, donde exista, `appointments.requires_pickup`. Es una transición para no destruir datos históricos. Su retiro requiere conciliación comercial y una migración posterior aprobada.

**Aclaración posterior:** el usuario confirmó que las tarifas por pelaje procedían de una interpretación errónea y solicitó retirarlas. Se conserva el texto histórico de raza y, donde exista, el indicador anterior de recojo. El estado actual y la migración de limpieza se documentan en [el nuevo requisito](../seed-catalogo-ocho-servicios/requirements.md).
