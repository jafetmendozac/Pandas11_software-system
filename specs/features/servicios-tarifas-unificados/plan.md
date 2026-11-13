# Plan técnico — Servicios y tarifas unificados

Estado: aprobado el 2026-11-13.

1. Crear una migración incremental que se detenga si encuentra tarifas por raza, migre una eventual regla general a los valores base del servicio, retire reglas generales y `pet_breed_id`, exija `pet_size`, y establezca unicidad `(service_id, pet_size)`.
2. Sustituir la cotización por el contrato `quote_service(service_id, size)` con fuentes `SIZE` o `BASE`. Mantener temporalmente una firma SQL interna de tres argumentos que ignore raza para la función histórica de guardado de citas; no concederla a clientes API.
3. Actualizar `Pandas11.sql`, RN-11/RN-12, servicios Angular, scripts y pruebas. No ejecutar el SQL raíz ni modificar migraciones históricas.
4. Incorporar a `ServiciosComponent` un editor de tarifas por tamaño, el simulador y las acciones según permisos. Conservar el formulario existente de servicio y reutilizar `ModalComponent`, tokens y controles instalados.
5. Retirar raza del simulador y catálogo propio; cotizar la agenda con tamaño. Mantener la raza en mascotas y en `/razas`.
6. Retirar «Tarifas» del sidebar y convertir `/tarifas` en redirección. No borrar archivos históricos sin autorización; dejar el componente anterior fuera del recorrido.
7. Aplicar la migración únicamente a Supabase local, sin reset. Validar RLS, cotización, agenda, seed, pruebas Angular, suite SQL, tipos, build y diff.

## Riesgos y protección

La eliminación de una dimensión puede producir colisiones si otro entorno contiene varias tarifas del mismo servicio/tamaño diferenciadas por raza. La migración se detiene ante cualquier fila con raza para evitar elegir o borrar precios silenciosamente. No se despliega a remoto. Las citas existentes conservan precio y duración almacenados.
