# Conciliación de hallazgos H-03 a H-23

Fecha: 2026-10-21 (America/Lima). Revisión del código y las migraciones locales; no certifica el esquema remoto. Complementa el [informe histórico](review.md). «Cubierto» significa que se encontró implementación para el alcance indicado; los resultados de suites anteriores siguen siendo históricos salvo ejecución nueva expresamente registrada en [validación](validation.md).

## Fuentes operativas

- [Identidad](../../../supabase/migrations/20261017152256_identity_foundation.sql): perfiles, roles, grants, RLS y protección OWNER.
- [Fichas](../../../supabase/migrations/20261017201505_clients_pets.sql): clientes, mascotas, vacunas y notas internas.
- [Catálogo](../../../supabase/migrations/20261017210343_services_prices.sql): servicios, tarifas y cotización.
- [Personal](../../../supabase/migrations/20261017212614_employees_availability.sql): turnos, horario comercial y bloqueos.
- [Agenda](../../../supabase/migrations/20261017220427_internal_appointments.sql): etapas, ocupación, snapshots y estados.
- [Pagos](../../../supabase/migrations/20261018225928_payments_advances.sql): cobro final, verificación e idempotencia.

## Resultado individual

| Hallazgo | Estado conciliado | Evidencia y límite / acción restante |
|---|---|---|
| H-03 | Cubierto en campos operativos revisados; parcial para el modelo completo | Fichas, catálogo, agenda y pagos declaran NOT NULL y CHECK en nombres, importes, minutos y rangos obligatorios. Los datos opcionales siguen admitiendo NULL. Las cinco tablas solo previstas no tienen contrato operativo validado; no se endurecen indiscriminadamente. |
| H-04 | Cubierto en módulos migrados | Las migraciones de identidad, fichas, catálogo, personal, agenda y pagos habilitan RLS y limitan funciones/escrituras. No extender esta afirmación a business_settings, billing_documents, billing_document_items, notifications ni audit_log, sin migración. |
| H-05 | Cubierto | Agenda incorpora stage, starts_at y ends_at; validate_appointment exige SERVICE o BATH→CUT consecutivos y minutos iguales al snapshot. RN-03/RN-07/RN-10/RN-15. |
| H-06 | Parcial: alternativa manual aprobada | Los bloqueos personales ocupan al trabajador e impiden reservas, pero no hay tarea de transporte vinculada automáticamente a una cita. Duración y asignación del recojo requieren definición PN-03 y plan propio. RN-06. |
| H-07 | Cubierto para ocupación programada; transporte enlazado pendiente | Agenda comparte mutex transaccional con cambios laborales y valida cruces de trabajador/mascota; labor_coverage resta bloqueos personales/globales. El recojo se registra manualmente como bloqueo. No acredita seguimiento real de demoras. |
| H-08 | Cubierto | labor_coverage verifica empleado/perfil activos y ALL_SERVICES cuando la etapa exige especialista. validate_appointment lo comprueba en servidor. RN-07. |
| H-09 | Parcial | La RPC interna restringe campos de entrada y crea INTERNAL, CONFIRMED y deposit_required=0. Pagos internos solo BALANCE al completar. Autorreserva, S/20 y vencimiento siguen sin implementación. RN-08/RN-09/RN-18. |
| H-10 | Cubierto para cobros finales | Pagos guarda verified_by y paid_at al verificar con reloj del servidor; exige OWNER activo, permiso y saldo revalidado bajo bloqueo. paid_at representa aquí la fecha de verificación manual; no se introduce un verified_at duplicado ni se presume fecha bancaria. Adelantos online fuera de alcance. RN-16. |
| H-11 | Cubierto en el contrato actual | pets.allergies es boolean NOT NULL; el servicio Angular declara boolean y normaliza el formulario. La guía local reserva detalle en notas internas. No se acredita conversión de posibles datos de otra base. |
| H-12 | Cubierto en agenda operativa | AppointmentsService usa search_appointments/get_appointment/save_internal_appointment y modelos por items/etapas/timestamps. El calendario operativo es /calendario; /calendar conserva la demostración de plantilla. |
| H-13 | Cubierto en reglas; configuración comercial por aceptar | Agenda usa America/Lima, limita primera atención por mascota hasta17 y exige turno explícito para fin después18. Personal configura lunes–sábado; no hay cierre automático por feriados. Validar configuración real con negocio. RN-01. |
| H-14 | Cubierto en cálculo; duraciones comerciales por confirmar | quote_service aplica exacta→tamaño→pelaje→general→base. Agenda conserva precio, minutos y habilidad como snapshots. No hay tiempos reales por tamaño aprobados como datos comerciales. RN-04/RN-05/RN-11/RN-12. |
| H-15 | Parcial | pickup_fee es obligatorio, no negativo y de dos decimales en el modelo/agenda. La RPC interna no admite campos de transporte; no existe cotización/vínculo operativo, autor de cotización ni duración automática. Requiere PN-03 y plan propio. |
| H-16 | Cubierto en total interno; parcial para transporte/online | save_internal_appointment suma precios autoritativos, sin confiar en total enviado. Pagos impide sobrecobro confirmado. El total con transporte y una autorreserva por menos de S/20 requieren especificación futura. |
| H-17 | Cubierto en entidades operativas revisadas; parcial global | Las entidades migradas principales declaran UUID/fechas por defecto y booleanos obligatorios. Tablas puente usan PK compuesta; notas usan FK como PK. Las cinco tablas previstas conservan diseño preliminar y no justifican cambios masivos. |
| H-18 | Cubierto para los checks enumerados | Fichas comprueba nombres, peso positivo, muerte no anterior al nacimiento y vigencia de vacuna; catálogo comprueba importe no negativo y minutos positivos. Foto/documento y reglas clínicas no se incorporan por esta revisión. |
| H-19 | Parcial: idempotencia implementada | payments.request_id es único y la RPC contrasta autor/payload en reintentos. operation_code sigue con índice no único: idempotencia no impide reutilizar un comprobante con otra request_id. No se ha acordado una clave de unicidad bancaria; se mantiene verificación humana. |
| H-20 | Resuelto por cambio de regla confirmado | RN-02 fue ampliada a Yape, Plin, efectivo, tarjeta y transferencia en Fase 5. El enum coincide con el alcance actual; no corresponde eliminar valores. |
| H-21 | Pendiente de evaluación de rendimiento | No se identifican índices inversos de user_roles(role_id) y role_permissions(permission_id) en la migración de identidad. No hay mediciones/EXPLAIN que justifiquen crearlos; requieren evaluación local, no se consideran fallo funcional demostrado. |
| H-22 | Parcial: desactivación operativa; borrado completo no validado | Identidad proporciona set_profile_active y protege OWNER; fichas usa baja lógica y agenda conserva terminales. Persisten FKs hacia profiles que pueden impedir borrado Auth. No existe cierre probado de toda la cadena de borrado ni política completa de purga. No borrar cuentas reales para comprobarlo. |
| H-23 | Fuera del alcance confirmado de 3.5; capacidad futura pendiente | audit_log existe solo en el modelo de referencia, sin migración/generación operativa. El usuario confirmó consulta de citas pasadas y canceladas, sin auditoría por modificación. No se presenta como implementada ni se agrega para cerrar 3.5. |

## Qué procede ahora

1. Demostrar consulta de citas pasadas y canceladas mediante el [recorrido 3.5](../../actividad-3-modulos-gestion.md), conservando la distinción entre prueba automática, recorrido con backend y aceptación humana.
2. Completar evidencias externas y aceptación del modelo de Actividad 1. Esta conciliación permite reemplazar «revisar H-03 a H-23» por acciones concretas, sin exigir implementar todas las ampliaciones del diseño futuro.
3. Mantener como decisiones futuras transporte vinculado/cotizado, autorreservas, unicidad bancaria, purga e índices medidos. Cada cambio funcional/modelo requiere su propio plan SDD aprobado.

No se modifican migraciones, políticas, datos ni permisos como consecuencia de esta clasificación.
