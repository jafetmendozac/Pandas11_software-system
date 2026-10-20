# Actividad 2 — Seguridad y autenticación

Fecha de corte: 2026-10-20 (America/Lima). Anexo para los puntos 2.1–2.4 del [cronograma](matriz-seguimiento.md). Describe el código, las migraciones y las validaciones **locales** disponibles. No acredita configuración ni despliegue del proyecto Supabase remoto, aceptación del negocio o una nueva ejecución de pruebas.

## 2.1 Configurar Auth, `profiles` e inicio de sesión

La [migración de identidad](../supabase/migrations/20261017152256_identity_foundation.sql) crea `profiles`, `roles`, `permissions`, `role_permissions` y `user_roles`, vinculando `profiles.id` a `auth.users.id`. Un trigger crea el perfil y asigna únicamente el rol `CLIENT` al registrarse. Los roles privilegiados se asignan mediante administración autorizada; el registro público no los concede.

En Angular, [SupabaseService](../src/app/shared/services/supabase.service.ts) ofrece registro, inicio de sesión por correo y contraseña, consulta de sesión y cierre. [AuthorizationService](../src/app/shared/services/authorization.service.ts) exige correo confirmado, perfil activo y consulta `my_permissions()` antes de publicar permisos. La [validación de Fase 0](features/fase-0-fundamentos-seguridad/validation.md) registra pruebas locales del registro, confirmación mediante el protocolo Auth, acceso y salida. La entrega real del correo a un buzón externo no se comprobó.

**Texto para informe:** «Se configuró Supabase Auth con correo y contraseña y se vinculó cada cuenta a un perfil y al rol inicial CLIENT. La aplicación consulta el estado del perfil y los permisos antes de autorizar el acceso».

## 2.2 Implementar políticas RLS y definir roles

Los cuatro roles de sistema están definidos en la migración de identidad. Los permisos efectivos son la unión de los permisos de los roles activos asignados a un perfil activo. La comprobación vive en `public.has_permission()`; la interfaz usa `public.my_permissions()`. Las [reglas RN-06, RN-08, RN-09, RN-13 y RN-16](business-rules.md) distinguen administración, personal, cliente, citas y verificación de pagos. La [matriz original de Fase 0](features/fase-0-fundamentos-seguridad/requirements.md) detalla el alcance de identidad.

| Rol | Identidad/panel | Datos y operación implementados localmente |
|---|---|---|
| `OWNER` | Acceso al panel; lectura/gestión de perfiles y seguridad. Los roles de sistema y la asignación OWNER se protegen frente a cambios por API. | Gestiona clientes, mascotas, servicios, empleados y agenda; registra pagos y es el único que verifica o rechaza pagos. |
| `ADMIN` | Acceso al panel y lectura de perfiles; sin gestión de seguridad. | Gestiona los dominios anteriores y registra/consulta pagos; no los verifica. |
| `STAFF` | Acceso al panel; sin gestión de seguridad. | Consulta clientes, mascotas, notas internas, servicios, empleados, disponibilidad y citas según los permisos de cada dominio; no gestiona pagos. |
| `CLIENT` | Perfil propio; sin acceso al panel interno. | Consulta sus fichas y mascotas vinculadas, sus vacunas y el catálogo visible. No accede a notas internas, empleados, agenda interna ni pagos. |

La pertenencia a un rol no sustituye la evaluación de permisos en cada política. Esta tabla resume las [asignaciones SQL de identidad](../supabase/migrations/20261017152256_identity_foundation.sql), [clientes/mascotas](../supabase/migrations/20261017201505_clients_pets.sql), [servicios/tarifas](../supabase/migrations/20261017210343_services_prices.sql), [personal/disponibilidad](../supabase/migrations/20261017212614_employees_availability.sql), [agenda](../supabase/migrations/20261017220427_internal_appointments.sql) y [pagos](../supabase/migrations/20261018225928_payments_advances.sql). Puede haber roles personalizados y varias asignaciones por usuario; la tabla describe los roles de sistema inicialmente configurados.

| Tablas protegidas con RLS | Acceso principal y mecanismo | Fuente |
|---|---|---|
| `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles` | Perfil propio activo; lectura/gestión global según permiso. Restricciones de columnas, triggers y funciones protegen cambios sensibles y roles de sistema. | [Identidad](../supabase/migrations/20261017152256_identity_foundation.sql) |
| `clients`, `pets`, `pet_vaccinations`, `client_internal`, `pet_internal` | OWNER/ADMIN gestionan; STAFF lee; CLIENT solo sus registros vinculados. Las notas internas no son visibles para CLIENT. | [Clientes y mascotas](../supabase/migrations/20261017201505_clients_pets.sql) |
| `services`, `service_prices` | OWNER/ADMIN gestionan; STAFF lee; CLIENT ve el catálogo activo y visible. | [Servicios y tarifas](../supabase/migrations/20261017210343_services_prices.sql) |
| `employees`, `employee_schedules`, `business_hours`, `time_blocks` | OWNER/ADMIN gestionan; STAFF consulta; CLIENT no tiene acceso a los datos laborales. | [Empleados y disponibilidad](../supabase/migrations/20261017212614_employees_availability.sql) |
| `appointments`, `appointment_items`, `appointment_item_staff`, `appointment_internal` | Lectura por permiso; altas, estados y cambios mediante funciones controladas. STAFF solo consulta; CLIENT no accede a la agenda interna. | [Citas internas](../supabase/migrations/20261017220427_internal_appointments.sql) |
| `payments` | Lectura OWNER/ADMIN; escritura mediante funciones controladas. Verificar o rechazar exige OWNER activo. | [Pagos](../supabase/migrations/20261018225928_payments_advances.sql) |

