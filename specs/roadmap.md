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
| D-04 | Zona horaria, horarios, bloqueos y prevención de solapamientos | Fase 3 aprobada/validada localmente: America/Lima, turnos, bloqueos, último inicio17 y fin extendido explícito. Ocupación automática de agenda pendiente (RN-01) |
| D-05 | Tarifas comodín, prioridad y reglas de duración/precio | Parcial: duración según tamaño y transporte fijado por administrador según hora/distancia; valores y prioridad pendientes (RN-04 a RN-06) |
| D-06 | Estrategia de migraciones y entorno aislado de pruebas | Pendiente |
| D-07 | Funcionalidad piloto y prioridad de etapas | Pendiente |
| D-08 | Alcance de pagos, facturación, comunicaciones y portal público | Parcial: Yape/efectivo, adelanto de autorreserva S/ 20 con confirmación al verificar el owner y cobro final en toda cita creada por personal; resto pendiente (RN-02, RN-08, RN-09) |
| D-09 | Idiomas de interfaz y herramientas adicionales de pruebas | Pendiente |

No hay fechas ni compromisos de entrega aprobados. Riesgos principales: documentar demos como producto terminado, adoptar un esquema desactualizado, ampliar alcance sin aprobación y crear documentos sin evidencia de validación.

## Avance de Fase 0 — 2026-10-17

Plan aprobado e identidad implementada localmente con migración, RLS, permisos, guards, administración de asignaciones y pruebas. Solo OWNER administra seguridad inicialmente; registro CLIENT y correo confirmado; entorno desechable identity-dev independiente. Esto resuelve esas decisiones para identidad local, sin aprobar automáticamente otras fases ni adopción remota. El resultado no acredita políticas de las tablas del negocio. Ver `features/fase-0-fundamentos-seguridad/validation.md`.

## Avance Fase 1 — 2026-10-17

Plan aprobado e implementado localmente: clientes, mascotas, vacunas, notas internas, RLS de dominio, búsqueda/paginación y archivo de lectura. Cliente autenticado consulta datos propios desde /mis-datos; OWNER/ADMIN editan y STAFF consulta. Detalle de alergias interno y nota editable 1:1. Sin reset ni adopción remota. Storage, historia clínica/revisiones y otras fases siguen pendientes. Resultados en features/fase-1-clientes-mascotas/validation.md.

## Avance Fase 2 — 2026-10-17

Servicios y tarifas implementados localmente con prioridad aprobada, comodines/TOY, precisión decimal, simulador, catálogo propio y RLS. RN-11/RN-12 registran reglas confirmadas. Sin reset ni cambios remotos. Integración con citas, disponibilidad y transporte permanece pendiente. Evidencia en features/fase-2-servicios-precios/validation.md.

## Avance Fase 3 — 2026-10-17

Implementada y validada localmente tras aprobación: empleados vinculados a perfiles activos, habilidades y desactivación, turnos recurrentes partidos, horario del local y bloqueos personales/globales. RLS y RPC por permiso; protección concurrente de solapamientos. Consulta laboral por fecha/intervalo en America/Lima, con unión/resta de bloqueos, último inicio17 y fin extendido solo si el turno lo cubre.

43 pruebas Angular, 76 SQL acumuladas y 190 comprobaciones API de Fases 0–3 correctas; lint y build correctos. Evidencia en [validación](features/fase-3-empleados-disponibilidad/validation.md).

Pendiente para una siguiente fase: acordar el contrato canónico de citas, integrar servicios/precios/empleados, ocupación transaccional de citas y recojos y etapas de relevo. Hasta entonces se usan bloqueos manuales y se muestra la ocupación automática como no verificada. Sin cambios remotos; adopción/despliegue remoto sigue requiriendo un plan específico.

## Avance Fase 4 — 2026-10-17

Plan y ampliaciones aprobados e implementados en identity-dev: agenda interna por items, varias mascotas del mismo cliente, etapas/relevo y trabajadores cualificados. Reservas atómicas con control de versión, snapshots de tarifas/duración/habilidad, cancelación sin borrado y notas internas separadas. OWNER/ADMIN gestionan; STAFF consulta. Conflictos por trabajador/mascota y carreras con configuración laboral protegidos en servidor.

63 pruebas Angular,112 SQL y265 comprobaciones API acumuladas correctas; lint/tipos/build correctos. Modelo local y contratos Angular alineados. Evidencia en [validation.md](features/fase-4-agenda-reservas-internas/validation.md).

Pendiente: pagos/adelantos y autorreserva, transporte enlazado/cotización, seguimiento real por etapa/demoras, esperas y políticas de cancelación durante atención; no se infieren de esta entrega. Recojos/demoras se representan manualmente con bloqueos. Adopción remota requiere inventario/conciliación de datos y aprobación específica; no está realizada.

