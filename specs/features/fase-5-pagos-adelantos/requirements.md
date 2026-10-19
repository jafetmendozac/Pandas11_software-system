# Fase 5 — Pagos y adelantos

Fecha: 2026-10-18 (America/Lima). Estado: plan aprobado mediante «Si apruebo»; implementación local realizada, validación local finalizada.

## Objetivo y fuentes

Registrar cobros de citas, adelantos, evidencias y verificaciones manuales mediante Yape, Plin, efectivo, tarjeta o transferencia. Mostrar cuánto se recibió realmente y cuánto queda pendiente.

Fuentes: solicitud del usuario, [reglas de negocio](../../business-rules.md), [modelo local](../../../Pandas11.sql), migraciones de Fases 0–4, AppointmentsService y agenda existente. El modelo local no demuestra el esquema remoto.

## Hechos comprobados y diferencias

- `Pandas11.sql` contiene `payments`, sus índices, FK a appointments y FK de verified_by a profiles. Contempla DEPOSIT/BALANCE/REFUND, los cinco métodos solicitados y PENDING/PAID/FAILED/REFUNDED.
- Excepto id, sus campos admiten NULL; faltan defaults, precisión monetaria validada, autor del registro y protección contra reintentos. CHECK amount > 0 no sustituye NOT NULL ni limita decimales/valores especiales.
- Las cinco migraciones existentes no crean payments. No hay servicio ni pantalla operativa de cobros. Los componentes de facturación de la plantilla no acreditan un módulo conectado.
- Fase 4 crea citas INTERNAL, CONFIRMED y deposit_required=0. No existe autorreserva ONLINE funcional. Su total se calcula a partir de snapshots; las ediciones pueden cambiarlo.
- Supabase Storage está habilitado en configuración, con límite global 50MiB; no se identificó un bucket ni políticas para comprobantes. Habilitación no implica un flujo de archivos implementado.
- RN-02 se amplió a los cinco métodos por solicitud de Fase 5; la portada todavía menciona Yape/efectivo. No se infiere una integración bancaria.

## Reglas aplicables

- RN-02: los cinco medios solicitados se registran manualmente. Seleccionar Yape/Plin/tarjeta/transferencia no acredita recepción del dinero.
- RN-08: adelanto de autorreserva S/ 20, verificación OWNER y confirmación posterior. Preparar el dominio no equivale a implementar reservas online; no crear un flujo parcial que confirme citas inexistentes o eluda disponibilidad.
- RN-09: mantener cobro final para citas creadas por personal, sin adelantos voluntarios, confirmado nuevamente por el usuario.
- RN-12: moneda PEN y cálculo exacto en servidor. Cobros mayores que cero, finitos y con máximo dos decimales; una cita gratuita no necesita un pago ficticio.
- RN-13: permisos de agenda no conceden automáticamente acceso financiero. OWNER y ADMIN registran; solo OWNER verifica todos los pagos, según D5-01. La matriz forma parte del plan aprobado.
- PN-05/PN-07: vencimiento de reservas y devoluciones siguen pendientes. No deducirlos de enums o estados existentes.
- RN-16/RN-17/RN-18: registro OWNER/ADMIN y verificación exclusiva OWNER; comprobantes por operación/referencia; cobro final interno sin adelantos voluntarios. Confirmadas en las respuestas de esta fase.

## Decisiones confirmadas por el usuario

Fuente: respuestas explícitas recibidas el 2026-10-18. Resuelven requisitos; no constituyen aprobación de implementación del plan completo.

| ID | Decisión confirmada | Consecuencia |
|---|---|---|
| D5-01 | OWNER y ADMIN registran; OWNER verifica todos los pagos | Ambos necesitan lectura financiera para registrar/consultar; verificación y rechazo propuestos solo OWNER. STAFF/CLIENT/anon no reciben permisos financieros |
| D5-02 | Solo número de operación y referencia | Sin archivos, bucket, Storage, enlaces externos ni nuevo campo proof_path |
| D5-03 | Mantener cobro al finalizar; preparar adelantos para futuras autorreservas | Sin DEPOSIT operativo en citas internas; RN-08 se mantiene para la futura autorreserva |

La lectura OWNER/ADMIN y el rechazo reservado a OWNER quedaron aprobados con el plan. El permiso de registrar no permite verificar ni siquiera efectivo automáticamente.

## Comportamiento aprobado

