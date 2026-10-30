# Reglas de negocio

Fecha: 2026-10-16 (America/Lima).
Fuente: reglas indicadas por el usuario en la conversación.
Estado: definiciones iniciales; ambigüedades pendientes de aclaración. Documentar una regla no significa que ya esté implementada.

## Reglas declaradas y aclaradas

Fuente: solicitud inicial y respuestas posteriores del usuario. Estas definiciones no acreditan implementación.

| ID | Regla | Estado de definición |
|---|---|---|
| RN-01 | Atención de lunes a sábado, incluidos feriados, con horario disponible de 07:00 a 18:00. Domingo es descanso. Se permite que un servicio termine después de las 18:00 | Confirmado: último inicio a las 17:00 y zona America/Lima (plan de Fase 3 aprobado) |
| RN-02 | Medios de pago: Yape, Plin, efectivo, tarjeta o transferencia | Ampliado por solicitud explícita de Fase 5 el 2026-10-18; no implica integración bancaria ni implementación actual |
| RN-03 | Actualmente trabajan dos personas; pueden avanzar con hasta dos perros diferentes simultáneamente, uno por trabajador, sujeto a sus habilidades | Confirmado; no equivale a dos ingresos por hora ni define un máximo de perros por cita |
| RN-04 | Baño y corte tiene una referencia inicial de 2 horas, pero la duración depende del tamaño del perro | Aclarado; falta definir duraciones por tamaño y posibles ajustes |
| RN-05 | Solo baño tiene una referencia inicial de 1 hora, pero la duración depende del tamaño; un perro muy pequeño puede requerir menos tiempo | Aclarado; falta definir duraciones por tamaño y posibles ajustes |
| RN-06 | Recojo significa transportar al perro hacia el local; no incluye llevarlo de regreso. El administrador fija el precio del transporte según la hora y la distancia | Confirmado: un trabajador realiza el recojo y queda ocupado durante el traslado; estimación de tiempo pendiente |
| RN-07 | Un trabajador puede cortar y bañar; el otro solo puede bañar. Un trabajador sin habilidad de corte no puede realizar ese servicio | Confirmado; Fase 3 usa ALL_SERVICES para baño/corte y ASSISTANT para baño |
| RN-08 | Cuando el cliente reserva por sí mismo, se solicita un adelanto fijo de S/ 20 (PEN). La cita queda confirmada cuando el propietario (owner) verifica el pago | Confirmado; vencimiento y liberación de reserva pendientes |
| RN-09 | Cuando el personal registra la cita, se cobra al final del servicio, tanto si el cliente tiene cuenta como si no | Confirmado; no se exige el adelanto de autorreserva en este flujo |
| RN-10 | Un trabajador puede bañar al perro y luego pasarlo al trabajador habilitado para cortar | Confirmado; reserva de tiempos por etapa pendiente de especificar |

Reglas de Fase 2 aprobadas el 2026-10-17:

| ID | Regla | Estado |
|---|---|---|
| RN-11 | Resolver tarifa por prioridad: tamaño+pelaje exactos, solo tamaño, solo pelaje, general (ambos NULL), valores base. Si una dimensión se desconoce, solo aplican comodines en esa dimensión | Confirmado por aprobación del plan de Fase 2 |
| RN-12 | La tarifa ganadora aporta precio y duración completos, sin mezclar campos de reglas. Precio en PEN no negativo, cero válido, máximo dos decimales; minutos enteros positivos. Servicio inactivo no se calcula; cliente solo calcula servicios activos y visibles | Confirmado por aprobación del plan de Fase 2 |

Las referencias de 1 y 2 horas no son duraciones fijas universales. No se inventan tiempos por tamaño ni una fórmula automática de transporte. Los nombres administrador y owner describen responsabilidades del negocio; sus permisos técnicos deben especificarse antes de implementar.

## Consecuencias para requisitos futuros

