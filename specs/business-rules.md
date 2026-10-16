# Reglas de negocio

Fecha: 2026-10-16 (America/Lima).
Fuente: reglas indicadas por el usuario en la conversación.
Estado: definiciones iniciales; ambigüedades pendientes de aclaración. Documentar una regla no significa que ya esté implementada.

## Reglas declaradas

| ID | Regla | Estado de definición |
|---|---|---|
| RN-01 | Horario disponible de 07:00 a 18:00 | Declarado; faltan días, zona horaria y límite de finalización |
| RN-02 | Medios de pago: Yape o efectivo | Declarado; faltan momento de cobro y política de adelantos |
| RN-03 | Máximo 2 perros por hora o cita | Declarado con ambigüedad; falta precisar capacidad simultánea, por franja o por cita |
| RN-04 | Baño y corte dura 2 horas | Declarado; falta confirmar si duración por perro y si admite excepciones |
| RN-05 | Solo baño dura 1 hora | Declarado; falta confirmar si duración por perro y si admite excepciones |
| RN-06 | En baño con recojo, el administrador o propietario (owner) determina tiempo y precio según la distancia | Declarado; falta precisar tiempo total, regreso y desglose del precio |

No se presupone una fórmula automática para distancia, tiempo o precio del recojo. Tampoco se infiere un permiso técnico de Supabase a partir del nombre administrador u owner.

## Preguntas pendientes

| ID | Pregunta | Reglas afectadas |
|---|---|---|
| PN-01 | ¿Qué días atienden, incluidos domingos y feriados? ¿El horario corresponde a America/Lima? | RN-01 |
| PN-02 | ¿Los servicios deben terminar antes de las 18:00 o pueden empezar hasta esa hora? | RN-01, RN-04, RN-05 |
| PN-03 | ¿El máximo son dos perros simultáneos en todo el local, dos ingresos por hora o dos perros dentro de cada cita? ¿Aplica también un límite por empleado? | RN-03 |
| PN-04 | ¿Las duraciones son por perro, independientemente del tamaño/pelaje? ¿Quién puede modificarlas? | RN-04, RN-05 |
| PN-05 | ¿El recojo incluye devolución? ¿El tiempo de traslado ocupa capacidad del local o del empleado? ¿El importe definido incluye baño y transporte? | RN-06, RN-03 |
| PN-06 | ¿Se paga antes, al recoger o al finalizar? ¿Hay adelanto obligatorio y cómo se confirma Yape? | RN-02 |
| PN-07 | ¿Qué reglas aplican a cancelaciones, reprogramaciones, retrasos y devoluciones? | RN-01, RN-02, RN-03 |

Las respuestas deben incorporarse aquí sin convertir propuestas del agente en decisiones confirmadas.

## Relación con la implementación existente

- La agenda contiene una restricción de domingos; el usuario todavía no ha confirmado los días de atención. No se adopta automáticamente esa restricción como regla de negocio.
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

## Validación de esta entrega

Solo se incorporan reglas y referencias al flujo documental. La revisión es de contenido, enlaces y diff; no corresponde compilar Angular por estos cambios. No se ejecutaron pruebas funcionales, conexiones a Supabase ni cambios SQL.