1. Cada pago pertenece a una cita existente. Puede haber varios cobros parciales y varios métodos en una cita; cada fila representa un importe y un método. BALANCE significa abono al saldo, no necesariamente liquidación completa.
2. Registrar crea PENDING. Solo una acción autorizada de verificación cambia a PAID, con identidad y fecha de servidor. Rechazar una evidencia cambia PENDING a FAILED con motivo. PAID/FAILED son terminales para este alcance; no hay edición destructiva ni borrado de pagos confirmados.
3. Verificar significa comprobar recepción fuera del software; el sistema registra esa decisión humana. No hay consulta automática a Yape, Plin, bancos ni pasarela de tarjeta.
4. Recibido confirmado = suma de DEPOSIT/BALANCE en PAID. Pendiente de verificar = suma en PENDING, separada y sin descontar del saldo. Saldo por cobrar = total vigente de la cita menos recibido confirmado, calculado por SQL. No sumar nuevamente el transporte: Fase 4 no lo cotiza y actualmente lo fija en cero.
5. No admitir confirmaciones por encima del saldo ni reducir el total de una cita por debajo de lo ya cobrado. Recalcular después de adquirir el bloqueo transaccional; confirmar dos pagos simultáneamente no puede producir sobrecobro. La espera de verificación no reserva dinero ni cuenta como ingreso.
6. Propuesta para RN-09: BALANCE se registra/verifica cuando la cita está COMPLETED; completar la atención no implica que esté pagada y pagar no cambia su estado de atención. D5-03 descarta adelantos internos: DEPOSIT no se admite en este flujo. La exigencia técnica de COMPLETED concreta «al finalizar» y fue aprobada con el plan.
7. Cancelar/no asistir conserva historial y dinero recibido; bloquea cobros nuevos y confirmaciones pendientes. No ejecutar devolución, retención, penalidad o compensación automática. Un importe ya recibido en cita cancelada se muestra como importe que requiere resolución, sin afirmar que sea ingreso ganado o devolución realizada.
8. Comprobantes mediante número de operación y referencia, según D5-02. No crear bucket ni aceptar URLs públicas arbitrarias. El efectivo no requiere un código bancario ficticio; una referencia no marca PAID.
9. Conservar los enums REFUND/REFUNDED como parte del modelo; su escritura se rechaza en esta entrega. Devoluciones, correcciones de pagos ya verificados y conciliación bancaria necesitan política y diseño posteriores. Limitación aprobada en este alcance: cualquier corrección/devolución futura exige un nuevo plan.
10. No implementar autorreserva, vencimientos ni confirmación ONLINE en esta fase. El adelanto obligatorio de S/ 20 se documenta y distingue de cobros internos; su flujo completo dependerá de la fase de autorreserva. Por D5-03, DEPOSIT no tendrá un flujo operativo en las citas internas actuales.

## Criterios de aceptación aprobados

| ID | Resultado verificable |
|---|---|
| F5-01 | Nueva migración incremental y modelo coherentes, con FK, defaults, constraints, RLS y permisos; sin reset ni cambios remotos |
| F5-02 | YAPE, PLIN, CASH, CARD y TRANSFER disponibles, con etiquetas en español y sin afirmar confirmación automática |
| F5-03 | Registro PENDING no reduce saldo; verificación autorizada lo reduce exactamente una vez; FAILED nunca suma |
| F5-04 | Autor, verificador, fechas, estado e importes derivados no pueden falsificarse mediante el payload |
| F5-05 | Rechazar vacío, cero, negativo, NaN/infinito, más de dos decimales, cita inexistente y tipo/método no admitido |
| F5-06 | Cobros parciales y métodos combinados producen saldo exacto; total cero se muestra sin deuda ni pago artificial |
| F5-07 | Reintento con misma clave no duplica; misma clave con contenido distinto falla; verificar/rechazar con versión obsoleta falla |
| F5-08 | Confirmaciones concurrentes y cambios simultáneos de precio no permiten sobrecobrar ni rebajar el total bajo lo recibido |
| F5-09 | Cancelación concurrente impide confirmar después de cancelada; historial conservado y resolución pendiente visible |
| F5-10 | RLS, RPC, rutas y acciones aplican D5-01; consulta de citas por STAFF no expone evidencias/operaciones de pago |
| F5-11 | Número de operación y referencia con límites; sin cargas de archivos, URLs de comprobantes ni Storage |
| F5-12 | Cobro interno al finalizar; DEPOSIT rechazado en citas internas; sin reservas online implícitas |
| F5-13 | Listado paginado estable, filtros por cita/cliente, estado, método y fecha; sumar en servidor, no solo la página cargada |
| F5-14 | Página y formularios conservan estilo TailAdmin, modal accesible, oscuro/RTL y errores sin pérdida de datos; sin doble envío |
| F5-15 | Pruebas SQL/API/Angular y build pertinentes registrados con resultados reales y regresiones de Fases 0–4 |

## Fuera de alcance y límites

Boletas/facturas (`billing_documents`), inventario, caja contable, descuentos, propinas, monedas adicionales, pasarela/captura de tarjeta, almacenamiento de datos de tarjeta, OCR, notificaciones, devoluciones y reservas online. Tampoco cambios de producción o adopción del esquema remoto. La portada comercial no se modifica automáticamente por incorporar métodos al módulo interno.

## Resultado de implementación local

La evidencia actualizada está en [validation.md](validation.md). Los hechos de ausencia de módulo/migración descritos arriba corresponden al diagnóstico previo; ahora existen dos migraciones incrementales, servicio y página /pagos. Adelantos ONLINE y devoluciones siguen fuera del flujo operativo.