- La disponibilidad debe considerar trabajador libre y habilidad requerida, además del límite total de dos perros simultáneos.
- Si el único trabajador que sabe cortar está ocupado, el otro no puede cubrir un corte aunque exista capacidad total libre.
- Dos perros no implican automáticamente dos cortes simultáneos. Se permite el relevo entre baño y corte, respetando habilidades y disponibilidad de cada trabajador (RN-10).
- Durante el recojo, el trabajador no está disponible para bañar o cortar; la capacidad de atención se reduce a la del trabajador que permanece disponible.
- Domingo no es agendable; un feriado entre lunes y sábado no constituye cierre automático.
- El último inicio de cita es a las 17:00. Las 18:00 no son un límite obligatorio de finalización; no se impone una duración máxima de una hora a las citas de las 17:00.
- El precio del transporte debe distinguirse conceptualmente del servicio; su presentación y persistencia requieren un plan aprobado.
- La exigencia de adelanto depende del origen y contexto de la reserva descritos en RN-08/RN-09, no únicamente de que exista un usuario autenticado.

## Preguntas pendientes

| ID | Pregunta | Reglas afectadas |
|---|---|---|
| PN-01 | Resuelto por aprobación del plan de Fase 3: America/Lima | RN-01 |
| PN-02 | ¿Cuánto dura baño y baño con corte para cada tamaño? ¿Quién puede ajustar la duración de una cita? | RN-04, RN-05 |
| PN-03 | ¿Cómo se estima la duración del recojo y qué trabajador puede realizarlo? | RN-06, RN-03 |
| PN-04 | Resuelto para Fase 4: recepción define minutos respetando duración total y las etapas son consecutivas; espera entre etapas fuera del contrato aprobado | RN-03, RN-07, RN-10, RN-15 |
| PN-05 | ¿Cuándo vence el plazo para pagar el adelanto o verificarlo y cuándo se libera la reserva? | RN-08 |
| PN-06 | Resuelto: las citas registradas por personal se cobran al final, tenga o no cuenta el cliente | RN-09 |
| PN-07 | ¿Qué reglas aplican a cancelaciones, reprogramaciones, retrasos y devoluciones del adelanto? | RN-01, RN-08 |
| PN-08 | Resuelto: varias mascotas del mismo cliente según capacidad real de trabajadores; sin máximo fijo de dos por cita | RN-03, RN-14 |

Las respuestas deben incorporarse aquí sin convertir propuestas del agente en decisiones confirmadas.

## Relación con la implementación existente

- La restricción de domingos observada en la agenda coincide con RN-01; no acredita cumplimiento completo de feriados, horario o finalización posterior a las 18:00.
- La duración en agenda se obtiene de los servicios seleccionados; eso no acredita que sus valores almacenados correspondan a RN-04/RN-05.
- Inicialmente el enum SQL local contemplaba más medios de pago que RN-02 (Yape/efectivo). La solicitud de Fase 5 del 2026-10-18 amplía RN-02 a los cinco métodos existentes; no autoriza por sí misma una migración o modificación de datos. La portada todavía menciona Yape/efectivo y no se actualiza automáticamente.
- El modelo de citas Angular difiere del SQL local, como registra [architecture.md](architecture.md). Debe resolverse el contrato antes de implementar capacidad o citas con varios perros.
- No se ha validado una implementación de límite de capacidad o cálculo/cotización de recojo.

Estas diferencias quedan informadas, sin modificar código o base de datos.

## Integración en SDD

1. Leer este documento junto con las especificaciones relevantes al analizar una tarea.
2. Identificar en `requirements.md` los IDs RN aplicables y convertirlos en criterios verificables. Las ambigüedades que condicionen el comportamiento se aclaran antes de implementar.
3. Indicar en `plan.md` cómo se aplicará cada regla, sus dependencias y discrepancias con el código; esperar aprobación del plan.
4. Registrar en `validation.md` evidencia de cumplimiento de cada regla aplicable y limitaciones de pruebas.
5. Actualizar este registro cuando el usuario confirme o cambie una regla, conservando trazabilidad. Un cambio documental no autoriza por sí mismo una implementación o migración.

## Historial de aclaraciones

