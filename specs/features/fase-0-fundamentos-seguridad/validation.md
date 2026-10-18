# Validación — Fase 0

Fecha: 2026-10-17. Estado: implementación local y validaciones completadas; sin despliegue remoto.

## Alcance entregado

Migración con las cinco tablas de Pandas11.sql, RLS/grants, registro CLIENT, perfiles activos, permisos efectivos y roles de sistema protegidos. Angular comprueba autorización al entrar/navegar, limita la sección de seguridad, permite gestionar asignaciones de roles y ofrece perfil separado al cliente. Instancia identity-dev independiente; datos de prueba sintéticos limpiados.

## Criterios

| Criterio | Resultado y evidencia |
|---|---|
| F0-01 | Reconstrucción desde cero de identity-dev con `supabase db reset --local`, migración y seed correctos |
| F0-02 | API comprueba correo sin confirmar denegado, verificación OTP con enlace Auth Admin, perfil automático y salida; entrega visual al buzón no comprobada |
| F0-03 | Cinco tablas con RLS, grants mínimos y pruebas SQL/API; sin recursión observada |
| F0-04 | API verifica nombres propios, protección de active/ID, perfil ajeno sin filas afectadas y autoasignación denegada |
| F0-05 | Perfil inactivo y rol personalizado inactivo revocan permisos con sesión previa; Angular descarta respuestas obsoletas |
| F0-06 | OWNER gestiona roles personalizados/asignaciones; owner y roles de sistema inmutables por API. Dos solicitudes concurrentes de retirada de OWNER denegadas |
| F0-07 | Guards y controles de interfaz implementados, incluyendo permiso panel.access; pruebas de guard y servicio |
| F0-08 | 16 comprobaciones pgTAP y 26 comprobaciones API correctas; API usa sesiones anon/CLIENT/STAFF/ADMIN/OWNER y comprueba filas afectadas |
| F0-09 | Tipos de app/spec correctos; build y pruebas Angular registrados. Sin secretos en frontend o archivos versionados; entorno local solo con clave pública |
| F0-10 | Sin políticas o migraciones de tablas de negocio; no se declara seguridad global ni despliegue remoto |

## Ejecuciones

- `supabase migration new identity_foundation`: migración creada mediante CLI.
- `docker info`: servidor 29.8.2 disponible. CLI Docker anteriormente 29.7.2; son componentes distintos.
- `supabase start`: instancia `Pandas11-identity-dev`, puertos API/DB/Studio/correo 55321/55322/55323/55324.
- `supabase db reset --local`: reconstrucción final correcta, solo instancia creada para esta tarea.
- `supabase test db`: 16/16, PASS.
- `supabase db lint --local`: sin errores.
- `node scripts/test-identity-api.mjs`: 26 comprobaciones correctas; usuarios sintéticos eliminados al terminar.
- `node scripts/local-environment.mjs`: entorno ignorado generado sin mostrar claves.
- `tsc --project tsconfig.app.json --noEmit --incremental false` y equivalente spec: correctos.
- `npm run build`: producción compilada, total inicial aproximadamente 3,33 MB.
- `npm test -- --watch=false --browsers=ChromeHeadless`: 7/7 pruebas de guard y servicio correctas en ChromeHeadless.
- `git diff --check`: sin errores.

La primera prueba SQL detectó acceso a campos inexistentes de NEW/OLD en un trigger compartido. Se corrigió con ramas por tabla/operación y comprobaciones con privilegios controlados; se repitieron pruebas y reconstrucción completa con éxito.

## Límites y uso

No hay validación visual manual de pantallas ni entrega real de correo al buzón; el test verifica el protocolo Auth con enlace generado por Admin. No se creó cuenta owner persistente; seguir `supabase/README.md` para aprovisionar un usuario local confirmado. No hay invitación de empleados por email: owner habilita a usuarios ya registrados.

