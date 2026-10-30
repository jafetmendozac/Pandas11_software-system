# Plan — Actividad 5.3, recordatorios y lista por contactar

Fecha: 2026-10-29 (America/Lima). Estado: **aprobado e implementado localmente** mediante «Dale sigue». Requisitos: [requirements.md](requirements.md). Validación: [validation.md](validation.md).

## Decisión de modelo que requiere aprobación

`Pandas11.sql` prevé `notifications` para mensajes programados/enviados, pero no existe una migración operativa. Usarla para intentos manuales falsearía el significado de `SENT/DELIVERED`. Se propone añadir al modelo local y a una migración incremental:

- `client_contact_consents`: `id`, `client_id`, `channel=WHATSAPP`, `granted`, `source` (declaración verbal/escrita), `recorded_by`, `recorded_at`. Historial inmutable; solo el último evento determina consentimiento vigente, junto con `clients.whatsapp_opt_in` y un número no vacío. Los `true` históricos **no** se migran como consentimiento probado.
- `contact_attempts`: `id`, `client_id`, `kind` (`APPOINTMENT_REMINDER`/`FOLLOW_UP`), `appointment_id` (cita recordada o última completada), `channel` (`WHATSAPP`/`PHONE`), `result`, `note`, `request_id` único, `recorded_by`, `recorded_at`. Historial inmutable, sin texto del mensaje ni datos de proveedor. FKs e índices por cliente/cita/fecha y restricciones de tipo/resultado.

`clients`, `appointments`, `pets` y las nuevas tablas son los elementos afectados de `Pandas11.sql`. Se preservan sus relaciones y restricciones existentes; no se ejecuta el SQL raíz. La diferencia entre modelo previsto y migraciones locales queda explícita. Antes de migrar, confirmar catálogo local y permisos reales; el esquema remoto sigue sin acreditarse.

## Implementación incremental propuesta

1. Crear migración posterior a 5.2 con ambas tablas, índices, RLS y permisos `contacts.read`, `contacts.record`, `contacts.consent`. OWNER/ADMIN/STAFF activos reciben lectura e intentos; solo OWNER/ADMIN gestionan consentimiento. RPC `contact_queue` calcula candidatos y pagina en servidor según `America/Lima`; `record_contact_attempt` y `record_contact_consent` validan, sellan actor/fecha y comprueban permiso nuevamente tras bloqueo. `request_id` hace idempotente el registro de intentos. `EXECUTE` solo `authenticated`; sin escritura directa a las tablas.
2. La RPC de cola nunca devuelve notas internas, datos tributarios ni datos de clientes retirados. La consulta de consentimiento usa el último evento y el booleano actual; si falta procedencia, WhatsApp queda bloqueado. La RPC de consentimiento actualiza `clients.whatsapp_opt_in` junto con el evento; un cambio posterior por la edición general de cliente no convierte por sí solo un `true` legado en consentimiento válido. La vista de STAFF puede registrar resultado pero no conceder consentimiento. Registrar un intento de WhatsApp exige consentimiento vigente en servidor; las llamadas telefónicas requieren número y tampoco se declaran como mensajes enviados.
3. Añadir modelos y `ContactQueueService` en `src/app/shared/services/`. Crear página `/por-contactar` con lista, filtros, paginación, detalle de intento, registro/revocación de consentimiento para OWNER/ADMIN y enlace externo WhatsApp condicionado. Añadir ruta con permiso y navegación en sidebar; adaptar/eliminar del encabezado el contenido ficticio de notificaciones para no mostrarlo como actividad real. Reutilizar componentes, tokens y patrones existentes; sin dependencias nuevas.
4. Añadir pruebas SQL para candidatos, límites de zona, cambios de cita, consentimientos legados/revocación, RLS/roles, duplicados y carreras; pruebas Angular para permisos, estados de carga/error, resultado desconocido y ausencia de WhatsApp sin consentimiento. Probar `supabase test db` local, pruebas Angular pertinentes, tipos, build y revisión de regresiones. Inspección visual manual si el entorno lo permite.
5. Tras validar, actualizar `business-rules.md` con las decisiones aprobadas, `architecture.md`, `roadmap.md`, `matriz-seguimiento.md`, el anexo de Actividad 5 y `validation.md`. Registrar límites de verificación y estado remoto.

## Condiciones de aprobación

El usuario aprobó este plan mediante «Dale sigue», después de revisar las dos tablas nuevas, procedencia/revocación de consentimiento y matriz OWNER/ADMIN/STAFF. La implementación se limitó a Supabase local y Angular; no se cambiaron entornos remotos ni se enviaron mensajes.