- 2026-10-18: la solicitud de Fase 5 amplía RN-02 a Yape, Plin, efectivo, tarjeta y transferencia. El usuario confirmó en sus respuestas de Fase 5: OWNER/ADMIN registran y solo OWNER verifica todos los pagos; comprobantes solo por número de operación y referencia; mantener cobro final sin adelantos internos. RN-08/RN-09 se mantienen; adelantos de autorreserva se preparan para una fase futura. Ver [requisitos de Fase 5](features/fase-5-pagos-adelantos/requirements.md). No autoriza implementar reservas online o devoluciones.

- 2026-10-16: el usuario precisó capacidad simultánea por trabajador y habilidades, atención de lunes a sábado incluidos feriados, finalización posterior a las 18:00, duración según tamaño, recojo solo de ida y precio de transporte por hora/distancia. También distinguió adelanto verificado por owner para autorreserva y cobro final para clientes sin cuenta registrados por personal. Estas aclaraciones sustituyen las interpretaciones iniciales ambiguas; no modifican código.

- 2026-10-16 (segunda aclaración): el trabajador queda ocupado durante el recojo; se permite relevo de baño a corte; el adelanto de autorreserva es S/ 20 y el owner confirma la cita al verificar el pago; toda cita registrada por personal se cobra al finalizar, tenga o no cuenta el cliente; el último inicio es a las 17:00. Las respuestas reemplazan los puntos pendientes correspondientes.

## Validación de esta entrega

Solo se incorporan reglas y referencias al flujo documental. La revisión es de contenido, enlaces y diff; no corresponde compilar Angular por estos cambios. No se ejecutaron pruebas funcionales, conexiones a Supabase ni cambios SQL.

## Fase 3 aprobada e implementada localmente — 2026-10-17

- RN-01: lunes–sábado incluyendo feriados, domingo de descanso, último inicio 17:00 y zona America/Lima. Fin después de18 requiere un turno configurado que lo cubra; no se prolonga implícitamente el trabajo de una persona.
- RN-03/RN-07: empleado y perfil vinculado activos; ALL_SERVICES habilita baño/corte, ASSISTANT solo baño. Los dos trabajadores actuales no se convierten en un límite permanente de registros. Crear empleado no asigna roles de acceso.
- RN-06: recojos, descansos y ausencias se representan por bloqueos manuales mientras no exista integración con agenda. Un bloqueo global afecta a todo el local; solapados se unen para no descontar dos veces.
- Turnos partidos/consecutivos permitidos de lunes a sábado, dentro del mismo día; intervalos [inicio, fin). Sin turno u horario del local no se habilita ese tramo. No se inventa pausa de almuerzo.
- OWNER/ADMIN gestionan y STAFF consulta. CLIENT/anon no acceden a teléfonos ni motivos laborales. La asociación de perfil es única e inmutable a través de la API.

Evidencia: [validación de Fase 3](features/fase-3-empleados-disponibilidad/validation.md). La consulta no reserva ni garantiza exclusividad; la UI declara «Horario habilitado; ocupación de citas/recojos no verificada». RN-10 (relevo) todavía requiere etapas/ocupación de agenda, no implementadas aquí.

## Decisiones confirmadas para Fase 4 — 2026-10-17

Fuente: respuestas del usuario a las tres preguntas de esta sesión. Definen requisitos; la implementación y las ampliaciones del modelo siguen pendientes de aprobar el plan.

| ID | Regla | Estado |
|---|---|---|
| RN-13 | En la agenda interna, OWNER y ADMIN crean, reprograman, cambian estados y cancelan. STAFF solo consulta | Confirmado por respuesta explícita; no concede gestión laboral ni de seguridad |
| RN-14 | Una cita puede incluir varias mascotas del mismo cliente según capacidad real de los trabajadores; no fijar dos como máximo por cita | Confirmado por respuesta explícita |
| RN-15 | Incluir relevo por etapas de baño a corte en Fase 4; recepción define minutos de cada etapa respetando la duración total configurada del servicio | Confirmado por respuesta explícita; no inventar reparto de tiempos |

