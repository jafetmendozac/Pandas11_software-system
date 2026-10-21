# Matriz de seguimiento del cronograma S1–S14

Actualización de evidencias del 2026-10-21: [paquete de revisión de actividades 1–3](aceptacion-actividades-1-3.md) con ocho capturas sintéticas y registro de conformidad pendiente. Las pruebas actuales alcanzaron 93/93 Angular tras corregir la presentación de Tarifas para STAFF; el recorrido visual local no sustituye aceptación del negocio. Los estados de la tabla siguientes reflejan su corte documental y deben leerse junto con esta actualización.

Fecha de corte: 2026-10-20 (America/Lima).
Fuente de planificación: cronograma de 29 actividades proporcionado por el usuario.
Alcance de esta entrega: documentación del avance; no autoriza implementar funcionalidades, aplicar migraciones o desplegar.

## Cómo interpretar el seguimiento

- **Validado localmente:** existe implementación y un registro de pruebas para el alcance descrito. No significa aceptación del usuario o despliegue remoto.
- **Parcial:** hay trabajo aprovechable, pero faltan elementos explícitos de la actividad.
- **Pendiente:** no se identificó implementación operativa ni evidencia de cierre en las fuentes revisadas. Puede existir trabajo externo que todavía deba adjuntarse.
- La columna semana reproduce la ubicación de las X del cronograma recibido. No representa semana real de ejecución. No se proporcionó fecha de inicio para convertir S1–S14 a fechas calendario ni determinar retrasos.
- Las pruebas citadas son resultados históricos documentados; no se ejecutaron de nuevo para elaborar esta matriz. No sumar suites acumulativas como pruebas independientes.
- El cierre formal requiere evidencia correspondiente, revisión y aceptación. No se asignan porcentajes porque las actividades tienen tamaños distintos y no hay ponderaciones aprobadas.

## Actividad 1 — Diseño y estructuración de la base de datos

La [guía de evidencias para actividades 1–3](evidencias-actividades-1-3.md) ofrece texto verificable para el informe y una lista de anexos pendientes.

| ID | Actividad | Semana prevista | Estado al corte | Avance y evidencia | Pendiente para cerrar |
|---|---|---|---|---|---|
| 1.1 | Reunión inicial y levantamiento de requerimientos | S1 | Parcial | Misión, requisitos y reglas [E01]; Alex y Caro identificados por el usuario como asistentes, con fecha desconocida [E14]. | Completar hora/medio, acuerdos y aceptación documentada; el registro parcial no acredita acta formal. |
| 1.2 | Identificar entidades y diseñar ERD conceptual v1 | S1 | Parcial | ERD conceptual v1 reconstruido desde modelo existente [E14]. | Obtener revisión y aceptación del negocio; no confundir la reconstrucción con un artefacto histórico de S1. |
| 1.3 | Crear proyecto en Supabase y repo GitHub | S1 | Parcial | Instancia Supabase local [E03]; usuario aportó enlaces de Supabase y GitHub, y este último coincide con `origin` Git local [E14]. | Adjuntar fecha y constancia de acceso/propiedad; no se inspeccionaron servicios remotos. |
| 1.4 | Refinar ERD, definir datos y script SQL | S2 | Parcial | ERD físico y diccionario de 26 tablas/213 columnas documentados, con21 tablas migradas y cinco previstas [E14]; SQL y migraciones [E02, E04]. | Revisar y aceptar versiones; confirmar esquema remoto solo si se autoriza inspección. |
| 1.5 | Ajustar ERD según pruebas de seguridad | S3 | Parcial | ERD físico y trazabilidad de controles de identidad/dominio elaborados [E14]; correcciones H-01/H-02 y pruebas locales [E04, E05]. | Conciliación H-03 a H-23 documentada el 2026-10-21 en [informe individual](features/revision-modelo-base-datos/conciliation.md). Falta revisión/aceptación del ERD y de los límites registrados. |

## Actividad 2 — Configuración de seguridad y autenticación