`Pandas11.sql` es el [modelo local de referencia](../Pandas11.sql), no una prueba del esquema remoto. Contiene cinco tablas adicionales sin migración operativa identificada: `business_settings`, `billing_documents`, `billing_document_items`, `notifications` y `audit_log`. No se les atribuye cobertura RLS desplegada. El [diccionario de datos](actividad-1-diccionario-datos.md) distingue modelo y migraciones.

**Texto para informe:** «Se definieron roles OWNER, ADMIN, STAFF y CLIENT, permisos por operación y políticas RLS para las tablas de identidad y módulos actualmente implementados. La base de datos controla el acceso por usuario, perfil activo y permisos; Angular presenta solo las opciones permitidas».

## 2.3 Probar seguridad y documentar políticas

La [validación de Fase 0](features/fase-0-fundamentos-seguridad/validation.md) registra **16/16 pruebas SQL pgTAP** y **26 comprobaciones API** con identidades sintéticas de anon, CLIENT, STAFF, ADMIN y OWNER. Se probaron lecturas y escrituras permitidas/denegadas, perfil y rol inactivos, protección de roles de sistema y de OWNER, y concurrencia. Tras corregir pruebas para convivir con cuentas preexistentes, el registro de regresión repite **16/16 SQL, 26 API y 11/11 Angular**. Son resultados históricos de 2026-10-17, no nuevas ejecuciones de este anexo. Las validaciones de [clientes](features/fase-1-clientes-mascotas/validation.md), [servicios](features/fase-2-servicios-precios/validation.md), [personal](features/fase-3-empleados-disponibilidad/validation.md), [citas](features/fase-4-agenda-reservas-internas/validation.md) y [pagos](features/fase-5-pagos-adelantos/validation.md) documentan pruebas de acceso por dominio; sus totales no se suman como pruebas únicas.

Para un informe con anexos de ejecución, adjuntar la salida fechada de [SQL](../supabase/tests/database/identity.test.sql), del [script API](../scripts/test-identity-api.mjs) y de la suite Angular, junto con nombre del entorno local, versión evaluada y observaciones. No se ha comprobado en esta entrega el proyecto Supabase remoto.

**Texto para informe:** «Se ejecutaron pruebas locales de RLS y autorización con usuarios sintéticos de distintos roles. La validación de identidad registró 16 comprobaciones SQL y 26 comprobaciones API satisfactorias; las políticas de los módulos posteriores tienen validaciones propias».

## 2.4 Finalizar Auth en Angular y estructura de proyecto

Las [rutas](../src/app/app.routes.ts) separan registro/inicio de sesión, vistas del cliente y panel interno. [profileGuard y authGuard](../src/app/shared/guards/auth.guard.ts) controlan perfil activo, `panel.access` y el permiso requerido por ruta; `AuthorizationService` revalida la sesión y vacía permisos cuando la cuenta cambia, sale o falla una comprobación. Páginas, componentes standalone, servicios y layout siguen la [arquitectura](architecture.md) existente. La validación de Fase 0 registra compilación y pruebas Angular; la regresión documentó 11/11 pruebas del guard y servicio.

«Finalizar Auth» se refiere aquí al alcance implementado de correo/contraseña, confirmación, perfil, permisos y rutas. No se acredita recuperación de contraseña, Google u otro proveedor OAuth, MFA, validación visual completa ni despliegue remoto.

**Texto para informe:** «La estructura Angular integra los servicios de autenticación y autorización, guards y rutas protegidas para el alcance de inicio de sesión por correo y contraseña y gestión de permisos».

## Evidencia pendiente para cierre formal

1. Capturas o registro de un recorrido de registro, confirmación, inicio, perfil propio, acceso permitido/denegado y salida con cuentas sintéticas.
2. Salidas originales fechadas de pruebas y compilación, con identificación del entorno y versión, si la institución exige anexos ejecutables.
3. Revisión y aceptación del alcance de 2.1–2.4 por Alex y Caro o el evaluador correspondiente. La fecha y el formato de aceptación no fueron proporcionados.
4. Verificación del proyecto remoto solo si se decide evaluar despliegue; el enlace facilitado por el usuario no demuestra que estas migraciones o configuraciones estén aplicadas allí.

Este anexo documenta lo implementado y probado localmente; no modifica código, políticas ni datos.
