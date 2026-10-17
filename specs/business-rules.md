# Reglas de negocio

Fecha: 2026-10-16 (America/Lima).
Fuente: reglas indicadas por el usuario en la conversación.
Estado: definiciones iniciales; ambigüedades pendientes de aclaración. Documentar una regla no significa que ya esté implementada.

## Reglas declaradas y aclaradas

Fuente: solicitud inicial y respuestas posteriores del usuario. Estas definiciones no acreditan implementación.

| ID | Regla | Estado de definición |
|---|---|---|
| RN-01 | Atención de lunes a sábado, incluidos feriados, con horario disponible de 07:00 a 18:00. Domingo es descanso. Se permite que un servicio termine después de las 18:00 | Confirmado: último inicio a las 17:00 y zona America/Lima (plan de Fase 3 aprobado) |
| RN-02 | Medios de pago: Yape o efectivo | Confirmado |
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
| PN-04 | ¿Cuánto tiempo se reserva para baño y para corte en un servicio compartido? ¿Se permite espera entre etapas? | RN-03, RN-07, RN-10 |
| PN-05 | ¿Cuándo vence el plazo para pagar el adelanto o verificarlo y cuándo se libera la reserva? | RN-08 |
| PN-06 | Resuelto: las citas registradas por personal se cobran al final, tenga o no cuenta el cliente | RN-09 |
| PN-07 | ¿Qué reglas aplican a cancelaciones, reprogramaciones, retrasos y devoluciones del adelanto? | RN-01, RN-08 |
| PN-08 | ¿Una cita puede incluir varios perros del mismo cliente? ¿Se aplica algún límite por cita además de la capacidad simultánea? | RN-03 |

Las respuestas deben incorporarse aquí sin convertir propuestas del agente en decisiones confirmadas.

## Relación con la implementación existente

- La restricción de domingos observada en la agenda coincide con RN-01; no acredita cumplimiento completo de feriados, horario o finalización posterior a las 18:00.
- La duración en agenda se obtiene de los servicios seleccionados; eso no acredita que sus valores almacenados correspondan a RN-04/RN-05.
- El enum SQL local contempla más medios de pago que Yape y efectivo. RN-02 define lo solicitado por el negocio; no autoriza reducir el enum ni modificar datos existentes.
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
