# Revisión del modelo de base de datos

## Conciliación autorizada — 2026-10-21

El usuario aprobó continuar con la recomendación de conciliar el modelo SQL y precisó que 3.5 solo exige consultar citas pasadas y canceladas. Esta actualización prevalece sobre las decisiones históricas siguientes para ese alcance.

- MDB-06: retirar únicamente los cuatro ALTER TABLE redundantes de `role_permissions` y `user_roles` en `Pandas11.sql`, conservando sus FKs inline con ON DELETE CASCADE y comparándolas con la migración de identidad. No ejecutar el SQL ni modificar migraciones ya existentes.
- MDB-07: registrar el alcance confirmado de 3.5 en el anexo, la matriz y la guía de evidencias; definir un recorrido verificable y conservar pendiente su ejecución/aceptación. Relación con RN-13 (acceso por permisos) y RN-14/RN-15 (conservación del detalle de mascotas y asignaciones).

La corrección MDB-06 es de coherencia del modelo local; no introduce una regla comercial ni acredita el esquema remoto. H-03 a H-23 requieren conciliación individual y no se declaran resueltos mediante esta corrección.

Fecha: 2026-10-17. Estado: revisión entregada; cambios de modelo pendientes de aprobación.

## Alcance

Revisar el archivo actual `Pandas11.sql` completo frente a RN-01 a RN-10, dependencias Angular y propuesta de Fase 0. Documentar cambios necesarios sin modificar SQL, código o base de datos. Esta revisión amplía el análisis, no el alcance de implementación de la Fase 0.

## Criterios

- MDB-01: distinguir sintaxis inválida, integridad insuficiente, incompatibilidad con Angular y decisiones de negocio pendientes.
- MDB-02: reconocer partes correctas y cambios recientes, sin repetir hallazgos ya corregidos.
- MDB-03: registrar recomendaciones por prioridad, regla afectada y ámbito de implementación.
- MDB-04: separar correcciones propuestas de reglas confirmadas; no inferir esquema remoto.
- MDB-05: proponer pruebas locales con Supabase CLI después de aprobar el plan; no declarar validación SQL por una simple lectura.

## Decisiones pendientes

Aprobar primero correcciones mínimas y modelo de identidad; modelar luego agenda por etapas y transporte. Sigue pendiente decidir quién administra permisos, registro público y entorno local desechable. Definir representación de alergias y si el SQL será el modelo objetivo que Angular deberá adoptar.

## Continuación de conciliación y demostración — 2026-10-21

Autorización posterior: «Vamos impleméntalo», interpretada dentro de la recomendación de conciliación y el alcance confirmado de 3.5.

- MDB-08: clasificar individualmente H-03 a H-23 contra migraciones/código, con evidencia y acciones restantes, sin confundir ampliaciones futuras con errores pendientes del alcance operativo.
- MDB-09: probar que el calendario navega al pasado y abre citas COMPLETED/CANCELLED con detalle, snapshots, trabajador y motivo cuando corresponda; recargar la ficha sin permitir modificar citas terminales (RN-13/RN-14/RN-15, F4-08/F4-12). Los mocks Angular no acreditan persistencia ni RLS reales: comprobar API local cuando el entorno esté disponible.
