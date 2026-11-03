# Validación de revisión del modelo

## Continuación MDB-08/MDB-09 — 2026-10-21

- MDB-08: H-03 a H-23 contrastados individualmente con migraciones y código; resultado y límites en [conciliation.md](conciliation.md). No implica resolver todas las ampliaciones futuras ni aceptar el ERD por el negocio.
- MDB-09: dos nuevas pruebas Angular con FullCalendar real consultan COMPLETED/CANCELLED en 2020, filtran estado, abren el evento, conservan precio/minutos/trabajador, muestran motivo y rechazan guardar la reserva terminal; reabren la ficha. Backend simulado en esas pruebas.
- Se añadieron siete comprobaciones API a `scripts/test-appointments-api.mjs`: consulta STAFF por rango/estado de ambas citas pasadas, conservación de snapshots/asignación, motivo/autor/fecha de cancelación y repetición de consulta persistida. Se trasladaron al pasado únicamente fixtures propios mediante PostgreSQL; sin alterar reloj, datos ajenos ni permisos operativos. La limpieza propia terminó sin errores.

| Comando | Resultado de esta ejecución |
|---|---|
| `npm test -- --watch=false --browsers=ChromeHeadless` | 92/92 correctas, incluidas las dos nuevas |
| `node scripts/test-appointments-api.mjs` | 82 comprobaciones correctas, incluidas las siete nuevas; el script ejecutó también `supabase test db` con éxito |
| `npm run build` | Correcto; bundle inicial 3,42 MB. Advertencia del CSS de inicio: 4,12 kB frente a presupuesto de 4 kB, exceso de 118 bytes; archivo no modificado |
| `node --check scripts/test-appointments-api.mjs` | Correcto |

Revisión final: `git diff --check` correcto; 163 enlaces locales válidos, 21 hallazgos H-03 a H-23 clasificados una vez, cuatro ALTER TABLE redundantes de identidad ausentes y estado de 3.5 coherente con aceptación pendiente.

El primer intento de Angular dentro del sandbox terminó con código 134 sin diagnóstico adicional; la repetición autorizada fuera del sandbox pasó. Supabase no pudo consultarse inicialmente por acceso restringido y después por Docker Desktop pausado; el usuario lo reanudó y la prueba API final funcionó contra 127.0.0.1:55321/55322. No se imprimieron claves.

Sin nueva migración, dependencias, cambios de interfaz/consulta productiva, reset, commits, pushes ni conexiones remotas. El build no acredita un recorrido humano con backend. 3.5 queda **validado localmente** con aceptación humana y capturas pendientes.

## Conciliación MDB-06/MDB-07 — 2026-10-21

El SQL actual había vuelto a incluir cuatro ALTER TABLE redundantes, aunque la validación histórica inferior registraba su retirada. Corregidos tras la autorización de continuar con la recomendación; las cuatro FKs inline con ON DELETE CASCADE coinciden con la migración de identidad. No se conoce cuándo reaparecieron las declaraciones.

- MDB-06: comprobación estática Python correcta de las cuatro relaciones en los CREATE TABLE activos del modelo y de la migración. Comparación con HEAD confirma que el único cambio SQL es retirar esas cuatro declaraciones redundantes. No cambia el esquema definido por las migraciones operativas y no requiere nueva migración.
- MDB-07: alcance de 3.5 actualizado en reglas de negocio, matriz, anexo y guía de evidencias: consultar citas pasadas y canceladas. Recorrido documentado con RN-13/RN-14/RN-15; su ejecución y aceptación siguen pendientes. El código de agenda muestra motivo de cancelación, sin presentar autor/fecha en ese bloque.
- Enlaces: 128 referencias locales comprobadas en los documentos modificados antes de añadir esta nota; destinos existentes.
- Una primera comprobación seleccionó un CREATE TABLE comentado y falló; corregida para excluir comentarios SQL, la verificación final pasó.
- Sin ejecución de SQL, migraciones, pruebas de base de datos/API, recorrido visual ni conexión local/remota. Sin cambios Angular: no se ejecutaron build ni pruebas unitarias. La comprobación estática no acredita funcionamiento PostgreSQL ni despliegue.

Esta sección describe el primer paso. La continuación superior registra la conciliación individual H-03 a H-23 ya realizada, manteniendo las acciones futuras de cada hallazgo.

Fecha: 2026-10-17. Estado: revisión estática completada; implementación pendiente.

MDB-01 a MDB-04: cumplidos documentalmente en review.md y requirements.md. MDB-05: plan de pruebas locales definido; ejecución pendiente de aprobación.

Leídos Pandas11.sql completo, skill sdd-feature, requisitos/plan de Fase 0 y reglas de negocio; contrastados servicios de mascotas/tarifas/citas Angular. Fuentes oficiales PostgreSQL y Supabase consultadas para restricciones y RLS.

Hallazgo de sintaxis confirmado por lectura: punto y coma dentro de CREATE TABLE appointments después de pickup_fee. No se afirma que sea el único error que revelaría ejecutar el SQL.

No se ejecutó el SQL, parser PostgreSQL, migraciones, lint de base de datos, tests ni build Angular. No se conectó Supabase local/remoto; no se alteró Pandas11.sql ni código. Revisión de enlaces locales y git diff --check para esta entrega documental.

## Correcciones mínimas autorizadas — 2026-10-17

H-01 corregido: coma después de pickup_fee. H-02 corregido: retiradas cuatro FKs redundantes del bloque ALTER TABLE, conservando las inline con ON DELETE CASCADE.

Verificación estática con Python: separador correcto, cuatro relaciones inline presentes y ausencia de sus ALTER TABLE duplicados. Diff SQL revisado; git diff --check correcto. Un primer intento de comprobación incluyó bloques comentados y se corrigió para seleccionar solo CREATE TABLE activos; la comprobación corregida pasó.

psql disponible, sin conexiones realizadas. Parser opcional pglast no instalado; no se instalaron dependencias. No se ejecutó SQL, migraciones o tests de base de datos. No se declara validación completa de sintaxis ni integridad en PostgreSQL. La validación aislada con Supabase CLI continúa pendiente en su etapa.

No corresponde build Angular: sin cambios de frontend. Cambios preexistentes preservados. La sección inicial describe la revisión previa; esta sección registra las modificaciones posteriores. H-03 a H-23 no se consideran resueltos.