No se confirmaron todavía espera entre etapas, transiciones detalladas de estados, cancelación durante atención, excepciones de último inicio, reglas de retrasos ni transporte automático. Las propuestas constan en [requisitos de Fase 4](features/fase-4-agenda-reservas-internas/requirements.md) y necesitan aprobación del plan antes de incorporarse como reglas operativas implementadas.

## Fase 4 aprobada e implementada localmente — 2026-10-17

El usuario aprobó el plan y las ampliaciones mediante «Vamos procede». RN-13/RN-14/RN-15 ya tienen implementación local con permisos, citas con varias mascotas, etapas SERVICE o BATH→CUT y relevo. Recepción define minutos de baño/corte; suma igual al snapshot y sin huecos. ALL_SERVICES puede ambas, ASSISTANT solo baño.

- RN-01: primera atención de cada mascota dentro de horario comercial hasta17; continuaciones pueden iniciar más tarde. Cada etapa exige turno explícito y cobertura completa, incluidos finales después18. Sin cruces de medianoche.
- RN-09: origen INTERNAL, confirmación directa y adelanto obligatorio0, con o sin cuenta del cliente. Cobro al finalizar es regla de negocio; el módulo de pagos no se implementa aquí.
- Estados: CONFIRMED permite editar, iniciar, cancelar o marcar no asistió. IN_PROGRESS solo completa. Inicio/NO_SHOW requieren haber llegado la hora programada. Terminales no se reabren; cancelación requiere motivo y conserva detalle/autor/fecha. CANCELLED/NO_SHOW liberan; COMPLETED conserva sus intervalos programados.
- Precios, minutos y habilidad se guardan como snapshots de servicio. Reprogramar conserva items intactos; nuevos items se cotizan en servidor. No se inventan tiempos por tamaño ni se duplican precios por etapa/trabajador.
- Reservas, turnos y bloqueos comparten validación transaccional. Se impide solapar trabajador o mascota; cambios laborales incompatibles exigen resolver antes las citas. Una desactivación de cuenta por seguridad sigue permitida y alerta de reservas afectadas.
- RN-06: traslados y demoras fuera del intervalo programado requieren bloqueos manuales y resolver conflictos; no se asignan ni cotizan automáticamente. El estado global IN_PROGRESS no se interpreta como ocupación real indefinida de todos los trabajadores de una cita.

Evidencia: [validación Fase 4](features/fase-4-agenda-reservas-internas/validation.md). No se implementan autorreserva online, pagos, espera entre etapas, cancelación durante atención ni seguimiento real de ejecución por etapa.

## Decisiones confirmadas para Fase 5 — 2026-10-18

| ID | Regla | Estado |
|---|---|---|
| RN-16 | OWNER y ADMIN registran pagos; solo OWNER verifica todos los pagos, incluido efectivo | Confirmado por respuesta explícita; implementado localmente en Fase 5 |
| RN-17 | Comprobantes mediante número de operación y referencia; sin adjuntos de imágenes/PDF | Confirmado por respuesta explícita; obligatoriedad/límites propuestos en el plan |
| RN-18 | Mantener cobro al finalizar en citas internas y preparar adelantos para futuras autorreservas; sin adelantos voluntarios internos | Confirmado por respuesta explícita; ratifica RN-08/RN-09 |

El plan técnico concretó lectura OWNER/ADMIN, rechazo solo OWNER y cobro BALANCE en estado COMPLETED. El usuario aprobó posteriormente estas concreciones y las ampliaciones mediante «Si apruebo». Las respuestas iniciales y la aprobación posterior se conservan como pasos distintos.

## Fase 5 aprobada e implementada localmente — 2026-10-18

Aprobada mediante «Si apruebo». RN-02: cinco métodos de registro manual. RN-16: OWNER/ADMIN registran y consultan; solo OWNER verifica/rechaza, incluido efectivo. RN-17: operación/referencia opcionales hasta120 caracteres; sin archivos. RN-18/RN-09: solo cobros finales BALANCE en cita INTERNAL/COMPLETED; sin adelantos voluntarios internos. RN-08 no implementa todavía el flujo de autorreserva.