| ID | Actividad | Semana prevista | Estado al corte | Avance y evidencia | Pendiente para cerrar |
|---|---|---|---|---|---|
| 2.1 | Configurar Auth, tabla profiles e inicio de sesión | S2 | Validado localmente | Auth por correo/contraseña, profiles, registro CLIENT y comprobación de cuenta/perfil; pruebas documentadas [E05, E15]. | Adjuntar capturas del flujo con cuenta sintética y aceptación del alcance; verificación remota solo cuando se autorice el despliegue. |
| 2.2 | Implementar políticas RLS y definir roles | S3 | Validado localmente | OWNER/ADMIN/STAFF/CLIENT, matriz de permisos, políticas y migraciones de identidad y dominios implementados [E05–E09, E15]. | Revisar y aceptar el anexo de roles/RLS. Las futuras tablas de ventas/inventario requerirán sus propias políticas. |
| 2.3 | Probar seguridad y documentar políticas | S3 | Validado localmente | Fase 0 registra 16 comprobaciones SQL y 26 API; fases posteriores incluyen regresiones y pruebas de acceso por dominio [E05–E09, E15]. | Anexar resultados originales con fecha/entorno/alcance y límites. La validación de nuevas funcionalidades debe agregarse cuando existan. |
| 2.4 | Finalizar Auth en Angular y estructura de proyecto | S4 | Validado localmente | Servicios de Auth/autorización, guards, rutas, componentes standalone y layouts; build/pruebas documentados [E05, E10, E15]. | Cierre formal del alcance correo/contraseña y permisos. Google, recuperación de contraseña y MFA no forman parte del alcance completado. |

## Actividad 3 — Desarrollo de módulos de gestión

| ID | Actividad | Semana prevista | Estado al corte | Avance y evidencia | Pendiente para cerrar |
|---|---|---|---|---|---|
| 3.1 | Módulo Clientes: CRUD completo y conexión | S4 | Validado localmente | Consulta, alta, edición y retiro lógico, búsqueda/paginación, conexión local y permisos [E06, E16]. | Evidencia de recorrido y aceptación. Documentar que eliminar significa baja lógica con conservación de antecedentes. |
| 3.2 | Módulo Mascotas: CRUD, relaciones y ficha | S5 | Validado localmente | Vínculo cliente–mascota, ficha, vacunas, notas separadas, archivo y bajas lógicas [E06, E16]. | Aceptar la ficha entregada y anexar capturas; historia clínica veterinaria y adjuntos no se acreditan como implementados. |
| 3.3 | Módulo Servicios: CRUD | S6 | Validado localmente | Servicios/tarifas, desactivación, cotización por tamaño/pelaje, catálogo y permisos [E07, E16]. | Validar el catálogo comercial real con el negocio; la evidencia técnica utiliza datos sintéticos. |
| 3.4 | Módulo Citas: agendamiento, estados y asignación | S6 | Validado localmente | Agenda interna, varias mascotas, trabajadores habilitados, etapas/relevo, estados, turnos y bloqueos [E08, E16]. | Aceptar recorrido de recepción y adjuntar evidencia. Reservas online no están incluidas en este cierre. |
| 3.5 | Completar Citas: históricos y validaciones | S7 | Validado localmente | Alcance confirmado el 2026-10-21: consulta de citas pasadas y canceladas. Nuevas pruebas: 92/92 Angular y 82 comprobaciones API de agenda correctas, con snapshots, asignaciones y consulta repetida [E08, E16]. | Falta recorrido humano con capturas y aceptación; no se exige auditoría de cada modificación. Ver [validación actual](features/revision-modelo-base-datos/validation.md). |

## Actividad 4 — Implementación del módulo comercial

