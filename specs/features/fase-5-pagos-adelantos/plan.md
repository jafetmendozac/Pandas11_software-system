# Plan técnico — Fase 5

Fecha: 2026-10-18. Estado: aprobado expresamente mediante «Si apruebo». Implementación incremental exclusivamente local; validación local finalizada.

## Arquitectura propuesta

Página privada `/pagos` dentro de AppLayout → componentes reutilizados de tabla/modal/formulario → PaymentsService y tipos manuales de dominio → SupabaseService → RPC PostgreSQL con autorización, validación monetaria y transacciones. Desde la ficha de una cita, enlace a sus pagos solo con permiso financiero. Reutilizar estilo TailAdmin; no convertir las pantallas de facturas de demostración en un módulo financiero.

D5-02 confirma comprobantes mediante número de operación y referencia. No se implementan archivos, Storage ni Edge Functions; no se necesitan dependencias nuevas.

## Impacto propuesto sobre Pandas11.sql

| Elemento | Cambio después de aprobación |
|---|---|
| payments | UUID por defecto; appointment_id/type/method/status/amount/created_at obligatorios. PENDING y timestamps de servidor por defecto |
| amount | numeric sin redondeo implícito; CHECK finito, >0 y máximo dos decimales. Mantener PEN como moneda única documentada |
| verified_by / paid_at | Mantener FK a profiles; PAID exige verificador y fecha. PENDING/FAILED no simulan recepción verificada; definir paid_at como fecha efectiva de verificación en esta versión |
| Nuevos campos de trazabilidad | created_by uuid FK profiles, updated_at timestamptz, version entero positivo default1, rejection_reason text y request_id uuid único para reintentos |
| operation_code / external_ref | Mantener identificadores opcionales y distinguir operación del proveedor de request_id interno. Límites de longitud y normalización. No deducir una unicidad bancaria universal por un número que distintos proveedores pueden repetir |
| proof_url | Conservar columna del modelo sin uso en este flujo y rechazarla en payload de escritura. Sin proof_path, archivos o URLs de comprobantes, según D5-02 |
| FK e índices | Conservar appointment_id→appointments y verified_by→profiles; agregar FK created_by. Sin borrado en cascada de cobros. Índices existentes más paginación (created_at,id) y unicidad request_id |
| Enums | Mantener los valores del modelo. No habilitar REFUND/REFUNDED sin política aprobada; no renombrar estados para inventar otro contrato |
| appointments | No añadir columnas de saldo duplicado: resumen derivado de pagos. Nueva protección ante reducción de total bajo lo cobrado y coordinación con cancelación |

Las ampliaciones anteriores fueron aprobadas y reflejadas en el modelo y nuevas migraciones; no se modificaron las cinco migraciones anteriores. No usar SQL raíz como migración automática.

## Secuencia incremental

### 1. Cerrar decisiones y comprobar entorno local

Las tres respuestas están incorporadas en requisitos. El usuario aprobó el plan concretado, incluida la limitación de devoluciones/correcciones y la exigencia técnica de COMPLETED para cobrar al finalizar.

Tras aprobación, inspeccionar historial/esquema exclusivamente local con Supabase CLI. Si existe payments con datos/contrato ajeno al historial, detener su conciliación y presentar diferencias; no eliminarlo ni reemplazarlo. Crear una migración nueva mediante `supabase migration new payments_advances`; aplicar solo con `supabase migration up --local`, sin reset, db push ni link remoto.

### 2. Seguridad y contratos SQL

Permisos propuestos: `payments.read` y `payments.create` para OWNER/ADMIN; `payments.verify` solo OWNER, que también controla el rechazo. D5-01 confirma que ADMIN no verifica ningún método, incluido efectivo. STAFF/CLIENT/anon sin acceso financiero; appointments.read no concede acceso. No exponer un endpoint de autoservicio del cliente todavía.

RLS de lectura y revocación de INSERT/UPDATE/DELETE directos a anon/authenticated. Escrituras solo por RPC SECURITY DEFINER, search_path vacío, objetos cualificados, EXECUTE mínimo y comprobaciones activas por operación. Datos financieros fuera de get_appointment/search_appointments ordinarios para no filtrarlos a personal sin permiso.

