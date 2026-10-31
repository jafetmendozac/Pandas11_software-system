# Actividad 5.5 — Ajustes finales de interfaz y usabilidad

Fecha: 2026-10-31 (America/Lima). Estado: **implementado y validado localmente; aceptación operativa pendiente**.

## Contexto y hallazgos comprobados en código

La matriz S1–S14 marcaba 5.5 como parcial al inicio de este trabajo. El diagnóstico siguiente corresponde a ese momento, antes del recorrido visual y de la implementación; no constituye aceptación de usuarios. El sidebar todavía mostraba páginas de ejemplo y una sección «Ejemplos»; el encabezado contenía una búsqueda que solo enfocaba un campo sin ejecutar consultas y ocultaba el selector de rol antes de `xl`. En Productos, el diálogo mezclaba registro e historial y mostraba «versión», «delta» y filtro por UUID. En Reportes, la RPC devolvía filas de cero para un intervalo sin actividad, por lo que la página no explicaba ese estado.

Fuentes: [matriz](../../matriz-seguimiento.md), [reglas](../../business-rules.md), [modelo SQL](../../../Pandas11.sql) y validaciones anteriores de [navegación](../sidebar-navegacion/validation.md), [tema](../tema-turquesa/validation.md), [configuración](../configuracion-experiencia/validation.md) y [reportes](../actividad-5-reportes-retencion/validation.md).

## Requisitos y criterios de aceptación

| ID | Criterio verificable | Reglas aplicables |
|---|---|---|
| UX55-01 | El menú del panel muestra solo accesos operativos permitidos. No muestra «Calendario de ejemplo», Forms, Tables, Pages, Charts, UI Elements, Authentication ni la sección «Ejemplos». Las rutas y archivos de plantilla permanecen, pero no aparecen como tareas del negocio. Los enlaces activos conservan `aria-current` y el filtrado por permiso. | RN-13, RN-21–RN-30, RN-33, RN-36, RN-39, RN-42; NAV-01–NAV-04 |
| UX55-02 | En móvil, una persona con más de un rol puede cambiar la vista desde el menú del encabezado. El botón de ese menú y el del sidebar tienen nombre en español, estado accesible y foco visible. La búsqueda sin acción y el atajo `⌘/Ctrl+K` dejan de ofrecerse. Cambiar rol actualiza los accesos sin mostrar datos de un rol no autorizado. | RN-33, RN-36, RN-39, RN-42; F0-06/F0-07 |
| UX55-03 | El diálogo de stock muestra producto y unidades actuales; la operación frecuente queda antes del historial, que se presenta en sección plegable. Para ajuste, el usuario elige aumentar o disminuir e introduce cantidad entera positiva. El cliente Angular traduce esa elección al signo de `delta`; carga inicial/reposición siguen siendo positivas. La versión no se muestra como decisión de negocio. | RN-22–RN-26, RN-30 |
| UX55-04 | El formulario de movimiento conserva motivo obligatorio, permisos, validación de saldo, `request_id`, `expected_version` y reintento del mismo payload ante resultado desconocido. Mientras exista una operación pendiente, no se cambia el tipo/cantidad ni se cierra el diálogo; el error explica el siguiente paso. | RN-23, RN-24, RN-26 |
| UX55-05 | En `/reportes`, un intervalo con todos los agregados en cero muestra una explicación de ausencia de actividad; conserva tablas de meses y CSV exactos. Los controles y tablas se pueden usar con teclado y en pantalla estrecha, claro/oscuro y RTL. La vista de rol sin permiso no muestra datos ni botones de descarga. | RN-40–RN-42 |
| UX55-06 | Se revisan las rutas operativas activas con roles sintéticos en escritorio/móvil, claro/oscuro, teclado y RTL cuando el entorno lo permita; se registran hallazgos y límites sin afirmar aceptación humana. Las pruebas Angular pertinentes, tipos y build pasan. | RN-01, RN-13, RN-22–RN-30, RN-32–RN-42 |

## Alcance aprobado

El usuario aprobó el 2026-10-31 los cambios concretos del menú, encabezado, stock y reportes y una revisión integral de rutas operativas. No se aprobaron cambios de esquema, reglas de cobro, nuevas consultas, nuevos permisos, dependencias ni despliegue remoto. Los hallazgos adicionales de una revisión visual se documentarán; un cambio funcional fuera de estos requisitos requiere un plan nuevo.