PENDING no confirma recepción ni reduce saldo; PAID requiere verificación manual OWNER; FAILED conserva motivo. Pagos confirmados no se editan, borran o revierten por esta API. Saldo calculado con decimal exacto; sin sobrecobro confirmado, con revalidación concurrente. No se registran devoluciones, vencimientos o confirmaciones bancarias automáticas. Resultados en [validación Fase 5](features/fase-5-pagos-adelantos/validation.md).

## Decisiones confirmadas para Fase 6 — 2026-10-20

Respuestas del usuario durante el análisis de reservas online. Definen requisitos; el plan y la implementación siguen pendientes de aprobación.

- PN-05 / RN-08: reservar el horario15 minutos para informar el adelanto. Si se informa dentro del plazo, dar1 hora adicional para verificación y después liberar. El plan propone contar la hora desde el reporte, conservando evidencias pendientes para resolución humana sin recuperar horarios vencidos.
- RN-07/RN-10/RN-15: baño y corte online completos con un trabajador habilitado, sin relevo automático. Recepción conserva sus etapas manuales; no se inventan tiempos de baño/corte.
- Autorreserva con cuenta confirmada y fichas/mascotas vinculadas por recepción; sin alta propia de fichas/mascotas en esta fase.
- Adelanto fijoS/20 y verificación exclusiva OWNER se mantienen. No se acuerdan devoluciones automáticas ni se resuelve PN-07 para reprogramación/cancelación posterior al pago.

Los documentos de requisitos y plan de Fase6 no están presentes en el árbol de trabajo actual. Si se retoma esa funcionalidad, habrá que recuperarlos o redactarlos de nuevo antes de solicitar aprobación de implementación.

## Aclaración del cronograma 3.5 — 2026-10-21

El usuario confirmó que «históricos» en 3.5 significa consultar citas pasadas y canceladas. No exige auditoría de cada modificación ni una nueva tabla de historial. Se mantienen RN-13 y la conservación del detalle de RN-14/RN-15. Falta demostrar el recorrido y registrar aceptación; la confirmación de alcance no equivale a aceptación de una prueba no realizada. Ver [Actividad 3](actividad-3-modulos-gestion.md).

## Decisiones comerciales para Actividad 4.1 — 2026-10-21

El usuario aceptó la propuesta de [ventas mixtas](features/actividad-4-ventas-mixtas/requirements.md) mediante «Vamos con eso». Esta aceptación se interpreta dentro del alcance documentado:

| ID | Regla aceptada para 4.1 |
|---|---|
| RN-19 | Puede haber ventas con cita y de mostrador; a lo sumo una venta activa por cita. Los servicios de una venta con cita usan el precio guardado en sus items, sin generar otra cita ni duplicar cobros. Un servicio de mostrador sin cita queda fuera de 4.1 por falta de mascota y tarifa resuelta. |
| RN-20 | Los artículos se catalogan por unidad; una venta que incluya artículos permanece en borrador hasta contar con control de stock de 4.4. No se aplica descuento ni impuesto automático en 4.1. |
| RN-21 | OWNER y ADMIN pueden gestionar ventas. Si una venta tiene cobro confirmado, solo OWNER puede anularla; anular conserva el dinero y exige resolución separada, sin devolución automática. |

Estas reglas no habilitan cobro de ventas de mostrador, inventario ni facturación. RN-02/RN-09/RN-12/RN-16–RN-18 siguen vigentes.


## Inventario 4.4–4.5 — aprobación 2026-10-22

El usuario aprobó el [plan de inventario](features/actividad-4-inventario/plan.md) y las decisiones INV-D01–INV-D05 mediante «Añadelo entonces» con `$sdd-feature`. La restricción histórica de RN-20 queda satisfecha localmente al incorporar stock transaccional, sin habilitar cobro de mostrador.

