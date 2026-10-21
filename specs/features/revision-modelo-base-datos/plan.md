# Plan revisado SDD

## Continuación aprobada — 2026-10-21

Autorización: «Vamos con tu recomendación», tras proponer conciliar modelo SQL, migraciones y documentación. Alcance incremental: MDB-06/MDB-07.

1. Comparar las cuatro relaciones de identidad del SQL de referencia con la migración `20261017152256_identity_foundation.sql`.
2. Retirar sus cuatro ALTER TABLE duplicados conservando las declaraciones inline, PKs y ON DELETE CASCADE. No cambiar tablas, datos, RLS ni contratos Angular; no requiere migración porque no cambia el esquema definido por las migraciones operativas.
3. Incorporar la decisión del usuario sobre 3.5 y preparar criterios de demostración, sin atribuir aceptación a un recorrido no realizado.
4. Verificar estáticamente las relaciones, revisar enlaces documentales y ejecutar `git diff --check`. Registrar los límites; no corresponde build Angular para cambios de modelo de referencia y documentación.

El resto de este documento conserva la propuesta y el alcance históricos.

Estado: correcciones mínimas H-01/H-02 aprobadas e implementadas el 2026-10-17. Las demás etapas siguen pendientes. Esta propuesta no aprueba la Fase 0.

1. Revisar hallazgos H-01 a H-23 de review.md y resolver decisiones de modelo.
2. Tras aprobación, corregir sintaxis y FKs redundantes del modelo objetivo, sin aplicar SQL a una base existente. Definir columnas obligatorias/defaults por tabla y estado; no añadir NOT NULL masivamente.
3. Ejecutar Fase 0 solo para las cinco tablas de identidad, usando Supabase CLI y migraciones locales. Incorporar hallazgos de seguridad e integridad aplicables. Mantener pendiente el resto del modelo.
4. En un plan separado, especificar ocupación temporal por trabajador, etapas de baño/corte, traslado y tarifas por tamaño. Modelar pagos y confirmación según RN-08/RN-09 sin anticipar políticas de cancelación.
5. Preparar migraciones de negocio y actualización Angular coordinadas después de aprobar sus requisitos. No ejecutar el SQL raíz sobre el esquema remoto.
6. Validar desde cero en Supabase local desechable mediante CLI: migraciones, lint, pruebas SQL/RLS y de concurrencia. Confirmar previamente que no haya datos locales que preservar. No ejecutar reset remoto ni producción.

## Validación prevista

- Construcción completa del modelo futuro en entorno aislado, no solo parser.
- Pruebas de NULL, FKs, mascotas de otro cliente, fechas, importes y tarifas duplicadas.
- Relevo baño/corte válido y corte por asistente denegado; conflictos de traslado/servicio y solicitudes concurrentes rechazados.
- Domingo denegado; sábado feriado permitido; 17:00 permitido y un inicio posterior denegado; final posterior a 18:00 permitido.
- Autorreserva con S/ 20 y confirmación solo por owner; cita interna sin adelanto obligatorio.
- Pruebas RLS reales por usuario y adaptación Angular cuando se modifique código; build pertinente.

No instalar dependencias, crear migraciones ni modificar Pandas11.sql hasta aprobar el siguiente alcance concreto. Comandos locales y estado CLI previamente comprobados están documentados en la propuesta de Fase 0; no se repitieron ni arrancaron servicios en esta revisión.

## Alcance implementado

Autorizado por el usuario tras proponer comenzar por correcciones mínimas: coma de pickup_fee y retirada de cuatro FKs redundantes, conservando las inline con ON DELETE CASCADE. Las conservadas son inmediatas no diferibles por defecto; se retiraron las duplicadas diferibles inicialmente inmediatas. No se modificaron otras columnas, RLS, Angular ni migraciones. Las siguientes etapas requieren sus decisiones y planes aprobados.

## Ejecución de la continuación — 2026-10-21

1. Crear conciliation.md con evidencia individual H-03 a H-23 y actualizar referencias de cierre de Actividad 1.
2. Añadir dos regresiones de comportamiento en la suite existente de CalendarioComponent: consulta de cita pasada completada y cancelada, apertura desde evento real FullCalendar, detalle inmutable y recarga. No cambiar interfaz ni consultas productivas.
3. Ejecutar suite Angular y build; consultar estado de Supabase local para probar API existente si está disponible. No reanudar servicios pausados por el usuario sin su indicación, ni ejecutar reset/migraciones.
4. Documentar resultados reales y separar aceptación humana pendiente de validación automática. Sin impacto adicional en Pandas11.sql ni nuevas dependencias.
