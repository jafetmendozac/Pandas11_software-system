# Desparasitación en la ficha de mascotas — plan técnico propuesto

Estado: aprobado por el usuario el 2026-11-13 con eliminación de vacunas. La aplicación de la migración destructiva local exige comprobar previamente el contenido de `pet_vaccinations`.

## Contraste de modelo

`Pandas11.sql` modela `pets` y `pet_vaccinations`; no contiene una tabla de antecedentes de desparasitación. La migración local `20261017201505_clients_pets.sql` instala vacunas, `vaccinations.read/manage` y políticas de RLS. El servicio Angular y la vista propia consumen esa tabla. La migración histórica presenta además columnas de `pets` que difieren del SQL raíz actual; esta tarea no conciliará esas columnas. No se ha comprobado el esquema remoto.

## Pasos tras aprobación

1. Crear migración incremental local para `pet_dewormings` con `id`, `pet_id`, `treatment`, `applied_on`, `next_due_on` y `created_at`; FK a `pets`, índice por mascota, nombre no vacío y fecha próxima coherente. Añadir permisos `dewormings.read/manage`, grants de columnas y RLS con la misma matriz de propiedad y archivo usada para vacunas. Retirar `pet_vaccinations` y `vaccinations.read/manage` en la misma migración, tras preflight local. No modificar la migración histórica ni ejecutar el SQL raíz como migración.
2. Actualizar `Pandas11.sql` y el diccionario de datos: sustituir la tabla de vacunas por desparasitaciones. Mantener modelo y migración coherentes.
3. Sustituir en `RecordsService` y `RecordDetailsComponent` el flujo visible de vacunas por el de desparasitaciones, con tipos y validación de campos. Conservar notas internas y observaciones del cliente. Ajustar `/mis-datos` para consulta propia de desparasitaciones.
4. Cambiar los textos de la ficha de mascota y de la vista propia; revisar documentos vigentes que describen vacunas como funcionalidad operativa. Actualizar seed y pruebas que dependen de `pet_vaccinations`. No convertir registros de vacunas ni crear vínculos automáticos con citas/ventas/inventario.
5. Añadir pruebas SQL/API de estructura, RLS, aislamiento entre clientes, archivo y fechas; pruebas Angular de guardado, errores y lectura propia. Ejecutar build, pruebas pertinentes y revisión de regresiones. Registrar resultados en `validation.md`.

## Límite de aplicación

Aplicar migraciones solo al entorno Supabase local autorizado, sin reset ni cambios de producción/remotos. Antes del `DROP TABLE`, contar y caracterizar las filas de vacunas; si hay datos distintos de los fixtures DEMO conocidos, detener la aplicación y presentar la discrepancia. Preservar los cambios pendientes del usuario en la agenda.