| ID | Regla aprobada |
|---|---|
| RN-22 | Un inventario del local por producto/unidades enteras. Catálogo existente inicia en cero, sin cantidades reales inferidas; sin variantes/lotes/ubicaciones. |
| RN-23 | OWNER/ADMIN consultan y registran carga inicial/entradas; solo OWNER ajusta. Motivo obligatorio, sin saldo negativo. Carga inicial disponible únicamente antes del primer movimiento, positiva y no repetible; entradas posteriores usan reposición. |
| RN-24 | Borrador no reserva stock. Confirmar una venta descuenta todas sus unidades atómicamente; insuficiencia revierte todo y no se vende la última unidad dos veces. Confirmación comercial no acredita dinero. |
| RN-25 | Anular borrador no altera stock. Solo OWNER anula productos confirmados, con decisión explícita RESTOCK (todo recuperado/conservado y apto para venta) o NO_RESTOCK (sin reponer). Sin elección automática ni devoluciones parciales; conservar pagos sin devolver dinero. Actor, fecha y motivo de anulación registran también esa disposición. |
| RN-26 | Historial inmutable para usuarios de la aplicación: carga inicial, entrada, ajuste, salida por venta y reposición por anulación. Delta, saldo anterior/posterior, actor, fecha y referencias; correcciones mediante otro movimiento. Reintentos no duplican efectos. |

RN-25 amplía RN-21: la anulación de artículos confirmados exige OWNER incluso sin dinero confirmado. RN-12 y RN-16–RN-19 mantienen exactitud monetaria, permisos de cobro, snapshots de cita y pagos por referencia. Inventario no implementa caja, mínimos/alertas, valorización contable ni pagos de productos.

## Cobros comerciales, caja y mínimos — aprobación 2026-10-22

El usuario aprobó el [plan](features/actividad-4-cobros-caja-alertas/plan.md) mediante «Vamos con eso» después de revisar COM-D01–COM-D05. Aplicado solo en Supabase local.

| ID | Regla aprobada |
|---|---|
| RN-27 | Cobros de productos vinculados a venta, separados de pagos de cita. Una venta mixta muestra saldos de servicios/cita y productos por separado; no duplica dinero. OWNER/ADMIN registran PENDING con los cinco medios manuales; solo OWNER verifica/rechaza. PAID reduce saldo de productos y no se devuelve automáticamente. |
| RN-28 | Una caja abierta por local. Cada verificación nueva de cobro de cita o producto exige caja OPEN y crea un ingreso único por medio; PAID históricos anteriores quedan sin sesión asignada. |
| RN-29 | OWNER/ADMIN abren y cierran caja y consultan; solo OWNER registra ingreso/retiro manual de efectivo con motivo. El retiro no deja efectivo esperado negativo. Cierre conserva contado, esperado, diferencia y resumen por medio; no cambia pagos. |
| RN-30 | Producto con mínimo entero no negativo o NULL desactivado. Stock menor o igual al mínimo se muestra en `/productos`, sin bloquear ventas ni enviar avisos externos. OWNER/ADMIN configuran; STAFF/CLIENT no consultan inventario. |

RN-21/RN-25 siguen exigiendo OWNER y disposición explícita para anular productos confirmados; los cobros PAID permanecen y la venta anulada exige resolución separada. La verificación de pagos de cita ahora exige caja abierta para cobros nuevos; el registro PENDING continúa permitido sin ella.

## Panfletos semanales del inicio público — 2026-10-23

| ID | Regla propuesta | Estado |
|---|---|---|
| RN-31 | La portada muestra un panfleto configurable por día de lunes a domingo, calculado en `America/Lima`; OWNER y ADMIN pueden reemplazarlo desde el panel. Una posición sin imagen publicada conserva la portada informativa existente. | Plan aprobado e implementado localmente; evidencia en [validación](features/inicio-publico-panfletos-semanales/validation.md). Despliegue remoto pendiente. |

El panfleto dominical no significa apertura el domingo ni modifica RN-01. Las imágenes y sus afirmaciones comerciales requieren material autorizado del negocio; la implementación no publica automáticamente los carteles de referencia anteriores.

## Indicadores del panel 5.1 — aprobación 2026-10-29

El usuario confirmó que está en Trujillo y aprobó el [plan de indicadores](features/actividad-5-kpis/plan.md). Se conserva la zona `America/Lima` de RN-01.