| ID | Actividad | Semana prevista | Estado al corte | Avance y evidencia | Pendiente para cerrar |
|---|---|---|---|---|---|
| 4.1 | Iniciar Ventas: modelo y lógica de venta mixta | S7 | Pendiente | Existen citas/pagos y tablas previstas de documentos de facturación [E02, E09, E17]; no acreditan venta mixta operativa. | Especificar venta de productos y servicios, detalle, importes, anulaciones y permisos; aprobar modelo y plan. |
| 4.2 | Módulo Ventas: registro de venta y métodos de pago | S8 | Parcial | Pagos manuales de citas con Yape, Plin, efectivo, tarjeta y transferencia; verificación OWNER y saldos [E09, E17]. | Implementar la venta comercial y sus productos/servicios. Diferenciar registro de venta, cobro y documento de facturación. |
| 4.3 | Conexión Cita → Venta y cierre de caja básico | S8 | Parcial | Relación cita → pagos, cobro final y saldo exacto [E09, E17]. | Definir e implementar cita → venta y apertura/movimientos/cierre de caja; cobros de citas no equivalen a cierre de caja. |
| 4.4 | Módulo Inventario: registro y stock automático | S9 | Pendiente | No se identifican tablas operativas de productos/stock en el modelo revisado; componentes de ecommerce son plantilla [E02, E11, E17]. | Definir productos/unidades, entradas, salidas y efecto transaccional de ventas; aprobar implementación. |
| 4.5 | Movimientos de inventario y su historial | S9 | Pendiente | No se identificó flujo de movimientos de stock ni historial conectado [E02, E11, E17]. | Definir kardex/movimientos, motivos, responsables, ajustes y trazabilidad; vincularlos con ventas e inventario. |
| 4.6 | Finalizar Inventario: alertas de stock mínimo | S10 | Pendiente | Sin inventario operativo acreditado [E02, E11, E17]. | Acordar mínimos por producto, presentación de alertas y pruebas en los límites de stock. |

## Actividad 5 — Construcción de analítica y fidelización

| ID | Actividad | Semana prevista | Estado al corte | Avance y evidencia | Pendiente para cerrar |
|---|---|---|---|---|---|
| 5.1 | Iniciar Dashboard: consultas SQL para KPIs | S10 | Pendiente | Hay datos operativos de citas/pagos aprovechables, pero no consultas de KPIs conectadas al dashboard acreditadas [E09, E11, E18]. | Definir cada indicador, fórmula, periodo, zona horaria y permisos; distinguir ventas de dinero recibido. |
| 5.2 | Dashboard: gráficos de ingresos, servicios y productos | S11 | Pendiente | Dashboard de plantilla; monthly-sales-chart contiene una serie numérica fija [E11, E18]. | Conectar indicadores reales de ingresos/servicios/productos; validar agregaciones y ausencia de doble conteo. Los productos dependen de la Actividad 4. |
| 5.3 | Implementar recordatorios y lista por contactar | S11 | Pendiente | notifications aparece en el SQL previsto; dropdown actual de notificaciones es interfaz de plantilla [E02, E11, E18]. | Acordar destinatarios, consentimiento, canal, frecuencia, lista de seguimiento y registro de contactos. |
| 5.4 | Reportes exportables y analítica de retención | S12 | Pendiente | Sin exportación operativa de reportes ni retención acreditada en fuentes revisadas; el botón Export de facturas de plantilla no tiene acción [E10, E11, E18]. | Definir formatos, filtros, protección de datos y fórmula/cohortes de retención; probar resultados contra datos sintéticos conocidos. |
| 5.5 | Ajustes finales de interfaz y usabilidad | S12 | Parcial | Portada pública, configuración en español, mejoras de agenda y tema turquesa implementados [E08, E12, E18]. | Revisar consistencia de todos los módulos finales, accesibilidad, móvil/oscuro/RTL y aceptación con usuarios. Tema turquesa tiene revisión visual manual pendiente. |

## Actividad 6 — Despliegue, calidad y transferencia

