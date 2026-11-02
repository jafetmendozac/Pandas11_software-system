# Plan técnico — consultas del portal de cliente

Estado: alcance funcional aprobado el 2026-11-02; plan concretado para esta implementación local.

1. Sustituir los enlaces superiores crudos de `profile.component.html` por dos tarjetas visibles al inicio para toda cuenta autenticada, incluida la que tiene panel interno. Conservar `/mi-perfil` y navegación del personal.
2. Reemplazar el wrapper de `/mis-datos` por una vista de lectura con `ClientesService.own`, `MascotasService.search` restringida al cliente obtenido y `RecordsService.vaccinations` para antecedentes visibles. Usar señales para carga asíncrona y estados vacíos/errores. No reutilizar controles de edición ni cargar notas internas.
3. Reemplazar el wrapper de `/catalogo` por tarjetas de servicios visibles y un cotizador. Obtener mascotas propias con la misma cadena de consulta; selección de mascota precarga tamaño/pelaje, permitiendo ajuste manual. Conservar `TarifasService.quote` como cálculo autoritativo. Evitar publicar resultados obsoletos tras cambios de selección.
4. Mantener rutas y guards actuales, reutilizar tokens Tailwind y espaciado lógico. Probar estados de enlace/mascotas, cotización y errores con datos sintéticos; ejecutar TypeScript, suite Angular, build y `git diff --check`. Registrar límites en `validation.md`.

No hay cambio de esquema o RLS. `Pandas11.sql` y las migraciones coinciden en las relaciones `profiles` → `clients` → `pets` y `services` → `service_prices` aplicables. No ejecutar migraciones ni conectar a un entorno remoto.

El ajuste de visibilidad de las tarjetas fue solicitado después de que el usuario probara la primera implementación. No amplía el acceso a datos: la ruta de ficha propia mantiene sesión, consulta `profile_id` y RLS.