## Inicio público — 2026-10-18

Página informativa implementada tras aprobación: identidad turquesa Pandas11, servicios caninos, boutique, orientación, recojo coordinado, dirección en Trujillo, horario y WhatsApp confirmado. Accesible sin cuenta en `/`, con inicio de sesión existente y dashboard protegido en `/panel`. Personal y CLIENT conservan destinos y permisos separados.

77 pruebas Angular y build correctos; revisión de build en Chrome en escritorio/móvil, oscuro y RTL, sin consultas Supabase en la portada. Resultados en [validación](features/inicio-publico/validation.md).

No incluye reservas online, inventario/ecommerce, pagos o despliegue remoto. La presentación comercial no modifica automáticamente catálogo ni horarios administrativos. Esas funciones mantienen sus fases y aprobaciones propias.

## Preparación Fase 5 — 2026-10-18

Solicitado control de pagos/adelantos con Yape, Plin, efectivo, tarjeta y transferencia. [Requisitos](features/fase-5-pagos-adelantos/requirements.md), [plan](features/fase-5-pagos-adelantos/plan.md) y [validación](features/fase-5-pagos-adelantos/validation.md) creados para revisión; no implementado y sin migraciones ejecutadas.

Decisiones confirmadas: OWNER/ADMIN registran, solo OWNER verifica; comprobantes por operación/referencia sin archivos; cobro final en citas internas sin adelantos voluntarios. Plan aprobado posteriormente mediante «Si apruebo». El plan distingue cobros registrados y realmente confirmados; no presupone autorreserva, pasarela bancaria, boletas/facturas ni reglas de devolución. La aprobación cubrió el plan concretado y las ampliaciones de payments; el avance de implementación se registra abajo.

## Avance Fase 5 — 2026-10-18

Plan aprobado mediante «Si apruebo» e implementado en Supabase local: payments, registro PENDING por OWNER/ADMIN y verificación/rechazo exclusivo OWNER, cinco medios manuales, referencias sin archivos, saldos exactos y prevención concurrente de sobrecobros. Página /pagos con modales/estilo de plantilla, filtros/paginación y enlace por permiso desde agenda.

Cobro interno al finalizar (INTERNAL/COMPLETED), sin DEPOSIT interno. Adelanto de autorreserva S/20 se conserva como requisito futuro: no se presenta como flujo ONLINE disponible. Devoluciones/correcciones y pasarelas siguen fuera de alcance. Evidencia y límites actualizados en [validación](features/fase-5-pagos-adelantos/validation.md); sin adopción remota.

## Seguimiento del cronograma S1–S14 — 2026-10-20

La [matriz de seguimiento](matriz-seguimiento.md) relaciona las29 actividades proporcionadas por el usuario con semana prevista, estado local, evidencias y pendientes. Distingue las actividades del cronograma de las fases técnicas SDD y conserva los diagnósticos históricos de este documento. Su elaboración es documental: no aprueba ni inicia reservas online, ventas, inventario u otras funcionalidades.

## Avance Actividad 4.1 — 2026-10-21

Tras «Vamos con eso», se implementó localmente el modelo y las RPC de ventas con catálogo simple, detalle mixto en borrador y vínculo a citas internas completadas. Los cobros confirmados de cita se consultan por referencia, sin duplicarse; permisos y rol OWNER/ADMIN se verifican en servidor. Las ventas con artículos siguen en borrador hasta implementar stock. No hay página comercial ni cobro de mostrador, caja, comprobantes o despliegue remoto. Resultados en [validación 4.1](features/actividad-4-ventas-mixtas/validation.md).

## Entrega visual de 4.2 — 2026-10-22

Plan aprobado e interfaz local en `/ventas` y `/productos`: catálogo, borradores con cliente/cita, detalle, confirmación solo de servicios y anulación versionada. Cobros de cita por referencia y enlace al módulo de pagos; productos siguen en borrador. No incluye cobro de mostrador, stock, caja ni despliegue remoto. Resultados y límites en [validación](features/actividad-4-registro-ventas/validation.md).

## Avance 4.4–4.5 — 2026-10-22

Plan y decisiones INV-D01–INV-D05 aprobados mediante «Añadelo entonces» con `$sdd-feature`. Inventario local por producto/unidad, saldo cero inicial, entradas OWNER/ADMIN, ajustes OWNER, historial y descuento de stock al confirmar ventas. Anulación de productos confirmados solo OWNER con elección RESTOCK/NO_RESTOCK; dinero conservado. Se habilita confirmación comercial de productos, sin afirmar cobro de mostrador.

