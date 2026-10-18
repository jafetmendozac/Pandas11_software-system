# Revisión del modelo de base de datos

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