| ID | Regla aprobada |
|---|---|
| RN-32 | Para cada mes calendario de Lima, «total cobrado» suma cobros `PAID` de citas (tipo BALANCE/DEPOSIT) y productos por `paid_at`, cada uno una sola vez, incluso cuando la venta está ligada a una cita o fue anulada y su pago quedó conservado. No suma asientos de caja, devoluciones ni pagos pendientes/fallidos. Los importes se calculan con decimal exacto. |
| RN-33 | «Citas completadas» cuenta citas con estado `COMPLETED` por mes de su inicio programado (`starts_at`), no por fecha real de finalización, que el modelo no registra. Las cifras del panel 5.1 se reservan a OWNER/ADMIN activos con permiso `analytics.read`. |

La consulta SQL de 5.1 está aplicada y validada en Supabase local; resultados en [validation.md](features/actividad-5-kpis/validation.md). Estas reglas no definen metas, rentabilidad, facturación, retención ni envíos de recordatorios.

## Gráficos del panel 5.2 — aprobación 2026-10-29

El usuario aprobó el [plan de gráficos](features/actividad-5-dashboard-graficos/plan.md) mediante «Vamos con eso». Se mantiene el mes calendario de `America/Lima` y la distinción entre cobros y actividad de RN-32/RN-33.

| ID | Regla aprobada |
|---|---|
| RN-34 | «Servicios realizados» cuenta una vez cada `appointment_item` de cita `COMPLETED` por mes de `starts_at` programado. Varias mascotas/items cuentan por separado; etapas y trabajadores no multiplican el item. El ranking muestra hasta cinco servicios por cantidad descendente, desempate por ID, con nombre actual del catálogo. |
| RN-35 | «Productos vendidos» cuenta unidades de movimientos `SALE` por mes de `created_at` cuando la venta sigue `CONFIRMED`. Una venta anulada sale del ranking con RESTOCK o NO_RESTOCK, mientras su cobro `PAID` sigue en RN-32 si no hubo devolución. El ranking muestra hasta cinco productos por cantidad descendente, desempate por ID, con nombre actual. |
| RN-36 | El panel muestra 12 meses de cobros confirmados separados entre servicios y productos, incluidos meses vacíos en cero. Las cifras y rankings se reservan a OWNER/ADMIN activos con `analytics.read`; STAFF puede usar `/panel` para enlaces operativos permitidos, sin analítica financiera. |

La consulta y el panel se implementaron en Supabase local y Angular. Ver [validación 5.2](features/actividad-5-dashboard-graficos/validation.md). No se definen ingresos devengados, rentabilidad, metas ni retención.

## Recordatorios y lista por contactar 5.3 — aprobación 2026-10-29

El usuario aprobó el [plan 5.3](features/actividad-5-recordatorios-contactos/plan.md) mediante «Dale sigue» tras confirmar la propuesta manual de recordatorio para mañana y seguimiento a 30 días. Las reglas siguientes describen una lista de trabajo, no envíos automáticos.

| ID | Regla aprobada |
|---|---|
| RN-37 | Recordatorio: cita `CONFIRMED` que comienza mañana según fecha de `America/Lima`. Seguimiento: cliente activo con última cita `COMPLETED` iniciada hace 30 días calendario o más, sin cita futura confirmada/en atención. Una oportunidad por cita o por ciclo de última cita completada; cambios de cita y bajas se recalculan. |
| RN-38 | WhatsApp manual solo con número, `clients.whatsapp_opt_in=true` y último consentimiento registrado como concedido con fuente verbal o escrita. Un `true` legado sin procedencia no basta. OWNER/ADMIN registran o revocan consentimiento; STAFF no lo concede. |
| RN-39 | OWNER/ADMIN/STAFF activos con permisos consultan y registran intentos manuales por WhatsApp o teléfono. `CONTACTED` y `SKIPPED` cierran la oportunidad; `NO_ANSWER` la deja visible. Actor/fecha se sellan en servidor, los reintentos usan identificador idempotente y el historial es inmutable para la API. CLIENT/anon no acceden. |

La implementación y sus límites locales constan en [validación 5.3](features/actividad-5-recordatorios-contactos/validation.md). Un intento registrado no acredita entrega de un mensaje.
