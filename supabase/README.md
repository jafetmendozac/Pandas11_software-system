# Desarrollo local de identidad

Instancia independiente: `Pandas11-identity-dev`, API 55321, PostgreSQL 55322, Studio 55323 y correo local 55324. No usa datos remotos. Requiere Supabase CLI y Docker activos.

```sh
supabase start
npm run start:local
```

`start:local` genera un archivo ignorado `environment.local.ts` con URL y clave pública locales. No modifica los entornos existentes ni imprime secretos. El registro exige confirmar correo en el buzón local. Un CLIENT puede usar `/mi-perfil`; no entra al panel.

## Seed optativo para probar Fases 0–4

```sh
supabase migration up --local
npm run seed:local
npm run start:local
```

Carga únicamente en la instancia local cuentas confirmadas OWNER/ADMIN/STAFF/CLIENT, clientes/mascotas/vacunas/notas, servicios/tarifas ficticios, empleados/turnos/bloqueos y tres citas con relevo, varias mascotas, fin19 y cancelación. No hace reset ni modifica horarios comerciales existentes. Es aditivo y se puede repetir conservando sus datos; los límites de recuperación están documentados.

Cuentas `demo.fases.owner@example.test`, `demo.fases.admin@example.test`, `demo.fases.staff@example.test` y `demo.fases.client@example.test`. Contraseña inicial pública de demostración: `Pandas11-Demo-2026!`. No son credenciales reales ni deben usarse fuera del entorno local.

Recorrido de prueba, fechas, precios de ejemplo, conservación y verificación: [seed local](../specs/seed-local.md). Comprobar el estado inicial con `node scripts/test-local-seed.mjs`. Las migraciones y el seed automático SQL mantienen la base sin cuentas demo por defecto; esta carga requiere el comando explícito.

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

La migración extrae las cinco tablas de Pandas11.sql y añade políticas, funciones y catálogo. Tras Fases 1–4 también instala clientes, mascotas, vacunas/notas internas, catálogo de servicios/tarifas, las cuatro tablas laborales y las cuatro tablas de citas con RLS por dominio. Fase 5 añade payments; autorreservas, devoluciones y otras ampliaciones siguen pendientes. `panel.access` habilita el panel; cada dominio exige además sus permisos específicos.

No desplegar estos cambios Angular contra una base remota sin las migraciones y un plan de adopción revisado. Los archivos SQL raíz son referencias de diseño, no comandos de despliegue.

## Actividad 4.1 — Base local de ventas

`20261021090000_sales_foundation.sql`, `20261021093000_sales_product_queries.sql` y `20261021100000_sales_role_guard.sql` añaden catálogo simple de artículos por unidad, ventas y detalle con RLS/RPC. OWNER/ADMIN registran y consultan; un permiso delegado a otro rol no basta para acceder. Una venta vinculada importa los servicios de una cita interna completada y consulta sus cobros existentes sin crear pagos nuevos. Los artículos solo pueden permanecer en borrador hasta implementar stock; no hay aún pantalla de ventas ni cobros de mostrador. Validación y límites en [Actividad 4.1](../specs/features/actividad-4-ventas-mixtas/validation.md).

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

## Fase 2 — Servicios y precios

Migración incremental `20261017210343_services_prices.sql`; no requiere reset. OWNER/ADMIN administran Servicios y Tarifas, STAFF consulta. CLIENT entra a `/catalogo` desde su perfil y solo calcula servicios activos y visibles. Recargar la aplicación después de aplicar la migración para obtener los permisos nuevos.

Crear servicio con nombre, precio base y minutos positivos. Precio cero válido; usar punto decimal y máximo dos decimales (ej. 12.50), sin redondeo automático. En Tarifas, «Todos los tamaños/pelajes» representa NULL. Prioridad: coincidencia exacta → tamaño → pelaje → general → base. Cada regla define precio y duración completos. Desactivar servicio conserva sus tarifas.

