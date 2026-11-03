# Actividad 5.3 — Recordatorios y lista por contactar

Fecha: 2026-10-29 (America/Lima). Estado: aprobado e implementado localmente. El usuario aprobó el [plan](plan.md) mediante «Dale sigue».

## Contexto y modelo

La matriz S1–S14 identifica 5.3 como siguiente punto. `Pandas11.sql` define `clients` (`whatsapp`, `whatsapp_opt_in`, `deleted_at`), `pets`, `appointments` (`client_id`, `starts_at`, `status`) y `notifications` (canal/estado/fecha de envío). Las migraciones locales incluyen clientes y citas, pero ninguna instala `notifications`; tampoco hay registro de contactos o procedencia del consentimiento. El menú de notificaciones Angular contiene datos de plantilla. No se ha comprobado el esquema remoto.

RN-01 fija `America/Lima`; RN-13 permite a STAFF consultar la agenda y a OWNER/ADMIN gestionarla. La baja lógica de Fase 1 excluye clientes retirados. RN-37–RN-39 registran las decisiones aprobadas para 5.3. No existe regla aprobada para mensajería automática.

## Recorrido y definiciones propuestas

1. El personal entra a `/por-contactar` desde el menú. Ve dos tipos de pendientes calculados en servidor: **recordatorio de cita** y **seguimiento**. La lista no programa ni envía mensajes.
2. Recordatorio: una cita `CONFIRMED` cuya fecha local de inicio es **mañana**. Una cita reprogramada usa su fecha vigente; `CANCELLED`, `NO_SHOW`, `IN_PROGRESS` y `COMPLETED` no generan recordatorio.
3. Seguimiento: cliente activo cuya **última** cita `COMPLETED` comenzó hace al menos 30 días calendario de Lima, sin una cita futura `CONFIRMED`/`IN_PROGRESS`. Se muestra una oportunidad por cliente y última cita, no una por mascota/item. El contacto registrado para esa oportunidad impide volver a presentar la misma última cita; una nueva cita completada abre un ciclo nuevo.
4. Cada fila muestra cliente, mascota(s) si corresponde, motivo, fecha, canal disponible y estado del intento. Buscar, filtrar por tipo y paginar en servidor. Un número de WhatsApp solo habilita la acción externa si hay consentimiento vigente **con procedencia registrada**; el booleano legado `whatsapp_opt_in` por sí solo no acredita consentimiento. La ficha permite registrar/revocar consentimiento con fuente y responsable.
5. Personal autorizado registra un intento manual por `WHATSAPP` o `PHONE` con resultado `CONTACTED`, `NO_ANSWER` o `SKIPPED` y nota opcional; el servidor sella fecha/actor. Un resultado final `CONTACTED`/`SKIPPED` cierra esa oportunidad; `NO_ANSWER` conserva la oportunidad visible como intentada. El resultado no prueba entrega de un mensaje de WhatsApp.

## Criterios de aceptación

| ID | Criterio | Reglas |
|---|---|---|
| RC-01 | Lista calcula recordatorios mañana y seguimiento a 30 días por fecha Lima, sin duplicados por varios items/mascotas y con paginación estable. | RN-01, RN-14, RN-37 |
| RC-02 | Cambios de estado/fecha de cita y baja de cliente actualizan candidatos al consultar; solo citas vigentes elegibles aparecen. | RN-13, RN-37; baja lógica Fase 1 |
| RC-03 | OWNER/ADMIN/STAFF activos con permiso específico consultan y registran intentos; CLIENT/anon/inactivos no obtienen lista, teléfonos ni historial mediante RPC/REST. El servidor comprueba permisos, no solo el menú. | RN-13, RN-39; permisos Fase 0 |
| RC-04 | WhatsApp solo se ofrece con número, `whatsapp_opt_in=true` y último consentimiento registrado como concedido. Un valor legado sin procedencia no habilita el enlace. Revocación lo deshabilita inmediatamente. | RN-38 |
| RC-05 | Intento conserva tipo, cita o última cita, cliente, canal, resultado, nota, actor y fecha; reintentos no duplican el mismo registro y un contacto cerrado no reaparece. | RN-39 |
| RC-06 | UI distingue pendiente, intentado y cerrado; tiene carga, vacío, error/reintento, foco y adaptación móvil/oscuro. No presenta mensajes como enviados ni usa nombres ficticios del dropdown. | experiencia 5.3 |
| RC-07 | Pruebas SQL con datos sintéticos cubren frontera Lima, concurrencia, permisos, consentimiento y ciclos; pruebas Angular, build y regresiones pertinentes pasan. | SDD |

## Límites

Sin envío automático, proveedor externo, SMS, email, campañas masivas, scheduler, evidencia de entrega, historial de mensajes del proveedor ni adopción remota. `notifications` del SQL de referencia no se instala para representar intentos manuales: su `status=SENT/DELIVERED` implicaría un envío que este flujo no realiza.
