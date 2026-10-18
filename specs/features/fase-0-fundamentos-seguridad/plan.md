# Plan — Fase 0

Estado: aprobado por el usuario el 2026-10-17; implementación local realizada.

## Modelo y dependencias

Usar las definiciones actuales de `profiles` (FK Auth, active), `roles` (code, name, is_system, active), `permissions` (code), `user_roles` y `role_permissions` (PKs compuestas y FKs CASCADE) de Pandas11.sql. No crear estructuras paralelas ni copiar todo el esquema. Revisar consecuencias de desactivar perfiles y del borrado de Auth sobre historial. Cambios de modelo adicionales se presentan antes de implementarse.

## Secuencia tras aprobación

1. Comprobar CLI y motor Docker; versiones históricas verificadas: CLI 2.121.0 y Docker CLI 29.7.2. No asumir servicios activos. No mostrar claves ni sobrescribir entornos.
2. Preparar configuración local Angular 4200, correo de confirmación local y seed válido. Usar base independiente desechable; si hay datos locales existentes, preservarlos.
3. Crear migraciones versionadas con `supabase migration new`: identidad, funciones/triggers, permisos/RLS y catálogo. Mantener coherencia con Pandas11.sql; no usar SQL raíz como migración automática.
4. Crear perfil tras registro y asignar CLIENT desde lógica confiable; proveer primer owner sintético por procedimiento privilegiado local. Asegurar search_path, permisos mínimos de funciones y ausencia de escalada por metadata.
5. RLS en cinco tablas, grants de columnas y operaciones controladas para cambios sensibles. Helpers comprueban active de perfil/rol y consultan base de datos. Proteger último owner de baja, pérdida de rol y cambios de privilegios; serializar escrituras sensibles.
6. Adaptar servicio de sesión/permisos, guard inicial y navegación hija, acceso denegado, sidebar y acciones de seguridad. Perfil sin inserción alternativa libre con active=true. Añadir asignación de roles dentro de configuración. Vista general de apariencia/perfil no exige permiso de administrar roles.
7. Catalogar permisos de rutas actuales con alcance explícito: panel.access no garantiza permisos de dominio. Rutas de negocio quedan fuera de una declaración de seguridad completa hasta sus políticas; no cambiar otras tablas bajo esta fase.
8. Levantar `supabase start` y aplicar migraciones solo localmente. `supabase db reset --local` únicamente cuando se confirme que la instancia es desechable, ya que borra datos. No ejecutar link, db push, repair ni comandos remotos.
9. Ejecutar `supabase db lint --local`, `supabase test db` y pruebas API de autorización con datos sintéticos; probar concurrencia y revocación. Añadir pruebas Angular pertinentes, comprobación TypeScript y npm run build.
10. Registrar evidencia y actualizar architecture, baseline, tech-stack y roadmap sin presentar el modelo local como esquema remoto verificado.

## Archivos previstos

`supabase/config.toml`, migraciones, seed y tests SQL; servicios Auth/perfil/roles/permisos, guard, rutas, sidebar y configuración con tests; modelo SQL solo si hay cambios aprobados; documentación SDD.

## Riesgos y límites

Clientes/empleados cargan perfiles para selectores: conceder lectura solo a roles autorizados y gestionar denegación sin ampliar RLS silenciosamente. Una base con solo identidad no sirve para comprobar todos los CRUD del negocio. Roles de acceso no equivalen a skill_level de empleados.

OAuth, MFA, recuperación de contraseña, agenda, pagos y seguridad de tablas del negocio quedan fuera. Si el resultado solicitado exige protección de cada operación del negocio en esta entrega, ampliar y aprobar la matriz y políticas de esas tablas antes de implementarla.

## Aprobación

El usuario aprobó este plan de Fase 0 explícitamente. La autorización incluye la matriz, registro CLIENT, gestión de seguridad inicialmente reservada a OWNER y entorno local desechable con confirmación de correo. No autoriza despliegue remoto.

## Autorización y concreción

El usuario aprobó explícitamente el plan y sus condiciones. Solo OWNER administra seguridad inicialmente; CLIENT por registro público; instancia local independiente desechable y confirmación obligatoria. Los roles de sistema, sus permisos y las asignaciones OWNER no se alteran por API. Para garantizar protección del último owner sin ventanas de concurrencia, cualquier rotación de owners exige administración privilegiada local. Los roles personalizados sí se administran desde la aplicación.

## Corrección autorizada por reporte de fallo — 2026-10-17

El usuario reportó pérdida de permisos al entrar a Roles y fallos en tests. Se corrigió dentro del alcance existente: mantener el último resultado durante una revalidación de la misma sesión, publicar el resultado completo y denegar al fallar; compartir consultas concurrentes y descartar resultados tras cambio/cierre de sesión. Las renovaciones de token revalidan fuera del callback Auth.

Las pruebas cuentan solo UUIDs propios, generan fixtures SQL únicos y limpian roles temporales en finally. No cambia Pandas11.sql, contratos, RLS o asignaciones del usuario; no requiere migración ni reset. Añadir pruebas de regresión de estado y concurrencia y repetir tests sobre la base existente.

## Ajuste de presentación solicitado — 2026-10-18

Dentro de la gestión existente aprobada, el usuario solicita una tercera pestaña para Usuarios y roles y un indicador visible de la opción seleccionada. Se limita a RoleSettingsComponent TS/HTML: ampliar el estado de vista, generar las tres opciones con estilos activos y mostrar un único contenido por selección. Conservar autorización, formularios, selección de rol y callbacks de servicio.

Sin impacto de datos en profiles, roles, permissions, user_roles o role_permissions de Pandas11.sql; sin cambios de modelo, servicios, migraciones o RLS. Validación: compilación de producción, suite Angular existente y revisión de condiciones de visualización/permisos. La revisión visual manual se registra como pendiente.

## Formulario de rol en ventana emergente — 2026-10-18

Ajuste de presentación solicitado sobre el formulario existente. Reutilizar ModalComponent sin modificarlo para otros consumidores; importar A11yModule de Angular CDK ya instalado para capturar/devolver foco y mantener Tab dentro del diálogo. Mover el formulario al modal, con cabecera y cierre propio etiquetado, conservando sus validaciones y guardado. Encaminar los cierres a closeRoleForm, que respeta busy; resetRole conserva su uso interno tras un guardado exitoso. Mostrar fallos dentro del modal y limpiar avisos antiguos al abrir.

Alcance: únicamente RoleSettingsComponent y estos documentos. Sin cambios de contratos, reglas de negocio, Pandas11.sql, servicios, permisos, migraciones o datos; no instalar paquetes. Verificar compilación, suite Angular existente y diff. La interacción visual y de teclado requiere revisión manual y no se acredita solo con la suite existente.
