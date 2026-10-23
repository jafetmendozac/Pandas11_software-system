# Validación

Estado: implementación completada según el plan aprobado.

## Cambios

- Página de configuración: plantilla y mensajes de preferencias en español.
- Roles y permisos: plantilla, accesibilidad, estados, validaciones y mensajes propios en español.
- Servicio de roles: dos errores propios traducidos; consultas intactas.
- Ruta de configuración: título en español.
- Requisitos y plan: autorización explícita registrada.

## Resultados por criterio

| Criterio | Resultado |
|---|---|
| R-01: textos de interfaz | Cumplido por revisión de plantillas, incluidos placeholders, estados y etiquetas accesibles |
| R-02: mensajes propios | Cumplido por revisión de componentes y servicio; errores externos mantienen su mensaje original |
| R-03: título y ayuda | Cumplido; título Configuración y ayuda de dirección sin referencia al inglés |
| R-04: comportamiento conservado | Diff revisado: únicamente textos y título; compilación y tipos correctos. Interacción visual pendiente |
| R-05: datos preservados | Diff revisado: no se modificaron consultas, claves, valores técnicos ni interpolaciones de datos |

## Comandos ejecutados

- `node node_modules/typescript/bin/tsc --project tsconfig.app.json --noEmit --incremental false`: salida 0, sin diagnósticos.
- `npm run build`: dos intentos dentro del sandbox (uno con `NG_BUILD_MAX_WORKERS=1`) finalizaron con código 134 sin diagnóstico. La ejecución fuera del sandbox terminó correctamente con salida 0; total inicial 3,32 MB y chunk de configuración 29,96 kB.
- `git diff --check`: sin errores.
- Revisión del diff y búsqueda de textos ingleses propios: realizadas.

## Límites

No se encontraron herramientas de navegador disponibles en esta sesión; no se realizó revisión visual ni interacción de tema/dirección. No se ejecutaron escrituras de roles ni conexiones a Supabase. No se ejecutó Karma: no hay suites unitarias identificadas y no se añadieron pruebas que repliquen literales de traducción.

La miga global Home, header, sidebar y perfil están fuera del alcance aprobado. Los nombres, códigos, descripciones y errores externos pueden conservar su idioma original. No hubo cambios de base de datos, dependencias, commits ni pushes.

Los cambios preexistentes de AGENTS.md, Pandas11.sql y archivos sin seguimiento se conservaron.

## Revisión UI/UX posterior — 2026-10-23

La solicitud posterior autorizó extender esta pantalla y el rótulo del menú lateral. La validación histórica anterior corresponde solo a la traducción original.

| Criterio | Resultado |
|---|---|
| UX-01 | Menú lateral «Configuración», ruta `/configuracion` y permiso conservados. «Menú» también queda en español; los enlaces e íconos del menú tienen nombre accesible al colapsarse. |
| UX-02 | La página agrupa enlaces visibles en Portada pública, Acceso del equipo y Tu espacio personal; conserva las condiciones `home_flyers.manage` y `security.read`. RN-31 sigue aplicando al editor de panfletos. |
| UX-03 | Acciones específicas en cada tarjeta. El texto de roles distingue quien puede administrar de quien solo consulta según `roles.manage`. |
| UX-04 | Apariencia explica el alcance local, opciones de orden sin siglas técnicas y acción «Descartar cambios» diferenciada de guardar. No se alteraron `light`/`dark`, `ltr`/`rtl` ni `ThemeService`. |
| UX-05 | Recorrido Chrome local con cuenta OWNER sintética a 1280 y 390 px, claro y oscuro/RTL: tres grupos visibles, apertura de Apariencia y ancho de documento igual al viewport. Capturas revisadas; se ajustó el espacio entre tarjetas y acciones. |

`npm run build` pasó con la advertencia ya existente del presupuesto CSS de la portada (118 bytes). Dos pruebas Karma existentes del menú lateral pasaron. Se revisó `git diff --check`. No hubo nuevas consultas, escrituras de roles, cambios SQL/RLS, dependencias ni despliegue remoto. La revisión de permisos STAFF/CLIENT se basó en las condiciones de plantilla y guards existentes; el recorrido visual se hizo con OWNER. No se realizó estudio con usuarios.
