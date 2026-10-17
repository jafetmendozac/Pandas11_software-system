# Fase 0 — Fundamentos y seguridad

Fecha: 2026-10-17. Estado: aprobado por el usuario el 2026-10-17; implementación local.

## Objetivo y alcance

Usuarios autorizados pueden entrar y operar únicamente dentro de sus permisos. Alcance de esta entrega propuesto: identidad y administración de seguridad en `profiles`, `roles`, `permissions`, `user_roles` y `role_permissions`, usando `Pandas11.sql` como modelo local y Supabase CLI para migraciones locales.

No afirmar seguridad integral de operaciones de clientes, mascotas, citas o pagos sin proteger sus tablas. Su RLS requiere fases adicionales; bloquear navegación no protege por sí solo la API. No reconstruir el proyecto ni ejecutar cambios remotos.

## Hechos actuales

Las cinco tablas y sus relaciones existen en el modelo local; FKs redundantes previamente corregidas. Guard solo exige sesión y correo confirmado. `has_permission` considera rol activo pero no perfil activo. No se identificaron migraciones versionadas ni políticas completas. Los documentos anteriores de esta fase no están en el árbol actual y esta versión los vuelve a preparar.

## Reglas relacionadas

RN-06 distingue administrador y RN-08 reserva verificación de adelantos al owner. RN-09 distingue personal y cliente; RN-07 define habilidades operativas, distintas de permisos de acceso. Esta fase no implementa pagos, recojo ni asignación de habilidades.

## Propuesta de usuarios y permisos (pendiente)

- OWNER: administra seguridad y asigna roles; primer owner aprovisionado mediante procedimiento privilegiado local, nunca por registro público.
- ADMIN: operación administrativa con permisos explícitos; sin administración de seguridad por defecto.
- STAFF: personal operativo sin privilegios de seguridad.
- CLIENT: perfil propio; sin acceso al panel interno.
- Registro público asigna solo CLIENT desde lógica confiable; metadata editable no otorga privilegios. Owner concede acceso al personal.
- Permisos efectivos: unión de roles activos de un perfil activo; sin rol/permisos, denegación por defecto.

| Operación | Permiso propuesto | Asignación inicial |
|---|---|---|
| Acceder al panel interno | `panel.access` | OWNER, ADMIN, STAFF |
| Leer perfil propio / editar nombres propios | Identidad y perfil activo | Todos los usuarios activos |
| Leer otros perfiles para selectores | `profiles.read` | OWNER, ADMIN |
| Activar/desactivar perfiles | `profiles.manage` | OWNER |
| Consultar roles/permisos y asignaciones globales | `security.read` | OWNER |
| Crear/editar/desactivar roles | `roles.manage` | OWNER |
| Asignar permisos a roles | `role_permissions.manage` | OWNER |
| Asignar roles a usuarios | `user_roles.manage` | OWNER |

Consulta mínima de permisos efectivos propios disponible sin lectura global de asignaciones. Catálogo de permisos mantenido por migraciones. Conservar valores técnicos y estructura actual; códigos propuestos todavía no aprobados.

## Criterios de aceptación

- F0-01: migraciones reproducen las cinco tablas, relaciones, funciones, políticas y catálogo en entorno local desechable, sin importar SQL raíz completo.
- F0-02: registro, confirmación por correo local, creación de perfil, acceso y salida funcionan con datos sintéticos; cliente no entra al panel interno.
- F0-03: RLS y privilegios explícitos cubren las cinco tablas; anon no accede a identidad. Helpers evitan recursión RLS.
- F0-04: usuario no puede alterar su ID, active, timestamps, roles o permisos por llamadas directas; solo modifica nombres propios autorizados.
- F0-05: perfil o rol inactivo revoca acceso protegido incluso con sesión previa; errores de consulta no conceden acceso.
- F0-06: gestión privilegiada exige permisos en base de datos; roles de sistema y último owner activo protegidos, también ante concurrencia.
- F0-07: Angular valida sesión/perfil/permisos en entrada y navegación; UI refleja autorización, con manejo de acceso denegado. RLS sigue siendo la autoridad.
- F0-08: pruebas SQL y API verifican lectura/escritura permitida y denegada con identidades anon/client/staff/admin/owner; comprobar filas afectadas y ausencia de cambios.
- F0-09: pruebas Angular de autorización, tipos y compilación correctos o limitaciones documentadas. Sin credenciales reales ni secret/service_role en frontend.
- F0-10: registrar la seguridad de tablas fuera del alcance como pendiente; no declarar cumplimiento global de todas las operaciones del negocio.

## Decisiones aprobadas

Matriz propuesta y registro público CLIENT aprobados por el usuario. ADMIN no administra seguridad inicialmente. Entorno local desechable independiente y confirmación de correo obligatoria autorizados expresamente para esta fase.

## Autorización y concreción

El usuario aprobó explícitamente el plan y sus condiciones. Solo OWNER administra seguridad inicialmente; CLIENT por registro público; instancia local independiente desechable y confirmación obligatoria. Los roles de sistema, sus permisos y las asignaciones OWNER no se alteran por API. Para garantizar protección del último owner sin ventanas de concurrencia, cualquier rotación de owners exige administración privilegiada local. Los roles personalizados sí se administran desde la aplicación.

## Corrección de regresiones — 2026-10-17

- F0-R01: entrar o recargar Roles no desmonta su componente ni vacía el menú mientras se revalida la misma sesión. Una denegación real o cierre/cambio de cuenta sí elimina los permisos.
- F0-R02: consumidores simultáneos comparten la consulta de autorización y no invalidan entre sí sus resultados.
- F0-R03: pruebas SQL/API funcionan con cuentas preexistentes sin contarlas como fixtures, borrar sus datos ni reconstruir la base.
