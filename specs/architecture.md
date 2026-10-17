# Arquitectura actual

Fecha de referencia: 2026-10-15 (America/Lima).
Estado: descripción del código local y del modelo disponible; arquitectura remota desconocida.

## Estructura Angular

```text
src/main.ts → app.config.ts → app.routes.ts
                              ├─ Autenticación pública
                              ├─ AppLayout + authGuard
                              │   ├─ Páginas del negocio
                              │   └─ Páginas de demostración
                              └─ Página de error

Páginas → componentes compartidos → servicios de dominio
                                   → SupabaseService
                                       → supabase-js → Auth / tablas
```

- `pages/`: clientes, mascotas, servicios, tarifas, empleados, agenda, perfil, configuración y páginas heredadas de TailAdmin.
- `shared/layout/`: shell con header, sidebar, backdrop y router outlet; layouts de autenticación.
- `shared/components/`: UI, formularios, tablas configurables y componentes de dominio.
- `shared/services/`: persistencia y estado compartido.
- `shared/guards/auth.guard.ts`: guard de autenticación.
- `styles.css`: estilos globales y configuración de tema Tailwind.

La mayoría de las rutas importa directamente sus componentes. Configuración usa `loadComponent`. No se propone reorganizar carpetas en esta etapa.

## Flujo de autenticación

1. El formulario de acceso llama a `signInWithEmail`, que usa `signInWithPassword`.
2. Tras el acceso, navega al destino solicitado o a `/`.
3. El guard del layout obtiene la sesión y exige `email_confirmed_at`.
4. Si no cumple, redirige a `/signin` conservando el destino en un parámetro.
5. El registro envía nombres en metadata; si no obtiene sesión confirmada, cierra sesión y muestra la pantalla informativa de confirmación.
6. Perfil consulta el usuario autenticado y su fila en `profiles`; permite modificar nombres.
7. El cierre de sesión invoca Supabase Auth y navega al acceso.

No se identificó gestión centralizada mediante `onAuthStateChange`. El guard no verifica rol, permisos o `profiles.active`; no hay guards de permiso ni `canActivateChild` identificados. La autorización efectiva debe comprobarse mediante RLS.

Google, recuperación de contraseña, reenvío de confirmación y doble factor no tienen un flujo funcional completo identificado. El control visual de doble factor modifica estado local.

## Capas de servicios y dependencias

| Servicio | Responsabilidad observada |
|---|---|
| `SupabaseService` | Construcción del cliente, sesión y operaciones Auth |
| `ClientesService`, `MascotasService` | Fichas y bajas lógicas |
| `ServiciosService`, `TarifasService` | Catálogo, precios y duración |
| `EmpleadosService`, `ProfilesService` | Personal y perfiles |
| `RolesService` | Roles, catálogo de permisos y asignaciones rol–permiso |
| `AppointmentsService` | Citas, detalle y opciones de agenda |
| `ThemeService`, `SidebarService`, `ModalService` | Estado de interfaz |

El cliente Supabase se crea con la configuración del entorno y se expone a los servicios. No usa un tipo generado `Database`; existen interfaces manuales y conversiones de tipos.

Varios servicios importan `TableRow` desde la tabla configurable: dependencia de persistencia hacia presentación. Las páginas coordinan carga y escritura; no hay una capa de casos de uso separada identificada.

La tabla actualiza su estado antes de recibir confirmación remota. La gestión de errores de escritura varía entre páginas. Esto puede producir divergencia visual tras un fallo.

## Estado y formularios

Propiedades locales y signals guardan datos de pantalla. RxJS `BehaviorSubject` gestiona tema, sidebar y modales. Tema y dirección se conservan en el navegador. No se identificó un store global de negocio.

Los formularios usan principalmente `FormsModule` y validaciones manuales. La tabla no comprueba `form.valid` antes de guardar. `InputFieldComponent` no propaga `required` al input interno ni implementa `ControlValueAccessor`.

## Modelo Supabase documentado localmente

| Dominio | Tablas del SQL local |
|---|---|
| Identidad | `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles` |
| Personal y disponibilidad | `employees`, `employee_schedules`, `business_hours`, `time_blocks`, `business_settings` |
| Clientes y mascotas | `clients`, `pets`, `pet_vaccinations` |
| Información interna | `client_internal`, `pet_internal`, `appointment_internal` |
| Catálogo | `services`, `service_prices` |
| Citas | `appointments`, `appointment_items`, `appointment_item_staff` |
| Pagos y comprobantes | `payments`, `billing_documents`, `billing_document_items` |
| Comunicaciones y auditoría | `notifications`, `audit_log` |

