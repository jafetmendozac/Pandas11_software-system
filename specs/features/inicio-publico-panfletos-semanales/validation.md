# Validación — panfletos semanales del inicio público

Fecha: 2026-10-23 (America/Lima). Estado: **implementado y validado en Supabase local; pendiente de adopción remota y contenido real**.

## Resultado por criterio

| Criterio | Evidencia local |
|---|---|
| PS-01 · día de Lima | `weekdayInLima` usa `Intl` con `America/Lima`; pruebas de cruce de medianoche y domingo. La portada reconsulta al cambiar el día sin dejar un temporizador dentro de Angular. |
| PS-02 · siete espacios y respaldo | Migración crea exactamente las filas 1–7; con filas vacías no aparece una sección ni imagen rota y se conserva la portada informativa. |
| PS-03 · editor OWNER/ADMIN | Ruta protegida `/configuracion/panfletos`, enlace en configuración por permiso, selector de siete días, vista previa, texto alternativo y publicación. Recorrido local con OWNER: carga, guarda y muestra «Publicado». |
| PS-04 · aislamiento | Prueba API local: anon no lee filas vacías ni firma objetos sin publicar; STAFF no carga ni guarda; ADMIN carga; OWNER publica; anon lee y firma solo el objeto activo; actualización directa denegada; versión obsoleta denegada; tras desactivar, anon pierde lectura/firma. Una URL ya firmada puede seguir válida hasta su vencimiento de cinco minutos. |
| PS-05 · fallo y reemplazo | Se validan MIME, tamaño y texto alternativo; carga a ruta aleatoria sin sobrescribir la imagen vigente; RPC versionada. Test de editor comprueba que un fallo confirmado de carga conserva la selección y permite corregir/reintentar. El resultado incierto conserva la misma operación para reintento. |
| PS-06 · presentación | Recorrido Chrome local a 1280 y 390 px: portada con/sin imagen temporal, editor vacío/publicado, claro y oscuro/RTL; sin desbordamiento horizontal. Imagen completa, texto alternativo y diálogo ampliado con cierre Escape en prueba de componente. |
| PS-07 · regresiones | Suite Angular y SQL, lint, compilación, prueba API local y revisión visual; resultados abajo. |

## Comandos y resultados

- `supabase migration up --local`: migración incremental aplicada sin reset.
- `node scripts/test-home-flyers-api.mjs`: **14 comprobaciones correctas** con cuentas e imagen sintéticas; se eliminaron los datos creados.
- `supabase test db`: **272 pruebas correctas** en nueve archivos de regresión.
- `supabase db lint --local --schema public`: sin errores. El primer intento agotó el tiempo de conexión local; la repetición pasó tras confirmar PostgreSQL con `psql`.
- `npx tsc --noEmit -p tsconfig.spec.json`: correcto.
- `npm run build`: correcto; advertencia preexistente de presupuesto CSS en `inicio.component.css` (118 bytes).
- `npm test -- --watch=false --browsers=ChromeHeadless`: **119 pruebas correctas** tras la última corrección de UX.

Las primeras ejecuciones de Karma dentro del sandbox terminaron por un bloqueo de esbuild antes de ejecutar casos; ChromeHeadless fuera de ese aislamiento sí ejecutó la suite. Un caso inicial esperaba estabilidad mientras el temporizador de cambio de día estaba activo; se ajustó el temporizador para que no bloquee Angular y los nueve casos focalizados pasaron.

## Revisión UI/UX con `pandas-ui-ux`

Recorrido representativo: OWNER entra a Configuración → Panfletos, elige el día, carga imagen, describe el contenido, activa la publicación y guarda; después comprueba la portada. La selección es visible y los otros días muestran «Publicado», «Sin publicar» o «Sin imagen». La vista previa y el mensaje de resultado muestran el efecto antes y después de guardar.

- **Fricción corregida:** el selector de archivo ahora se limpia al descartar, cambiar de día o guardar; elegir el mismo archivo nuevamente funciona.
- **Fricción corregida:** un fallo de carga confirmado deja el archivo y el formulario editables con mensaje de recuperación; un resultado incierto conserva la operación para reintentar sin duplicar la carga.
- **Comprobación visual:** 390/1280 px, claro y oscuro/RTL sin desbordamiento horizontal; editor con imagen sintética publicada y portada de ese día. No se observaron bloqueos visuales en el recorrido.

## Límites y estado final

No se inspeccionó ni modificó el proyecto Supabase remoto. Las siete posiciones locales quedaron vacías y sin publicar después de la prueba; el negocio debe aportar y cargar imágenes autorizadas cuando adopte la migración. No se esperaron cinco minutos para medir la caducidad real de una URL firmada; el servicio la solicita por 300 segundos y la renueva al abrir el diálogo. No hubo pruebas con usuarios ni auditoría de accesibilidad automatizada completa.