| ID | Actividad | Semana prevista | Estado al corte | Avance y evidencia | Pendiente para cerrar |
|---|---|---|---|---|---|
| 6.1 | Ejecución de pruebas integrales y corrección de errores | S13 | Parcial | Suites por dominio, API concurrentes, regresiones y compilaciones locales; el anexo distingue estos resultados de una aceptación integral [E05–E09, E13, E19]. | Fijar versión entregable, probar sus flujos completos, registrar incidencias y cierre; acordar y validar despliegue, actualmente no acreditado. |
| 6.2 | Redacción de manual de usuario y manual técnico | S13 | Parcial | Arquitectura, stack, requisitos/planes/validaciones y guía Supabase local disponibles; contenido mínimo definido en el anexo [E03, E10, E13, E19]. | Consolidar dos manuales formales con versión, instalación/operación, perfiles, recorridos, capturas y solución de incidencias; documentación técnica dispersa no acredita ambos manuales terminados. |
| 6.3 | Capacitación al personal de la boutique | S13 | Pendiente | No se encontró evidencia de sesión de capacitación; plantilla de registro disponible [E19]. | Preparar guía y ejercicios por rol, realizar sesión y registrar asistencia/evaluación o acta. |
| 6.4 | Presentación final, entrega de documentación y cierre | S14 | Pendiente | Existen entregables parciales y una plantilla de registro; no hay acta de cierre identificada [E19]. | Reunir entregables, resolver/aceptar pendientes, presentar el sistema y registrar entrega y conformidad. |

## Catálogo de evidencias

Los códigos de las tablas remiten a los siguientes archivos. Las referencias a fases describen numeración técnica SDD y no sustituyen los IDs del cronograma.

| Código | Evidencia verificable |
|---|---|
| E01 | [Misión](mission.md), [reglas de negocio](business-rules.md) y requisitos en cada directorio de funcionalidad. |
| E02 | [Pandas11.sql](../Pandas11.sql) y [arquitectura](architecture.md). El SQL es modelo local, no prueba del esquema remoto. |
| E03 | [Guía Supabase local](../supabase/README.md), [configuración local](../supabase/config.toml) y [guía de datos sintéticos](seed-local.md). |
| E04 | [Revisión del modelo](features/revision-modelo-base-datos/review.md) y [validación de correcciones](features/revision-modelo-base-datos/validation.md). |
| E05 | [Roles/requisitos Fase0](features/fase-0-fundamentos-seguridad/requirements.md), [migración de identidad](../supabase/migrations/20261017152256_identity_foundation.sql), [validación](features/fase-0-fundamentos-seguridad/validation.md), [Auth Angular](../src/app/shared/services/supabase.service.ts) y [guards](../src/app/shared/guards/auth.guard.ts). |
| E06 | [Validación de clientes/mascotas](features/fase-1-clientes-mascotas/validation.md) y [migración](../supabase/migrations/20261017201505_clients_pets.sql). |
| E07 | [Validación de servicios/tarifas](features/fase-2-servicios-precios/validation.md) y [migración](../supabase/migrations/20261017210343_services_prices.sql). |
| E08 | [Validación laboral](features/fase-3-empleados-disponibilidad/validation.md), [validación de agenda](features/fase-4-agenda-reservas-internas/validation.md), [requisitos de agenda](features/fase-4-agenda-reservas-internas/requirements.md) y [migración de citas](../supabase/migrations/20261017220427_internal_appointments.sql). |
| E09 | [Requisitos de pagos](features/fase-5-pagos-adelantos/requirements.md), [validación](features/fase-5-pagos-adelantos/validation.md) y [migración de pagos](../supabase/migrations/20261018225928_payments_advances.sql). |
| E10 | [Arquitectura](architecture.md), [stack](tech-stack.md), [rutas](../src/app/app.routes.ts) y [configuración Angular](../src/app/app.config.ts). |
| E11 | [Dashboard](../src/app/pages/dashboard/ecommerce/ecommerce.component.ts), [serie fija de ventas](../src/app/shared/components/ecommerce/monthly-sales-chart/monthly-sales-chart.component.ts) y [notificaciones de plantilla](../src/app/shared/components/header/notification-dropdown/notification-dropdown.component.ts). Son evidencia del límite actual, no de funcionalidades comerciales finalizadas. |
| E12 | [Portada pública](features/inicio-publico/validation.md), [configuración en español](features/configuracion-espanol/validation.md) y [tema turquesa](features/tema-turquesa/validation.md). |
| E13 | [Línea base y evolución](baseline.md), [pruebas SQL](../supabase/tests/database/identity.test.sql) y validaciones de cada dominio. |
| E14 | [Modelo conceptual/físico y trazabilidad](actividad-1-modelo-datos.md), [diccionario de datos](actividad-1-diccionario-datos.md) y [plantilla de acta](actividad-1-acta-plantilla.md). Documentos preparados para revisión. |
| E15 | [Anexo de seguridad y Auth](actividad-2-seguridad-auth.md): puntos 2.1–2.4, matriz de roles, tablas con RLS, resultados históricos y evidencias pendientes. Preparado para revisión. |
| E16 | [Anexo de módulos de gestión](actividad-3-modulos-gestion.md): puntos 3.1–3.5, trazabilidad con reglas de negocio, código, migraciones, pruebas históricas y límite de «históricos». Preparado para revisión. |
| E17 | [Anexo del módulo comercial](actividad-4-modulo-comercial.md): puntos 4.1–4.6, separación entre cita, cobro, venta, caja e inventario; decisiones y evidencia pendiente. Preparado para revisión. |
| E18 | [Anexo de analítica y fidelización](actividad-5-analitica-fidelizacion.md): puntos 5.1–5.5, fuentes disponibles, componentes de demostración, dependencias y criterios por definir. Preparado para revisión. |
| E19 | [Anexo de calidad y transferencia](actividad-6-calidad-transferencia.md): puntos 6.1–6.4, evidencia de pruebas locales, paquete de aceptación, manuales y registro pendiente de capacitación/entrega. Preparado para revisión. |

