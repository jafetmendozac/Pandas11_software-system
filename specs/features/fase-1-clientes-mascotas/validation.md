# Validación — Fase 1

Fecha: 2026-10-17. Estado: implementación local completada y validada; sin despliegue remoto.

## Alcance entregado

Migración incremental `20261017201505_clients_pets.sql`: cinco tablas del modelo local y enums, constraints/defaults, permisos, RLS y RPC de clientes/baja lógica/búsqueda. Se aplicó sobre identity-dev existente con `supabase migration up --local`, sin reset ni modificaciones de cuentas del usuario. Pandas11.sql actualizado con las mismas restricciones y defaults.

UI reutiliza clientes y mascotas, incorpora búsqueda/paginación en servidor, vacunas, notas internas, archivo de lectura y consulta propia en `/mis-datos`. Tabla compartida conserva modo legacy por eventos y añade callback asíncrono optativo que mantiene formulario/datos ante fallo. Fichas públicas e internas usan consultas separadas.

## Criterios

| Criterio | Evidencia |
|---|---|
| F1-01 | Migración aplicada incrementalmente; preflight confirmó ausencia de las cinco tablas. Sin reset ni datos reales en fixtures |
| F1-02 | Clientes con/sin perfil, vínculo por RPC con permiso y mascotas asociadas; UI desde listado y ficha |
| F1-03 | RPC invoker bajo RLS, búsqueda literal parametrizada; prueba de apóstrofe/teléfono/dueño y 1002 filas con página posterior a límite 1000 |
| F1-04 | SQL/API comprueba TOY, allergies boolean, nombres/peso/fechas; tipos/formularios alineados |
| F1-05 | Vacunas de mascota: lectura, registro/corrección y validación temporal por SQL/API y servicio |
| F1-06 | CLIENT sin filas internas, incluido join embebido; autor/fecha controlados por servidor. Prueba de componente comprueba ausencia de consulta/textarea interna para cliente |
| F1-07 | Pruebas OWNER/ADMIN/STAFF/CLIENT A y B/anon, no transferencia, no vínculo propio, no falsificar autor |
| F1-08 | Retiro conserva mascota/vacunas/notas, cliente deja de verlas; STAFF consulta archivo y escrituras de archivo afectan cero filas o se rechazan |
| F1-09 | Pruebas tabla: mantener formulario/datos ante error, esperar confirmación, validar selectores, modo legacy, paginación remota; guard exige permiso de dominio |
| F1-10 | SQL/API y regresión Angular ejecutadas; tipos, lint y build; sin cambios remotos |

## Ejecuciones

- `supabase migration new clients_pets`: creó nueva migración con CLI.
- Preflight SQL local de tablas en modo lectura: ninguna de las cinco existía; se evitó cualquier conciliación destructiva.
- `supabase migration up --local`: correcta; no reset.
- `node scripts/test-clients-pets-api.mjs`: 42 comprobaciones correctas, incluida paginación con 1002 fixtures. Limpieza por UUID/prefijo aleatorio exclusivamente propio.
- `supabase test db`: 30/30 correctas (14 Fase 1 + 16 identidad).
- `supabase db lint --local`: sin errores.
- TypeScript app y specs sin emisión: correctos.
- `npm test -- --watch=false --browsers=ChromeHeadless`: 20/20 correctas, incluidas pruebas de detalle, permiso de ruta y regresión de tabla/Fase 0.
- `npm run build`: producción correcta tras últimos ajustes; total inicial 3,33 MB.
- `node scripts/test-identity-api.mjs`: 26 comprobaciones correctas tras aplicar Fase 1.
- `git diff --check`: sin errores.

## Hallazgos corregidos durante validación

Una aserción API esperaba error al denegar UPDATE por RLS; se corrigió para comprobar cero filas y nombre original intacto. Las pruebas de detalle detectaron falta de notificación al completar cargas asíncronas; se añadió markForCheck en páginas/detalle y callbacks de tabla. El textarea de consulta se hizo readOnly para impedir que la inicialización de ngModel alterara su estado disabled.

## Límites