Contratos propuestos, ajustables sin ampliar alcance:

- `search_payments`: búsqueda paginada, filtros y orden estable; datos mínimos de cita/cliente autorizados, sin notas internas.
- `appointment_payment_summary`: total de cita, confirmado, pendiente de verificar, saldo y alerta de resolución tras cancelación, en una consulta consistente. Importes como texto decimal.
- `register_payment`: valida cita/estado/tipo/método/importe, registra PENDING, actor de servidor y request_id. Misma clave y mismo contenido devuelve el registro existente; cambio de contenido falla. Clave no concede acceso al registro de otro usuario.
- `verify_payment`: exige permiso y versión esperada, revalida saldo/estado y marca PAID una sola vez, con actor/fecha de servidor.
- `reject_payment`: solo PENDING, motivo obligatorio y versión esperada; FAILED permanece trazable. Un nuevo intento genera otro registro, no sobrescribe el fallido.

No aceptar payload con status PAID, verified_by, fechas de servidor, saldo o source de cita. No tratar un código de operación o evidencia como confirmación. Los límites máximos de texto se documentan y verifican en servidor; no confiar solo en formularios.

### 3. Dinero, concurrencia y compatibilidad con agenda

Reutilizar numeric y representación decimal en texto; ninguna suma autoritativa con Number/parseFloat en Angular. Saldo calculado sobre total_price ya derivado por agenda, sin duplicar items, empleados o transporte.

Todas las escrituras financieras y los cambios de cita afectados usan `private.appointment_lock()` (mutex930003, Read Committed), con lectura nueva de estado/sumas después del lock. Revalidar permisos tras esperar. Aplicar versión al pago y clave de idempotencia al registro; un botón deshabilitado no evita por sí solo carreras ni reintentos tras una respuesta perdida.

Incorporar en una nueva migración la protección frente a cambios de total en save_internal_appointment, sin editar la migración de Fase 4. Una reducción incompatible se revierte íntegramente, también items/asignaciones. Confirmación/cancelación comparten protocolo: si cancelación gana, verificación rechazada; si pago gana, cancelación conserva importe recibido y alerta de resolución. Prohibir nuevos cobros en CANCELLED/NO_SHOW.

No bloquear el cierre operativo COMPLETED por saldo pendiente: son estados distintos y la UI muestra ambos. Propuesta RN-09: BALANCE solo sobre COMPLETED; D5-03 confirma que no se habilita DEPOSIT en citas internas. Conservar el tipo en el modelo no habilita su registro por RPC; el adelanto ONLINE queda para una fase futura.

No implementar devolución ni reversión de PAID. Señalar claramente la limitación y conservar el pago ante cancelaciones. Antes de añadir futuras devoluciones se necesitará relación al pago original y reglas para reembolsos parciales; una simple suma de REFUNDED podría descontar dos veces.

### 4. Comprobantes por operación y referencia

D5-02 confirmada: conservar operation_code y external_ref con límites y normalización, sin almacenar archivos ni URLs. Propuesta: máximo120 caracteres por campo, recortar espacios y convertir vacío en NULL; validar tanto Angular como SQL. Efectivo no requiere código bancario; no exigir operaciones ficticias. La referencia sigue siendo opcional y no confirma recepción automáticamente.

Mantener proof_url sin uso y rechazarlo en el contrato de escritura. No crear bucket, políticas de Storage, proof_path ni funciones de subida o enlaces firmados. Una futura ampliación a adjuntos requerirá su propio plan.

### 5. Angular y experiencia de uso

Agregar PaymentsService, modelos tipados y página dentro de carpetas actuales. Ruta y menú por payments.read; acciones por sus permisos efectivos. Reutilizar controles, breadcrumb, tarjetas, tabla y modal con foco/cierre accesibles, tema oscuro y RTL.

Listado por cliente/cita/estado/método/fecha, paginado en servidor; detalle con importes exactos, evidencias, autor/verificador y estados textuales. Diferenciar «Registrado, por verificar», «Confirmado» y «Rechazado». Resumen calculado en servidor; no sumar solo una página cargada ni exponer notas internas del cliente.

