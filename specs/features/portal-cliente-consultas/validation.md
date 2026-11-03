# Validación — consultas del portal de cliente

Estado: implementación local completada el 2026-11-02 (America/Lima); sin cambios de base ni despliegue remoto.

| Criterio | Resultado |
|---|---|
| PC-01 | Estado final: el sidebar del portal CLIENT ofrece `/mis-datos` y `/catalogo`; Perfil muestra la cuenta y seguridad sin las dos tarjetas duplicadas. Ambas rutas de Perfil comparten el componente. La consulta propia sigue limitada por `profile_id` y RLS. |
| PC-02 | `/mis-datos` consulta `ClientesService.own` y usa el ID de esa ficha para obtener mascotas mediante `search_pets` sujeto a RLS. Presenta ficha, tarjetas de mascotas, antecedentes visibles y vacunas; no llama a notas internas ni ofrece edición. Estados de carga, error, sin ficha y sin mascotas. |
| PC-03 | `/catalogo` muestra solo servicios activos/visibles; selecciona mascota propia para completar tamaño/pelaje y permite modificarlos. `TarifasService.quote` calcula en servidor. Descarta resultados anteriores al cambiar entradas y aclara que no reserva ni incluye transporte. |
| PC-04 | Navegación de texto entre las tres rutas, tarjetas adaptables, controles con etiquetas/foco visible y variantes claro/oscuro. Compilación de plantillas y pruebas DOM correctas. Inspección visual manual pendiente. |
| PC-05 | Sin migraciones, dependencias nuevas, cambios RLS ni datos reales. Las consultas existentes siguen bajo políticas del servidor. |

## Pruebas

- `npx ngc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit`: correctos.
- Pruebas focalizadas de Perfil, Mis datos y Catálogo: 8/8; incluyen navegación directa visible para una cuenta de panel, consulta vinculada, ausencia de vínculo, cotización con mascota y descarte de resultado obsoleto.
- Suite Angular completa: 159/159.
- `npm run build`: correcto; advertencia preexistente de presupuesto CSS en `inicio.component.css` (1,46 kB por encima del aviso).
- `git diff --check`: correcto.

Karma terminó con código 134 dentro del aislamiento antes de mostrar diagnósticos; las ejecuciones fuera del aislamiento pasaron. Un intento de suite completa perdió ChromeHeadless por inactividad, luego pasó al repetirlo. No hay herramienta de navegador disponible para revisar visualmente móvil, oscuro o teclado con sesión real; tampoco se ejecutaron pruebas SQL/API, porque no se cambió el contrato de base ni RLS. La experiencia debe comprobarse manualmente con una cuenta CLIENT sintética vinculada y otra sin vínculo.

## Marco de navegación del cliente — 2026-11-02

PC-06 implementado localmente tras la aprobación explícita del usuario. `/mi-perfil`, `/mis-datos` y `/catalogo` son hijas de `ClientLayoutComponent` y `profileGuard` comprueba la cuenta activa. Tras la corrección solicitada, el marco usa los mismos `AppHeaderComponent`, `AppSidebarComponent` y `BackdropComponent` del panel, con sus clases y comportamiento de colapso. CLIENT ve solo sus tres consultas; el menú de cuenta y el logo llevan a `/mi-perfil`. En móvil el menú se cierra al navegar, tocar el fondo o pulsar Escape. El contenido queda limitado a `max-w-5xl`; las páginas de consulta ya no agregan otra barra de enlaces ni un segundo contenedor de ancho/padding. `/profile` y el panel conservan sus rutas y guard actuales.

Validación final de la corrección: 11/11 pruebas focalizadas del layout, sidebar y encabezado compartidos; suite Angular completa **167/167**; `npm run build` correcto con la advertencia preexistente de presupuesto CSS en `inicio.component.css` (1,46 kB sobre el límite); TypeScript de app y pruebas correcto; `git diff --check` correcto. No se cambiaron migraciones, RLS, permisos ni datos. Queda pendiente inspección visual manual del layout con sesión CLIENT en escritorio/móvil, modo oscuro y RTL; los tests DOM no sustituyen esa revisión.

## Tarjetas retiradas de Mi perfil — 2026-11-02

Se retiraron «Mis datos y mascotas» y «Servicios y precios» del componente compartido de Perfil, por solicitud expresa del usuario. CLIENT mantiene esas rutas en el sidebar; no cambiaron los servicios ni las políticas RLS. La prueba que exigía esas tarjetas se eliminó porque ya no describe el comportamiento requerido.

Comprobación final: tipos de aplicación y pruebas correctos; suite Angular **166/166**; `npm run build` correcto con la advertencia CSS preexistente de `inicio.component.css` (1,46 kB sobre el límite); `git diff --check` correcto. La cifra histórica 167/167 del ajuste anterior incluía la prueba de tarjetas ahora obsoleta.

## Icono y solapamiento del sidebar — 2026-11-02

PC-07: en el estado contraído de escritorio se usa `Logo.png`, la marca existente de Pandas 11, en lugar del icono genérico `logo-icon.svg`. Por debajo de `xl`, el bloque de logo del sidebar se oculta porque el encabezado ya contiene la marca; el menú comienza con espacio superior suficiente para no asomar bajo ese encabezado. El ajuste afecta al panel y al portal CLIENT por usar el mismo componente. No cambia opciones, rutas o permisos.

Validación: `npx ngc -p tsconfig.app.json --noEmit` correcto, suite Angular **166/166** y `npm run build` correcto con la advertencia CSS preexistente de `inicio.component.css` (1,46 kB sobre el límite). `git diff --check` correcto. No se pudo verificar visualmente en una sesión local: no había servidor Angular ni Supabase en ejecución; los tests y la compilación no prueban el recorte visual exacto a cada ancho de pantalla.

## Cambio de móvil a escritorio — 2026-11-03

PC-08: `AppHeaderComponent` cierra el estado `isMobileOpen$` y las opciones móviles al alcanzar 1280 px. Ambos layouts comparten este encabezado y consumen el mismo estado para colocar el contenido, por lo que recuperan el margen de escritorio. La prueba de regresión abre el menú a 390 px y comprueba su cierre y el icono del encabezado a 1440 px.

Validación: prueba focalizada del encabezado **5/5**; `npx ngc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit` correctos; `npm run build` correcto con la advertencia CSS ya registrada. La suite completa ejecutó **170 pruebas: 159 correctas y 11 fallidas**. Diez fallos corresponden a dobles de `AuthorizationService` que carecen de `isSessionValidated` en pruebas de guardia e inicio público; el restante es una expectativa de tamaño de página 5 frente al valor 10 emitido por `PersonalizedTable`. Ninguno está en el encabezado modificado. La prueba visual de abrir DevTools en móvil y cerrarlo queda pendiente de realizar en el navegador del usuario.