El simulador de Tarifas y catálogo muestra precio, duración y origen sin reservar citas ni incluir transporte. Los importes se calculan en PostgreSQL numeric y se entregan como texto decimal exacto. No hay valores comerciales sembrados; deben configurarse.

```sh
node scripts/test-services-prices-api.mjs
```

La prueba usa fixtures locales propios, incluidos 1002 servicios/tarifas para paginación, y limpia solo su prefijo aleatorio.

## Fase 3 — Empleados y disponibilidad

Migración incremental `20261017212614_employees_availability.sql`: employees, employee_schedules, business_hours y time_blocks. Aplicada solo en identity-dev; no requiere reset. Seis tramos comerciales sembrados: lunes–sábado 07–18. No se crean empleados, turnos personales ni bloqueos de ejemplo persistentes.

Ejecutar la aplicación con `npm run start:local` y recargar para recibir los permisos nuevos. En **Empleados**, OWNER/ADMIN pueden vincular un perfil activo, elegir Asistente (baño) o Baño y corte y editar teléfono/estado. El perfil vinculado no se sustituye y la creación de empleado no asigna roles de acceso. STAFF solo consulta; CLIENT no accede al calendario laboral ni a motivos/teléfonos internos.

Seleccionar **Horarios y disponibilidad** en las acciones del empleado. Configurar turnos por día (partidos o consecutivos), horario del local y bloqueos personales o de todo el local. Las horas/fechas usan America/Lima y los intervalos son [inicio, fin): un bloqueo que termina a09 no impide empezar a09. Domingo no permite turnos ni atención. Los turnos de una persona no se solapan; las escrituras por RPC se serializan para proteger también peticiones concurrentes. No escribir directamente a estas tablas desde Angular.

La consulta puede mostrar ventanas por fecha o evaluar un intervalo y si requiere corte. Último inicio17; finalización después de18 solo con turno explícito que la cubra. Se distinguen cobertura laboral y admisión de nuevo inicio. Sin horario del local o turno del empleado no se habilita el tramo.

**Límite:** «Horario habilitado; ocupación de citas/recojos no verificada». Registrar manualmente ausencias, descansos, recojos y compromisos como bloqueos hasta integrar agenda. El cálculo no crea reservas ni garantiza que no haya citas fuera de esos bloqueos. No calcula precio ni tiempo de transporte.

```sh
node scripts/test-employees-availability-api.mjs
```

72 comprobaciones locales, incluidos roles, concurrencia, turnos/bloqueos, Lima, feriados y paginación >1000. Usa cuentas sintéticas, limpia UUIDs/prefijos propios y preserva la configuración comercial previa. El script requiere el calendario local confirmado para los intervalos de sus ensayos. Evidencia completa en [validación Fase 3](../specs/features/fase-3-empleados-disponibilidad/validation.md).

## Fase 4 — Agenda y reservas internas

Migración `20261017220427_internal_appointments.sql`, aplicada incrementalmente solo en identity-dev. Añade las cuatro tablas de citas, etapas temporales y control de versión. Usa Pandas11.sql actualizado; no crea appointment_services ni requiere reset. No desplegar Angular contra una base que aún use el contrato heredado sin un plan de conciliación.

Recargar la app con `npm run start:local` y abrir **Citas → Calendario**. OWNER/ADMIN gestionan; STAFF consulta. CLIENT no accede. El calendario usa America/Lima y muestra eventos por etapa, incluso después18. Seleccionar un evento abre la ficha completa de la cita.

Para reservar: elegir cliente, añadir uno o varios servicios por mascota, definir inicio de cada servicio y trabajador. La tarifa se resuelve por tamaño/pelaje y se confirma en servidor. En servicios que requieren especialista se puede desglosar baño/corte: indicar los minutos positivos de ambas etapas, cuya suma debe coincidir con el total, y asignar trabajadores. Puede ser la misma persona cualificada. No se permiten huecos ni solapamientos para una mascota. La primera atención de cada perro inicia hasta17; continuaciones posteriores requieren cobertura laboral completa.