Relaciones locales relevantes: `profiles.id` referencia `auth.users`; clientes y empleados enlazan perfiles; mascotas pertenecen a clientes; usuarios y permisos se relacionan con roles mediante tablas puente. Las claves compuestas del detalle de citas vinculan cita y mascota al mismo cliente. Personal se asigna al detalle; pagos y comprobantes se vinculan a citas.

No se afirma que estas 28 tablas existan en el entorno remoto.

## SQL, RLS y migraciones

`functions_triggers.sql` define triggers de `updated_at`, `has_permission(text)` y creación de perfil tras insertar un usuario Auth. `has_permission` considera roles activos, pero no el estado activo del perfil.

Solo se identificó activación de RLS para `roles` y `permissions`, sin sentencias `CREATE POLICY`. `policy.sql` y `seed.sql` están vacíos. No se encontraron migraciones versionadas ni implementaciones de Edge Functions.

La configuración CLI tiene `schema_paths = []` y apunta a un `supabase/seed.sql` inexistente. Los archivos SQL de la raíz no constituyen un historial verificable de despliegue.

## Discrepancias y riesgos

| Evidencia local | Consecuencia o incertidumbre |
|---|---|
| Angular usa `appointment_date`, horas separadas, mascota y empleado en cabecera, y `appointment_services` | SQL usa timestamps, `appointment_items` y `appointment_item_staff`; contrato incompatible |
| Angular envía `scheduled` | El enum SQL no contiene ese estado y utiliza mayúsculas |
| Agenda obtiene empleados desde `profiles` | No garantiza pertenencia a personal ni especialidad |
| Agenda utiliza precios base | No resuelve reglas de `service_prices` |
| Cita y detalle se escriben en solicitudes sucesivas | Riesgo de resultados parciales; no hay transacción conjunta identificada |
| Títulos interpolados en HTML del calendario | Posible inyección HTML/XSS; requiere prueba específica |
| Consultas de agenda sin filtro de bajas lógicas y sin control persistente de solapamientos identificado | Riesgo de seleccionar registros retirados o reservar horarios incompatibles |
| Construcción de horas según navegador | Zona horaria y cruces de medianoche pendientes de definir |
| `getClients()` de ejemplo consulta `clientes` | No coincide con `clients` del resto del código |
| SQL presenta literales `TOY` y `SMALL` sin coma y claves foráneas repetidas | Requiere revisión SQL antes de establecer una migración base |
| DBML no refleja todos los campos de roles y admite tarifas comodín que la UI no representa | No existe una única fuente de verdad acordada |
| Auth local apunta al puerto 3000 y desactiva confirmaciones | No coincide con el servidor Angular habitual en 4200 ni con la expectativa del guard |

## Decisiones pendientes

El usuario debe aprobar el modelo canónico de citas, estados, relación empleado–perfil, tarifas comodín, reglas horarias y matriz de permisos. También debe confirmar qué archivos reflejan el despliegue y la estrategia de migraciones. No se resuelve ninguna discrepancia mediante cambios de código en esta entrega.

Fuentes: [rutas](../src/app/app.routes.ts), [guard](../src/app/shared/guards/auth.guard.ts), [servicio de citas](../src/app/shared/services/appointments.service.ts), [SQL](../Pandas11.sql), [funciones](../functions_triggers.sql), [DBML](../database.md), [configuración Supabase](../supabase/config.toml).

## Actualización Fase 0 — 2026-10-17

Esta sección actualiza las observaciones históricas de identidad anteriores. `supabase/migrations/20261017152256_identity_foundation.sql` reproduce las cinco tablas de identidad del modelo local y añade catálogo, RLS, grants y funciones seguras. El resto del esquema sigue sin migrar en este entorno parcial.

`AuthorizationService` consulta usuario confirmado, perfil activo y `my_permissions`; guards comprueban `panel.access` en entrada y navegación hija. Cliente dispone de `/mi-perfil`; acceso denegado en `/access-denied`. Configuración distingue apariencia de seguridad. Owner gestiona roles personalizados, usuarios y asignaciones; no puede alterar owners/roles de sistema mediante API. Los perfiles no se insertan libremente desde Angular.

Helpers SECURITY DEFINER con search_path vacío evitan recursión RLS. El registro crea perfil y CLIENT sin confiar roles a metadata. Perfil/rol inactivo deja de otorgar permisos. La rotación owner se reserva a administración privilegiada; por API se impide retirar o desactivar cualquier owner.

Desarrollo aislado `Pandas11-identity-dev`, configuración Angular `local`, puertos 553xx y confirmación por correo local. Ver `supabase/README.md`. No cambia el esquema remoto ni garantiza autorización de las otras tablas del negocio.