No hubo recorrido manual de la aplicación con datos reales. ChromeHeadless valida componentes y controles de lectura; no sustituye una revisión visual completa del negocio. No hay Storage, adjuntos/fotos gestionados, historial de revisiones, diagnósticos, citas o pagos en esta fase. document_url/photo_url se conservan en modelo pero no se cargan automáticamente ni se ofrecen controles de subida.

No se modifican políticas de identidad; únicamente catálogo/asignaciones de permisos por migración privilegiada. OWNER/ADMIN editan, STAFF consulta, CLIENT solo consulta ficha vinculada. Detalles de alergias en notas internas; notas 1:1 con último autor/fecha. Las declaraciones históricas de baseline/architecture sobre ausencia de estas tablas ya no describen identity-dev actual.

## Ajuste visual de tablas compartidas — 2026-11-03

UI-01: el encabezado de `PersonalizedTable` conserva el fondo de la tabla; destaca mediante línea inferior y texto seminegrita de mayor contraste en claro y oscuro. Los títulos usan `scope="col"`. El componente se reutiliza en clientes, mascotas, servicios, tarifas y empleados. `npx ngc -p tsconfig.app.json --noEmit`, `npm run build` y `git diff --check` pasaron para la versión inicial; la corrección sin fondo se verificó de nuevo con compilación y diff. No se hizo una inspección visual en navegador de esta modificación.

UI-02: en móvil el nombre es el título de la tarjeta y ya no aparece de nuevo en el detalle; si no existe columna de nombre se usa la primera. Las etiquetas restantes usan el mismo peso y contraste, los valores tienen peso normal y pueden ocupar varias líneas. Las pruebas DOM de servicios y clientes verificaron que el nombre no se duplica y que «Perfil relacionado» no sustituye al título del cliente. `npx ngc -p tsconfig.app.json --noEmit`, `npx tsc -p tsconfig.spec.json --noEmit`, `npm run build` y `git diff --check` pasaron. La prueba focalizada ejecutó 7 casos: 6 correctos y un fallo previo de paginación (espera tamaño 5, recibe 10); los dos casos nuevos pasaron. El build mantiene la advertencia CSS previa de la portada. No hubo inspección visual en navegador.

## Ficha de mascota por ruta — 2026-11-06

UI-03 / F1-02, F1-05, F1-06 y F1-08: «Ver antecedentes» de `/mascotas` ahora navega a la ruta protegida `/mascotas/:id` y conserva búsqueda/página/archivo al volver. La ficha muestra el nombre, propietario, alertas operativas y datos de la mascota antes de reutilizar el componente de vacunas, observaciones del cliente y notas internas. `MascotasService.get` devuelve una fila solo si coincide con el modo operativo o archivo y Supabase mantiene la decisión final mediante RLS. Para ausencia o denegación se muestra un único mensaje sin divulgar datos. No hubo SQL, migraciones, RLS ni cambios remotos.

Validación: `npx ngc -p tsconfig.app.json --noEmit`, `npx tsc -p tsconfig.spec.json --noEmit` y `git diff --check` correctos. ChromeHeadless ejecutó 7/7 pruebas focalizadas: navegación y contexto del listado, carga de ficha, estado no disponible y regresiones de antecedentes. Falta una revisión manual visual con una sesión conectada a Supabase; no se afirma como realizada.

Corrección posterior: la ficha conserva el resumen operativo único en su primera tarjeta. `RecordDetailsComponent` recibe una opción de presentación para ocultar esa repetición cuando se reutiliza dentro de la ficha y deja visibles antecedentes, observaciones, vacunas y notas internas. Su comportamiento existente conserva el resumen por defecto. La prueba de la ficha verifica que hay exactamente seis términos del resumen y no se duplica.

## Ficha de cliente por ruta — 2026-11-06

UI-04 / F1-02, F1-05, F1-06 y F1-08: «Consultar ficha y mascotas» de `/clientes` ahora navega a `/clientes/:id`; se retiró el drawer lateral y su estado transitorio. La ficha muestra el contacto una vez, notas internas sujetas a permiso y la tabla paginada de mascotas asociadas. Las acciones de mascota respetan `pets.manage`, las fichas archivadas son de solo lectura y cada antecedente lleva a la ficha de mascota. `ClientesService.get` mantiene RLS como autorización final y solo devuelve una fila en el modo operativo/archivo solicitado. La tabla de mascota usa `breed_id`, no el campo inexistente `breed`. No hubo SQL, migraciones, cambios RLS ni cambios remotos.

