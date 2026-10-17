
---
name: sdd-feature
description: Planifica e implementa funcionalidades de
  Angular y Supabase mediante SDD. Úsala cuando
  se solicite una funcionalidad nueva o un cambio
  importante en el comportamiento existente.
---

# SDD Feature

## Objetivo
Desarrollar funcionalidades sin romper el
comportamiento existente.

## Fase 1: Comprender
- Leer AGENTS.md y las especificaciones.
- Consultar specs/business-rules.md e identificar reglas aplicables y preguntas pendientes.
- Leer Pandas11.sql como modelo local de referencia e identificar tablas, columnas, relaciones, enums y restricciones aplicables. Contrastar con Angular y migraciones; no asumir que refleja el esquema remoto desplegado.
- Revisar el código relacionado.
- Identificar dependencias Angular y Supabase.
- Aclarar requisitos y casos límite.

## Fase 2: Especificar
Crear en specs/features/<nombre>/:

- requirements.md
- plan.md
- validation.md

Los requisitos deben tener criterios de
aceptación verificables.
Referenciar los IDs de reglas de negocio aplicables y aclarar las ambigüedades que condicionen la implementación.
Documentar en plan.md los elementos de Pandas11.sql afectados, o indicar que no hay impacto de datos. Si el cambio requiere modificar el modelo o resolver una discrepancia, presentar la propuesta y obtener aprobación antes de implementarla. Mantener modelo, migraciones y código coherentes tras los cambios aprobados, sin ejecutar el SQL raíz como migración automática.

## Fase 3: Aprobar
Presentar el plan y esperar autorización.
No modificar código todavía.

## Fase 4: Implementar
- Trabajar en tareas pequeñas.
- Respetar la arquitectura actual.
- Limitar los cambios al alcance aprobado.
- No modificar producción.

## Fase 5: Validar
- Ejecutar las pruebas Angular pertinentes.
- Comprobar la compilación.
- Validar migraciones, permisos y RLS
  cuando corresponda.
- Revisar posibles regresiones.
- Registrar evidencia de cumplimiento de las reglas aplicables en validation.md.

## Fase 6: Informar
Entregar:
- Archivos modificados.
- Requisitos cumplidos.
- Pruebas ejecutadas y resultados.
- Problemas pendientes.
- Cambios documentales necesarios.
