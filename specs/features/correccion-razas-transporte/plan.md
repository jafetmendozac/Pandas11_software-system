# Plan técnico — corrección de razas y transporte

Estado: reparación de los defectos señalados y solicitada por el usuario el 2026-11-05.

1. Mantener las migraciones históricas y agregar migraciones incrementales para instalaciones existentes. Crear `pet_breeds`, mapear `pets.breed` por nombre normalizado a UUID y conservar los campos anteriores.
2. Actualizar la cotización y la agenda a `pet_breed_id`/`breed_id`; retirar la firma RPC antigua para evitar ambigüedad. Conservar reglas antiguas por pelaje para revisión, excluyéndolas de la nueva cotización.
3. Agregar `pickup_type` a instalaciones anteriores y traducir el indicador histórico sin eliminarlo.
4. Mantener las opciones UUID del trabajo local pendiente del usuario; corregir carga, paginación y nombres visibles en las fichas.
5. Actualizar pruebas SQL/API, fixtures y guía local; aplicar solo a Supabase local, probar RLS, tipos, Angular y build. No ejecutar SQL raíz, reset ni cambios remotos.
