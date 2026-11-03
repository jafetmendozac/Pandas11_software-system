# Plan técnico — consultas del portal de cliente

Estado: alcance funcional aprobado el 2026-11-02; plan concretado para esta implementación local.

1. Sustituir los enlaces superiores crudos de `profile.component.html` por dos tarjetas visibles al inicio para toda cuenta autenticada, incluida la que tiene panel interno. Conservar `/mi-perfil` y navegación del personal.
2. Reemplazar el wrapper de `/mis-datos` por una vista de lectura con `ClientesService.own`, `MascotasService.search` restringida al cliente obtenido y `RecordsService.vaccinations` para antecedentes visibles. Usar señales para carga asíncrona y estados vacíos/errores. No reutilizar controles de edición ni cargar notas internas.
3. Reemplazar el wrapper de `/catalogo` por tarjetas de servicios visibles y un cotizador. Obtener mascotas propias con la misma cadena de consulta; selección de mascota precarga tamaño/pelaje, permitiendo ajuste manual. Conservar `TarifasService.quote` como cálculo autoritativo. Evitar publicar resultados obsoletos tras cambios de selección.
4. Mantener rutas y guards actuales, reutilizar tokens Tailwind y espaciado lógico. Probar estados de enlace/mascotas, cotización y errores con datos sintéticos; ejecutar TypeScript, suite Angular, build y `git diff --check`. Registrar límites en `validation.md`.

No hay cambio de esquema o RLS. `Pandas11.sql` y las migraciones coinciden en las relaciones `profiles` → `clients` → `pets` y `services` → `service_prices` aplicables. No ejecutar migraciones ni conectar a un entorno remoto.

El ajuste de visibilidad de las tarjetas fue solicitado después de que el usuario probara la primera implementación. No amplía el acceso a datos: la ruta de ficha propia mantiene sesión, consulta `profile_id` y RLS.

## Layout de cliente aprobado — 2026-11-02

El usuario aprobó en conversación la propuesta concreta de encabezado y sidebar para `/mi-perfil`, `/mis-datos` y `/catalogo`, con ancho de lectura controlado y menú móvil, manteniendo el panel de OWNER/ADMIN/STAFF. Crear un `ClientLayoutComponent` que reutilice `AppHeaderComponent`, `AppSidebarComponent` y `BackdropComponent`, con la misma estructura y clases de `AppLayoutComponent`; agrupar las tres rutas bajo `profileGuard`. Dar a los componentes compartidos entradas de ruta inicial, enlace de perfil y modo de menú cliente, sin cambiar las opciones del panel. Retirar la barra de enlaces repetida y el ancho/padding de página que duplican el marco. Conservar `/profile` y su guard en el layout administrativo. Probar rutas, navegación y apertura/cierre móvil; compilar y ejecutar pruebas Angular. No hay cambio SQL ni permisos.

La primera implementación creó un sidebar visual separado. El usuario la rechazó expresamente y pidió usar el sidebar existente. La corrección sustituye ese marcado propio por los componentes compartidos y conserva el filtro de tres rutas para CLIENT.

## Retirar accesos duplicados de Perfil — 2026-11-02

Solicitud explícita posterior del usuario: eliminar el bloque de dos tarjetas al inicio de `profile.component.html`, retirar `RouterLink` si queda sin uso y su prueba obsoleta. Las rutas y el sidebar de cliente siguen disponibles. Actualizar PC-01 y validar compilación, pruebas Angular y diff. No afecta datos, RLS ni esquema.

## Ajuste visual del sidebar existente — 2026-11-02

El reporte con capturas identifica `logo-icon.svg` como icono ajeno al negocio en el estado contraído y la parte inferior del logo del sidebar visible bajo el encabezado móvil. En `AppSidebarComponent` usar el logo cuadrado existente de Pandas 11 para el estado contraído de escritorio; ocultar el bloque de logo del sidebar por debajo de `xl` y desplazar el inicio de sus opciones hasta debajo del encabezado. Conservar el mismo componente, su filtro de rutas y su comportamiento de colapso. Comprobar plantillas, pruebas pertinentes y build; documentar los límites de revisión visual.