## Reservas online y diferencias de alcance

La **Fase6 SDD — Reservas online** tiene decisiones comerciales registradas en [reglas de negocio](business-rules.md), pero los documentos de plan/requisitos/validación mencionados en la conversación anterior no están en el árbol de trabajo actual. No está implementada. El usuario pidió ahora seguimiento documental, no iniciar esa implementación.

La Fase6 SDD no equivale a la **Actividad6 del cronograma**, que trata calidad y transferencia. Reservas online podría agregarse a 3.4–3.5 o registrarse como ampliación posterior; esta matriz no modifica las semanas ni aprueba esa ampliación.

Las especificaciones generales contienen diagnósticos iniciales y actualizaciones posteriores. Para este corte prevalecen los avances documentados por fase y el código local revisado: no se interpreta el diagnóstico inicial como ausencia actual de agenda, permisos o pagos. Tampoco se considera que payments o billing_documents implementen ventas, caja o inventario.

## Orden recomendado para el siguiente seguimiento

1. Reunir evidencia externa de 1.1/1.3 y completar ERD/diccionario de1.2/1.4/1.5. Demostrar y aceptar la consulta de citas pasadas y canceladas de 3.5, cuyo alcance se confirmó el 2026-10-21.
2. Revisar y aceptar el alcance local de seguridad/Auth y CRUD existentes, conservando sus límites documentados.
3. Decidir prioridad de reservas online frente a ventas/caja/inventario. El cronograma actual requiere el módulo comercial antes de completar indicadores de productos.
4. Preparar requisitos y plan SDD comercial cuando el usuario lo solicite; cualquier implementación requiere aprobación de ese plan.
5. Diseñar analítica sobre datos operativos y reunir manuales/evidencias durante el desarrollo; programar aceptación, despliegue y capacitación cuando se acuerden entorno y fechas.

## Actualización y validación de esta matriz

Al actualizar una fila, registrar fecha real y enlace a evidencia nueva; mantener la semana prevista original para poder comparar. No marcar finalización por presencia de una pantalla, tabla SQL o X en el cronograma. Los responsables, fechas reales y fecha inicial de S1 quedan por acordar; no se inventan para el informe.

Revisión realizada: lectura de especificaciones y validaciones, inventario de tablas/archivos, inspección de dashboard/notificaciones, revisión de enlaces y cobertura de los29 IDs del cronograma. Sin pruebas funcionales o build nuevos porque esta entrega solo añade documentación. Sin consultas a Supabase remoto, cambios SQL, nuevas funcionalidades o despliegue.