Formularios de registro/verificación en modal, conservando entradas ante fallos, bloqueo de doble envío y descarte de respuestas obsoletas. Conflicto de saldo/versión obliga a recargar y revisar, sin reintento automático ciego. Enlace desde ficha de cita visible solo por permiso; no rediseñar el calendario de plantilla ni afectar disponibilidad.

No cambiar textos comerciales de portada automáticamente: el nuevo módulo admite cinco medios por petición, pero cualquier cambio publicitario se presentará expresamente si se solicita.

### 6. Validar y documentar

Seguir [validation.md](validation.md), incluyendo pruebas concurrentes de API contra la instancia local y todas las suites pertinentes anteriores. Actualizar modelo, reglas confirmadas, arquitectura, roadmap, baseline y README de Supabase con resultados reales y límites. No registrar comprobantes o datos reales en pruebas; fixtures sintéticos identificables y limpieza exclusiva de esos fixtures.

## Archivos previstos tras aprobación

- Pandas11.sql y nueva migración `supabase/migrations/<timestamp>_payments_advances.sql`.
- Tests SQL de pagos y `scripts/test-payments-api.mjs`; sin cambios de Storage.
- `src/app/shared/services/payments.service.ts`, modelos y pruebas; `src/app/pages/pagos/` y componentes de dominio si necesarios.
- Rutas/sidebar, enlace mínimo desde agenda y pruebas de autorización/componentes afectadas.
- Documentación SDD y README; sin dependencias nuevas, seed de datos reales, commits, producción ni cambios en otras funcionalidades.

## Riesgos y condiciones de aprobación

D5-01/D5-02/D5-03 están confirmados. El usuario aprobó las ampliaciones del modelo, cobros parciales, saldo exacto sin sobrepagos, estados terminales, cobro BALANCE solo en COMPLETED y ausencia temporal de devoluciones/correcciones. Con RN-09 ratificada, esta fase tendrá cobros internos operativos y preparación documental de adelantos; no se presentará como autorreserva con adelanto ya disponible.

## Concreción de implementación

- `20261018225928_payments_advances.sql`: tabla/enums, constraints/defaults, permisos/RLS, registro idempotente, decisiones con versión, resumen exacto y trigger de protección del total de agenda.
- `20261018230255_payments_queries.sql`: selector paginado de citas internas completadas y get_payment individual. Se separaron las consultas en otra migración para conservar intacta la principal ya aplicada durante el trabajo incremental.
- No fue necesario reemplazar save_internal_appointment: un trigger BEFORE UPDATE OF total_price protege el total dentro de su transacción y toma el mismo mutex930003. Un fallo revierte la edición completa. Se conserva el contrato de Fase 4.
- Verificar/rechazar comprueba permiso y pertenencia activa a OWNER en servidor; un permiso delegado por rol personalizado no permite eludir RN-16. Lectura/registro siguen permisos de dominio, inicialmente asignados a OWNER/ADMIN, con la administración de roles existente.
- Registro de cobros solo BALANCE sobre INTERNAL/COMPLETED. No hay endpoint de adelanto ONLINE ni DEPOSIT interno habilitado. REFUND/REFUNDED se conservan en enums sin permitir su escritura por las RPC de este alcance.
- No adjuntos ni bucket. Operación/referencia opcionales, normalizados y limitados a120 caracteres; rechazo exige motivo hasta500. paid_at representa verificación del propietario, no una fecha bancaria inferida.
- La interfaz usa página privada, tablas y modales con foco CDK; el estado confirmado es independiente del cierre de atención. Un error PostgreSQL explícito permite corregir el formulario; una respuesta de red incierta conserva payload y clave para reintentar idempotentemente.
- El flujo vigente no cancela citas COMPLETED. Las alertas sobre cobros en canceladas/no asistidas son protección ante datos históricos/importados; no amplían las transiciones de Fase 4.

Pruebas y límites reales en [validation.md](validation.md). Sin despliegue remoto, nuevas dependencias, commits ni cambios de Storage.