**Comprobar disponibilidad** muestra horarios posibles por trabajador; al guardar se vuelve a validar todo atómicamente. Si dos reservas compiten, una se rechaza. Un bloqueo o cambio laboral que invalide una cita vigente también se rechaza; resolver las citas afectadas primero. La baja de una cuenta por seguridad no se bloquea: las citas con trabajador/perfil sin cobertura muestran aviso para reasignar.

Reprogramar una cita CONFIRMED conserva sus tarifas/duraciones aceptadas e IDs de items intactos. Para sustituir mascota/servicio, retirar el item y añadir uno nuevo. Ediciones con versión desactualizada se rechazan: recargar ficha y revisar antes de volver a guardar. Ante respuesta incierta de red, consultar estado antes de reenviar.

Estados: confirmar al crear, iniciar atención una vez llegado el inicio, completar desde atención, o cancelar/no asistió desde confirmada. Cancelar exige motivo y conserva detalle. No asistió solo después del inicio. Terminales no se reabren. Canceladas/no asistidas no ocupan; completadas conservan los intervalos programados. No hay borrado físico desde API.

Las observaciones internas se guardan aparte y no aparecen en títulos/eventos. OWNER/ADMIN editan y STAFF lee. Al guardar por primera vez una cita se habilita esa sección. Las notas de ficha/servicio no deben usarse para información reservada.

No se exige adelanto a citas internas, aunque el cliente tenga cuenta. No se registra un pago ni se gestiona transporte automáticamente: recojos/demoras se representan mediante bloqueos manuales; se considera la ocupación programada y registrada, no seguimiento real por etapa.

```sh
node scripts/test-appointments-api.mjs
```

La prueba usa cuentas/UUIDs propios y elimina solo sus datos. Incluye estados, snapshots, atomicidad, concurrencia entre reservas/turnos/bloqueos y1002 citas canceladas para paginación. También ejecuta la suite SQL con una cita vigente fuera de sus fixtures y comprueba su conservación; no requiere borrar cuentas existentes. Resultados en [validation.md](../specs/features/fase-4-agenda-reservas-internas/validation.md).

## Fase 5 — Pagos y saldos

Migraciones incrementales `20261018225928_payments_advances.sql` y `20261018230255_payments_queries.sql`, aplicadas únicamente en identity-dev con `supabase migration up --local`. No reset ni cambios remotos. Modelo Pandas11.sql actualizado; sin dependencias o Storage nuevos.

Recargar la aplicación para recibir permisos y abrir **Pagos y saldos** o **Consultar pagos y saldo** en la ficha de una cita. Primero completar la atención en agenda: el módulo solo registra cobros de citas internas COMPLETED. OWNER y ADMIN registran cobros parciales mediante Yape, Plin, efectivo, tarjeta o transferencia; número de operación y referencia opcionales, máximo120 caracteres. No se suben comprobantes.

Registrar deja PENDING y no reduce saldo. Solo OWNER puede abrir el detalle y confirmar recepción después de comprobar el dinero por su cuenta, incluido efectivo. Puede rechazar un pendiente con motivo hasta500 caracteres. El importe confirmado descuenta el saldo una sola vez; los registros fallidos permanecen en historial. La consulta muestra autor/verificador, fechas Lima y saldo exacto.

No hay integración bancaria, facturación, devoluciones/correcciones de pagos confirmados, ni autorreserva con adelanto. Adelanto de S/20 queda previsto para una fase futura; citas internas no exigen ni admiten adelantos. El flujo actual tampoco permite cancelar una cita ya completada; las alertas de cobros en citas canceladas se reservan para datos históricos/importados. Ante una respuesta de red incierta, reintentar el mismo formulario conserva la clave idempotente; consultar historial antes de abrir otro cobro.

```sh
node scripts/test-payments-api.mjs
```

Pruebas API solo contra55321, con cuentas/UUIDs sintéticos propios y limpieza de sus registros. Ver [validación](../specs/features/fase-5-pagos-adelantos/validation.md) para resultados y límites.