Dos migraciones incrementales locales sin reset ni cambios remotos. Validación y límites en [inventario](features/actividad-4-inventario/validation.md). La restricción histórica de productos solo en borrador se sustituye para este nuevo alcance; caja, pagos de productos, mínimos/alertas y devoluciones parciales siguen pendientes.

## Avance 4.2, 4.3 y 4.6 — 2026-10-22

Plan COM-D01–COM-D05 aprobado mediante «Vamos con eso». Cobros manuales de productos por venta confirmada, saldo separado de citas en ventas mixtas, verificación OWNER, caja única con apertura/cierre y movimientos, y mínimo informativo por producto se implementaron en Supabase local y Angular. Ver [validación comercial](features/actividad-4-cobros-caja-alertas/validation.md). Los diagnósticos anteriores de esta hoja y del anexo comercial son históricos. No se implementaron devolución de dinero, facturación, conciliación bancaria, notificaciones externas ni despliegue remoto.

## Inicio público: panfletos semanales — 2026-10-23

Requisitos PS-01–PS-07 y plan aprobados. Implementados localmente siete espacios (uno por día de Lima), lectura pública limitada por RLS/Storage, editor para OWNER/ADMIN, respaldo de portada y vista ampliada. La prueba visual usó una imagen local temporal que se retiró. Para mostrar panfletos reales faltan la migración al entorno de destino mediante un proceso aprobado y la carga por el negocio de siete imágenes autorizadas; ninguna se publicó aquí. Evidencia en [validación](features/inicio-publico-panfletos-semanales/validation.md).

## Actividad 5.1: consultas SQL para indicadores — 2026-10-29

El usuario aprobó el [plan](features/actividad-5-kpis/plan.md) y confirmó Trujillo (`America/Lima`). Se aplicó en Supabase local una migración incremental para cobros `PAID` de servicios/productos y citas `COMPLETED` por mes, con acceso OWNER/ADMIN y sin duplicar movimientos de caja. Pasaron 17/17 pruebas específicas y 289/289 de la suite SQL. El dashboard visual conserva datos de plantilla hasta 5.2; la migración de contexto de roles del 2026-10-28 sigue pendiente y no se alteró. Ver [validación](features/actividad-5-kpis/validation.md).

## Actividad 5.2: gráficos de cobros, servicios y productos — 2026-10-29

Plan aprobado mediante «Vamos con eso» e implementado localmente. `/panel` dejó de renderizar cifras y componentes TailAdmin de demostración. OWNER/ADMIN ven cuatro tarjetas, doce meses de cobros separados y rankings de hasta cinco servicios/productos; STAFF conserva enlaces operativos sin analítica. La RPC agregada aplica periodo Lima y permisos en servidor. La migración de contexto de roles pendiente al cierre de 5.1 se aplicó localmente como dependencia de la selección de rol de 5.2, sin modificar su alcance. Pruebas y límites en [validación 5.2](features/actividad-5-dashboard-graficos/validation.md). El siguiente punto del cronograma es 5.3, recordatorios y lista por contactar; requiere requisitos y plan propios.

## Actividad 5.3: recordatorios y lista por contactar — 2026-10-29

Plan aprobado mediante «Dale sigue» e implementado en Supabase local y Angular. `/por-contactar` calcula citas de mañana y seguimiento desde la última cita completada hace 30 días en Lima; permite registrar intentos manuales con responsable y resultado. WhatsApp exige consentimiento con procedencia, número y opt-in vigente; el valor legado no basta. OWNER/ADMIN registran consentimiento; STAFF puede consultar y registrar intentos. Dos tablas nuevas preservan historial y la migración añade RLS/RPC. Se retiró del encabezado el desplegable con notificaciones ficticias. Evidencia y límites en [validación 5.3](features/actividad-5-recordatorios-contactos/validation.md). No hay envíos automáticos ni adopción remota. El siguiente punto del cronograma es 5.4, reportes y retención.

## Actividad 5.4: reportes exportables y retención — 2026-10-31

Plan y decisiones R54-D01–D04 aprobados mediante «Vamos». `/reportes` muestra cobros/citas y retención mensual en intervalos de hasta 12 meses de Lima y descarga dos CSV agregados, sin datos personales. La RPC local reutiliza `dashboard_kpis` y restringe acceso a OWNER/ADMIN activos con `analytics.read`; las pruebas de roles, exactitud y límites constan en [validación 5.4](features/actividad-5-reportes-retencion/validation.md). No hay despliegue remoto ni aceptación operativa. El siguiente punto del cronograma es 5.5, ajustes finales de interfaz y usabilidad.