La API impide cualquier modificación de owners, no solo la del último; la rotación requiere administración privilegiada y documentada. Los permisos de los roles de sistema también quedan fijos; administrar roles personalizados permite variaciones sin desproteger el catálogo base.

La instancia local solo contiene identidad; las pantallas del negocio requieren sus propias migraciones y RLS. No apuntar esta versión Angular a una base remota sin adoptar su contrato mediante un plan independiente. Ninguna conexión, migración o despliegue remoto realizado; no commits ni pushes. La instancia local queda activa para revisión.

## Regresión con usuario existente — 2026-10-17

El reporte adjunto mostró 4 perfiles donde el test esperaba 3 y un fallo equivalente del test API, que esperaba exactamente 4 perfiles globales. La validación inicial solo había cubierto una instancia recién creada. Se corrigieron las aserciones para restringirse a los UUIDs de prueba, con fixtures SQL aleatorios y limpieza de roles en finally; no se alteran cuentas preexistentes.

La sección Roles invocaba refresh(), que publicaba permisos vacíos antes de responder. El padre usaba esos permisos en @if y desmontaba al hijo, ocultando también el sidebar. Se conserva el resultado durante revalidación de la misma sesión; al denegar/fallar se vacía. Cambio/cierre de cuenta invalida inmediatamente; consultas simultáneas se comparten. Se añadieron cuatro pruebas de regresión de autorización.

Resultados sobre identity-dev existente, SIN reset: 16/16 SQL, 26 comprobaciones API, 11/11 Angular ChromeHeadless. Comprobación TypeScript de tests correcta. Se ejecuta también build y git diff --check. No se conceden permisos nuevos, ni se cambian RLS, migraciones o esquema.

## Presentación de pestañas — 2026-10-18

Solicitud del usuario implementada sobre la gestión existente: Usuarios y roles pasa a una tercera vista exclusiva; la opción activa usa fondo de marca y texto blanco en temas claro/oscuro, con `aria-pressed` y foco visible. Se conserva `user_roles.manage` para pestaña y contenido, y `busy()` deshabilita los cambios de vista mientras hay una operación pendiente. Sin cambios en servicios, autorización o base de datos.

- `npm run build`: correcto, bundle inicial3,39MB; compila la plantilla modificada.
- `npm test -- --watch=false --browsers=ChromeHeadless`:63/63 correctas en la suite existente. No había pruebas específicas de RoleSettingsComponent; no se atribuye a esta suite una revisión visual de las nuevas pestañas.
- `git diff --check`: correcto.

Los primeros intentos restringidos de build y tests terminaron con código134 (el build mostró un bloqueo interno de esbuild); ambos comandos pasaron al ejecutarlos fuera del sandbox. Sin instalación de dependencias ni cambios de configuración. Revisión visual manual pendiente; no se ejecutaron pruebas SQL/API porque no se cambió su contrato ni se accedió a Supabase en esta tarea.

## Formulario de rol en ventana emergente — 2026-10-18

Formulario de crear/editar trasladado a ModalComponent existente. Se conserva la validación y el servicio de guardado; cierre con Cancelar/X/Escape/fondo, bloqueado por busy durante la petición. Los errores se muestran dentro del modal manteniendo los valores; éxito cierra y actualiza la lista. Angular CDK ya instalado aporta captura inicial de foco en código, contención de Tab y restauración de foco al cerrar. Sin modificaciones al modal compartido ni a sus otros consumidores.

- `npm run build`: correcto; inicial3,40MB, plantilla y módulo de accesibilidad compilados.
- `npm test -- --watch=false --browsers=ChromeHeadless`:63/63 correctas de la suite existente; no son pruebas específicas de este formulario.
- `git diff --check`: correcto.

Build y tests se ejecutaron fuera del sandbox por las limitaciones comprobadas anteriormente. Sin dependencias nuevas, cambios de base de datos, conexiones Supabase o modificaciones de permisos. Pendiente revisión visual/manual del modal, interacción de teclado y comportamiento durante una petición real; no se declaran como validados por navegador en esta entrega.
