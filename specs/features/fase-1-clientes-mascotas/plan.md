# Plan técnico — Fase 1

Estado: aprobado por el usuario el 2026-10-17; implementación local.

## Análisis

Revisados skill, reglas, tablas de Pandas11.sql, páginas/servicios de clientes y mascotas, y migración de identidad. Conservar standalone, formularios existentes, tokens, RTL y español; no añadir dependencias ni reorganizar carpetas.

## Implementación propuesta tras aprobación

1. Crear con Supabase CLI una migración incremental: enums de dependencia y las cinco tablas extraídas del modelo local, FKs/índices y constraints necesarios. UUID y timestamps con defaults; nombres no vacíos, cliente/mascota/vacuna obligatorios según el caso y fechas/peso coherentes. Reflejar cambios aprobados en Pandas11.sql y documentarlos.
2. Añadir permisos de dominio al catálogo y asignaciones de roles de sistema por migración, manteniendo las invariantes de Fase 0. Definir helpers de propiedad seguros y RLS en cada tabla; las notas internas nunca se conceden al cliente. No basar seguridad en filtros frontend.
3. Operaciones controladas para vínculo cliente–perfil y retiro lógico; grants de columnas para impedir manipular propietario, autor, created_at/deleted_at. Los helpers de lectura propia excluyen cliente/mascota retirados; notas y vacunas siguen la visibilidad de su padre. Personal con permisos conserva acceso de lectura a archivos.
4. Actualizar tipos/servicios de clientes y mascotas con allergies boolean y TOY. Añadir servicios tipados para vacunas y notas. Separar consultas internas; no serializar notas internas en DTOs de consulta propia. Acordar nullability antes de endurecer restricciones.
5. Reutilizar listados existentes; agregar detalle cliente/mascota con información visible, vacunas y sección interna por permiso. Búsqueda y paginación en servidor con orden estable y filtros tipados/escapados, sin interpolar valores sin validar en filtros PostgREST. No depender de carga de perfiles completa para usuarios sin profiles.read; solo OWNER/ADMIN seleccionan vínculo.
6. Corregir persistencia optimista de tabla compartida solo en lo necesario: flujo con estado pendiente y confirmación del padre; mantener compatibilidad con servicios/tarifas/empleados existentes. Validar selectores y formularios antes de emitir acciones; conservar datos ante error.
7. Añadir ruta de consulta propia fuera del shell administrativo para CLIENT y navegación desde su perfil. Panel: guards y controles clients.read/pets.read y permisos de escritura; ningún permiso operativo implícito por panel.access.
8. Crear tests SQL/API para propiedad, notas internas, vacunas, bajas lógicas y validación de payloads; Angular para formularios y estados de error. Fixtures aleatorios aislados y limpieza solo de datos de prueba. Repetir suite Fase 0, lint, tipos y build.
9. Aplicar únicamente migraciones nuevas a identity-dev (`supabase migration up --local`, verificando disponibilidad en la CLI instalada). No reset: hay cuentas del usuario que deben preservarse. No link/push/repair ni ejecución remota. Si aparecen tablas locales preexistentes incompatibles, detener esa aplicación y presentar conciliación; no usar IF NOT EXISTS para ocultar diferencias.
10. Documentar resultados, cobertura y límites; actualizar architecture, baseline y roadmap tras validar.

## Impacto previsto

- Nueva migración, pruebas SQL/API y actualización del modelo local para constraints/defaults aprobados.
- Servicios y páginas de clientes/mascotas; componentes de detalle/formulario en estructura existente.
- Cambios acotados en tabla compartida con pruebas de compatibilidad.
- Guard/rutas/sidebar y acceso desde perfil propio.
- No cambios de negocio a identidad, salvo extender catálogo/asignaciones mediante migración.

## Límites y riesgos

Una nota 1:1 no es un historial de consultas ni revisiones. Mantener allergies boolean evita divergencia con el SQL, pero requiere resolver dónde leer los detalles. No descargar/abrir URLs remotas sin acción explícita ni convertir un document_url en comprobante público. La baja de cliente no debe borrar mascotas o vacunas: ocultar por relación y preservar historia. No transferir mascotas para evitar romper FKs compuestas de citas futuras.

El esquema remoto permanece desconocido. La adopción remota necesita una revisión separada. Confirmar matriz y decisiones de requirements.md antes de implementar; no inferir aprobación de esta fase a partir de la Fase 0.

## Aprobación y concreción

El usuario autorizó proceder con la propuesta: OWNER/ADMIN editan; STAFF consulta; CLIENT consulta su ficha/mascotas sin notas internas. Allergies permanece boolean y detalles narrativos son internos; una nota editable por ficha, sin historial de revisiones ni Storage. Migración incremental local sin reset ni adopción remota.