Validación: `npx ngc -p tsconfig.app.json --noEmit`, `npx tsc -p tsconfig.spec.json --noEmit` y `git diff --check` correctos. ChromeHeadless: 8/8 pruebas focalizadas, incluyendo navegación/contexto, carga/no disponibilidad de cliente, mascotas asociadas y regresiones de ficha/antecedentes. Falta una revisión manual con sesión y datos locales de Supabase; no se afirma como realizada.

Corrección posterior: al abrir antecedentes desde la ficha de cliente, la navegación transmite el cliente de origen y el botón «Volver» de la mascota apunta a `/clientes/:id`, manteniendo búsqueda, página y archivo del listado original. Desde el listado global de mascotas se mantiene el retorno a `/mascotas`.

## Corrección del formulario de mascotas — 2026-11-05

Alcance F1-02/F1-04: se retiró la columna de texto `breed`, que duplicaba «Raza» y no existe en `pets`; queda el selector `breed_id` cargado desde `pet_breeds`. Alergias, Muerde y Estado usan el control de radio existente de la tabla, ahora extraído como componente reutilizable `RadioOptionsComponent` con grupo etiquetado por `fieldset`/`legend`. Conserva los valores iniciales No, No y Activo y los booleanos al editar. Servicios sigue usando el mismo control de radio sin cambiar opciones ni persistencia. No se alteraron esquema, RLS ni permisos; RN-03/RN-04/RN-05/RN-07 permanecen sin cambios.

Validación: `npx ngc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit` correctos; 10/10 pruebas focalizadas de tabla y mascotas correctas en ChromeHeadless; `npm run build` correcto con la advertencia CSS previa de `inicio.component.css`; `git diff --check` correcto. El test anterior de paginación se configuró con el tamaño de página que esperaba. La compilación y las pruebas se ejecutaron fuera del sandbox porque `esbuild` se bloqueó dentro de él. No hubo inspección visual manual ni cambios remotos.

## Formulario compartido en pantallas pequeñas — 2026-11-05

El modal de creación/edición de `PersonalizedTable` limita su ancho y alto al espacio visible (`100dvh`) y permite desplazar el contenido dentro de él. Así, los formularios largos de mascotas y de las demás tablas compartidas mantienen alcanzables los campos finales y los botones Guardar/Cancelar. Es un ajuste de F1-02/F1-09; no cambia datos, validaciones, permisos ni las reglas RN-03/RN-04/RN-05/RN-07.

Validación: 10/10 pruebas focalizadas de la tabla en ChromeHeadless, incluida una prueba con 24 campos que comprueba desplazamiento y alcance del botón Guardar; `npm run build` correcto con la advertencia CSS previa de `inicio.component.css`. Las ejecuciones de Angular se realizaron fuera del sandbox por el bloqueo de `esbuild` observado anteriormente. No hubo revisión visual manual en un dispositivo móvil ni cambios remotos.

Intento posterior al reporte del usuario: se añadió un pie `sticky` al área desplazable para mantener visibles Guardar y Cancelar. La prueba con 24 campos comprobó los botones desde el inicio y tras desplazarse; pasó 10/10 en ChromeHeadless normal y con un launcher de 375 × 667 px, pero no detectó que el pie tapaba campos. Esta solución fue reemplazada por la corrección siguiente.

Corrección tras capturas del usuario: el pie `sticky` se superponía a campos y la prueba anterior no comprobaba el último campo. El formulario separa ahora un contenedor `<div>` desplazable para los campos y un pie de acciones fuera de él; el `fieldset` conserva la deshabilitación de controles durante el guardado. La prueba focalizada comprueba con 24 campos que el último input llega a quedar sobre el pie y que Guardar/Cancelar están visibles; 10/10 pasaron con ChromeHeadless configurado a 375 × 667 px y 10/10 con el viewport habitual. `npm run build` pasó con la advertencia CSS previa de `inicio.component.css`; `git diff --check` pasó. La revisión visual con el navegador/dispositivo del usuario sigue pendiente.
