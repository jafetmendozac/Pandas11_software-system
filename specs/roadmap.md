# Hoja de ruta SDD

Fecha de referencia: 2026-10-15 (America/Lima).
Estado: propuesta de adopción; únicamente la creación de estos cinco documentos está autorizada en esta entrega.

## Estado inicial

No se clasifica ninguna funcionalidad de negocio como validada de extremo a extremo. “Código existente” describe implementación local, sin acreditar despliegue, permisos o comportamiento remoto.

| Área | Código existente | Trabajo pendiente |
|---|---|---|
| Autenticación | Correo/contraseña, registro, sesión y salida | Verificar confirmación, permisos y flujos incompletos |
| Clientes y mascotas | CRUD y bajas lógicas | Validaciones, errores, pruebas y RLS |
| Servicios y empleados | CRUD y desactivación | Validaciones, permisos y pruebas |
| Tarifas | CRUD y eliminación física | Acordar comodines y resolución de precio/duración |
| Perfil | Consulta y edición | Validar permisos y comportamiento ante perfil ausente |
| Roles | Roles y permisos por rol | Asignación de usuarios y autorización verificable |
| Agenda | Carga, creación y edición | Resolver contrato SQL, estados, atomicidad y disponibilidad |
| Apariencia | Tema y dirección locales | Validación de regresiones cuando se modifique |
| Dashboard y facturas | Pantallas de demostración | Decidir si se conectan a datos del negocio |
| Pagos, notificaciones, vacunas, horarios, bloqueos y auditoría | Modelo SQL local | Confirmar alcance; sin flujo conectado identificado |

## Etapas propuestas

### Etapa 0: revisión documental

Entregable actual: `mission.md`, `tech-stack.md`, `architecture.md`, `roadmap.md` y `baseline.md`.

Criterio de salida: revisión del usuario y resolución o aceptación explícita de incertidumbres. La aprobación de la auditoría no equivale a aprobar todas las implementaciones propuestas.

### Etapa 1: contratos y autorización

Preparar requisitos y plan para acordar modelo canónico de citas, estados, usuarios, permisos y disponibilidad. Confirmar procedencia del SQL y políticas aplicadas antes de proponer cambios.

Criterio de salida: decisiones aprobadas y evidencia suficiente del contrato que debe respetar Angular. Cualquier acceso a entornos debe tener alcance explícito; no aplicar cambios en producción.

### Etapa 2: entorno reproducible

Proponer historial de migraciones, configuración local coherente y datos sintéticos. Revisar SQL, seed y políticas antes de ejecutar en un entorno aislado.

Criterio de salida: plan aprobado, esquema reproducible y pruebas de autorización documentadas. No convertir automáticamente los archivos raíz en migraciones ejecutables.

### Etapa 3: funcionalidad piloto

Recomendación pendiente de aprobación: servicios y tarifas, por su alcance acotado y dependencia de la agenda.

Preparar requisitos de validación, errores y reglas de precio/duración. Acordar pruebas pertinentes y ejecutar implementación solo tras aprobar el plan.

Criterio de salida: criterios de aceptación satisfechos, validación documentada y regresiones revisadas.

### Etapa 4: agenda y disponibilidad

Abordar el contrato acordado, relación cliente–mascota, personal habilitado, estados, atomicidad, bajas lógicas, solapamientos, zona horaria y renderizado seguro.

Dependencias: decisiones de etapa 1 y tarifas acordadas. Criterio de salida: pruebas de negocio y permisos con datos sintéticos, además de compilación pertinente.

### Etapa 5: ampliaciones de negocio

Evaluar pagos, notificaciones, facturación, portal público, vacunas, reportes y auditoría solo si el usuario confirma su prioridad. Estar modelado en SQL no constituye una aprobación de implementación.

## Flujo obligatorio por funcionalidad

Consultar [Pandas11.sql](../Pandas11.sql) como modelo local de referencia en cada análisis y plan. Identificar elementos afectados o declarar que no hay impacto de datos; contrastar con Angular y migraciones. Las discrepancias y modificaciones del modelo deben explicarse y aprobarse antes de implementar. El archivo no prueba el estado remoto ni autoriza su ejecución completa sobre una base existente. Los cambios aprobados deben conservar coherencia entre modelo, migraciones, tipos, servicios y especificaciones.

Conforme a `AGENTS.md`: contexto → requisitos → plan técnico → aprobación → implementación incremental → pruebas → revisión y documentación.

Desde 2026-10-16, el análisis incluye [business-rules.md](business-rules.md). Cada funcionalidad debe referenciar los IDs RN aplicables en sus requisitos y registrar su cumplimiento en validación. Las reglas declaradas y las preguntas pendientes no acreditan implementación ni autorizan cambios de base de datos.

Propuesta de ubicación futura, pendiente de revisión: `specs/features/<funcionalidad>/requirements.md`, `plan.md` y `validation.md`. No se crean esos archivos en esta entrega.

- `requirements.md`: actores, reglas, permisos, errores y criterios de aceptación identificables.
- `plan.md`: alcance, archivos, dependencias, riesgos, migraciones si aplican, validación y aprobación.
- `validation.md`: criterios evaluados, comandos, resultados, regresiones y limitaciones.

Una contradicción documental se informa antes de resolverla. Una tarea no se declara terminada si faltan validaciones requeridas sin explicar su limitación.

## Registro de decisiones pendientes

| ID | Decisión del usuario | Estado |
|---|---|---|
| D-01 | Fuente de verdad del esquema y procedencia del SQL local | Pendiente |
| D-02 | Citas con una o varias mascotas y empleados; estados válidos | Pendiente |
| D-03 | Registro público, asignación inicial de roles y matriz de permisos | Pendiente |
| D-04 | Zona horaria, horarios, bloqueos y prevención de solapamientos | Parcial: lunes–sábado incluidos feriados, 07:00–18:00, último inicio 17:00 y finalización posterior permitida; resto pendiente (RN-01) |
| D-05 | Tarifas comodín, prioridad y reglas de duración/precio | Parcial: duración según tamaño y transporte fijado por administrador según hora/distancia; valores y prioridad pendientes (RN-04 a RN-06) |
| D-06 | Estrategia de migraciones y entorno aislado de pruebas | Pendiente |
| D-07 | Funcionalidad piloto y prioridad de etapas | Pendiente |
| D-08 | Alcance de pagos, facturación, comunicaciones y portal público | Parcial: Yape/efectivo, adelanto de autorreserva S/ 20 con confirmación al verificar el owner y cobro final en toda cita creada por personal; resto pendiente (RN-02, RN-08, RN-09) |
| D-09 | Idiomas de interfaz y herramientas adicionales de pruebas | Pendiente |

No hay fechas ni compromisos de entrega aprobados. Riesgos principales: documentar demos como producto terminado, adoptar un esquema desactualizado, ampliar alcance sin aprobación y crear documentos sin evidencia de validación.

## Avance de Fase 0 — 2026-10-17

Plan aprobado e identidad implementada localmente con migración, RLS, permisos, guards, administración de asignaciones y pruebas. Solo OWNER administra seguridad inicialmente; registro CLIENT y correo confirmado; entorno desechable identity-dev independiente. Esto resuelve esas decisiones para identidad local, sin aprobar automáticamente otras fases ni adopción remota. El resultado no acredita políticas de las tablas del negocio. Ver `features/fase-0-fundamentos-seguridad/validation.md`.
