# Desarrollo local de identidad

Instancia independiente: `Pandas11-identity-dev`, API 55321, PostgreSQL 55322, Studio 55323 y correo local 55324. No usa datos remotos. Requiere Supabase CLI y Docker activos.

```sh
supabase start
npm run start:local
```

`start:local` genera un archivo ignorado `environment.local.ts` con URL y clave pública locales. No modifica los entornos existentes ni imprime secretos. El registro exige confirmar correo en el buzón local. Un CLIENT puede usar `/mi-perfil`; no entra al panel.

## Primer owner

Registrar y confirmar un usuario sintético en Angular local. En SQL Editor de Studio local, como postgres, asignar OWNER al UUID de ese usuario:

```sql
insert into public.user_roles(user_id, role_id)
select '<UUID_DEL_USUARIO_LOCAL>'::uuid, id from public.roles where code = 'OWNER';
```

No usar cuentas reales. El owner puede asignar ADMIN/STAFF/CLIENT a usuarios registrados desde Configuración → Roles y permisos. No hay invitaciones por correo implementadas. La API no permite crear, retirar o desactivar owners ni modificar roles/permisos de sistema: su rotación requiere administración privilegiada. Esta restricción protege también al último owner ante solicitudes concurrentes. Se pueden administrar roles personalizados y sus permisos.

## Validación

```sh
supabase db lint --local
supabase test db
node scripts/test-identity-api.mjs
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

El script API rechaza URLs distintas a la instancia 55321, utiliza secretos exclusivamente en el proceso Node de pruebas y limpia los UUIDs sintéticos que crea. Nunca se importa en Angular. La verificación de correo en ese test usa un enlace generado por Auth Admin; la entrega real al buzón requiere revisión manual.

`supabase db reset --local` BORRA la base local: usar solo con esta instancia desechable y tras preservar cualquier dato de interés. No ejecutar `link`, `db push` o reset remoto como parte de esta fase.

## Modelo y límites

La migración extrae las cinco tablas de Pandas11.sql y añade políticas, funciones y catálogo. Después de Fase 1 también instala clientes, mascotas, vacunas y notas internas. Las demás tablas del negocio siguen pendientes. `panel.access` habilita el panel; no acredita autorización de datos de citas, clientes o pagos. Esas tablas necesitan RLS por dominio en fases posteriores.

No desplegar estos cambios Angular contra una base remota sin las migraciones y un plan de adopción revisado. Los archivos SQL raíz son referencias de diseño, no comandos de despliegue.

## Si Roles muestra falta de permiso y desaparece el menú

Actualizar el código y recargar la página. La revalidación de permisos no debe vaciar el estado durante la consulta: ese comportamiento desmontaba Roles. Las pruebas ahora pueden ejecutarse con tu cuenta local existente; no requieren reset. Si persiste la denegación con la versión corregida, comprobar la asignación OWNER en esta misma instancia y sesión, sin recrear la base ni conceder permisos para ocultar un error de interfaz.


## Fase 1 — Clientes y mascotas

La migración incremental `20261017201505_clients_pets.sql` añade las cinco tablas del modelo y sus enums, RLS, búsqueda paginada y RPC de escritura/baja lógica. No requiere reset ni elimina cuentas.

OWNER/ADMIN registran y editan; STAFF consulta; CLIENT accede a `/mis-datos` desde su perfil y ve solo la ficha vinculada y sus mascotas. El vínculo a perfil se realiza por personal autorizado, no automáticamente por email. Tras aplicar la migración, recargar la aplicación para obtener los nuevos permisos.

En Clientes → Consultar ficha y mascotas aparecen notas internas del cliente y sus mascotas; seleccionar Ver antecedentes para vacunas y notas de mascota. En Mascotas → Ver antecedentes se consulta la ficha directamente. Consultar archivo conserva antecedentes en modo lectura. Retirar un cliente oculta también sus mascotas al cliente sin borrarlas.

Alergias es un indicador sí/no; detalle reservado en nota interna. Vacunas: registrar y corregir fechas; no se bloquean citas automáticamente por vencimiento. Las notas almacenan la última edición y autor, no un historial clínico. Fotos, documentos adjuntos, traslado y pagos no se implementan aquí.

Prueba API adicional (solo fixtures locales):

```sh
node scripts/test-clients-pets-api.mjs
```
