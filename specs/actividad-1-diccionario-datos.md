# Actividad 1 — Diccionario de datos

Versión documental: v1. Fecha de corte: 2026-10-20 (America/Lima). Fuente: [modelo local](../Pandas11.sql), contrastado con las migraciones disponibles. Describe el modelo de referencia, no el esquema remoto.

**Inventario:** 26 tablas en `Pandas11.sql`; 21 tienen `CREATE TABLE` en migraciones y 5 están solo en el modelo de referencia. Las columnas y defaults se toman del SQL raíz. Las migraciones y funciones contienen reglas adicionales.

PK = clave primaria; FK = foránea; UK = unicidad inline. «Obligatorio» indica `NOT NULL` o PK. Una columna nullable puede estar sujeta a una regla condicional.

## Tipos enumerados

| Tipo | Valores |
|---|---|
| `pet_sex` | MALE, FEMALE, UNKNOWN |
| `pet_size` | TOY, SMALL, MEDIUM, LARGE, EXTRA_LARGE |
| `pet_coat_type` | SHORT, MEDIUM, LONG, WIRE, CURLY, HAIRLESS |
| `skill_level` | ALL_SERVICES, ASSISTANT |
| `appointment_status` | REQUESTED, PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW |
| `appointment_source` | INTERNAL, ONLINE |
| `payment_type` | DEPOSIT, BALANCE, REFUND |
| `payment_method` | YAPE, PLIN, CASH, CARD, TRANSFER |
| `payment_status` | PENDING, PAID, FAILED, REFUNDED |
| `notification_channel` | WHATSAPP, SMS, EMAIL |
| `notification_status` | SCHEDULED, SENT, DELIVERED, FAILED, CANCELLED |
| `tax_doc_type` | DNI, RUC, CE, PASSPORT |
| `billing_doc_type` | BOLETA, FACTURA |
| `billing_doc_status` | DRAFT, ISSUED, VOIDED |

## Tablas y columnas

### `profiles` — Perfil de identidad

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK, FK | — |
| `first_name` | `text` | No | — | — |
| `last_name` | `text` | No | — | — |
| `active` | `boolean` | Sí | — | `true` |
| `created_at` | `timestamptz` | Sí | — | `now()` |
| `updated_at` | `timestamptz` | Sí | — | `now()` |

### `roles` — Roles de acceso

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `code` | `text` | Sí | UK | — |
| `name` | `text` | Sí | UK | — |
| `description` | `text` | No | — | — |
| `is_system` | `boolean` | Sí | — | `false` |
| `active` | `boolean` | Sí | — | `true` |
| `created_at` | `timestamptz` | Sí | — | `now()` |
| `updated_at` | `timestamptz` | Sí | — | `now()` |

### `permissions` — Permisos del sistema

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `code` | `text` | Sí | UK | — |
| `description` | `text` | Sí | — | — |
| `created_at` | `timestamptz` | Sí | — | `now()` |

### `role_permissions` — Permisos de cada rol

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `role_id` | `uuid` | Sí | PK, FK | — |
| `permission_id` | `uuid` | Sí | PK, FK | — |

### `user_roles` — Roles de cada perfil

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `user_id` | `uuid` | Sí | PK, FK | — |
| `role_id` | `uuid` | Sí | PK, FK | — |

### `employees` — Personal y habilidad

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `profile_id` | `uuid` | Sí | FK, UK | — |
| `phone` | `text` | No | — | — |
| `skill_level` | `skill_level` | Sí | — | — |
| `active` | `boolean` | Sí | — | `true` |
| `created_at` | `timestamptz` | Sí | — | `now()` |
| `updated_at` | `timestamptz` | Sí | — | `now()` |

### `employee_schedules` — Turnos recurrentes

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `employee_id` | `uuid` | Sí | FK | — |
| `weekday` | `smallint` | Sí | — | — |
| `start_time` | `time` | Sí | — | — |
| `end_time` | `time` | Sí | — | — |

### `business_hours` — Horario semanal del local

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `weekday` | `smallint` | Sí | — | — |
| `open_time` | `time` | Sí | — | — |
| `close_time` | `time` | Sí | — | — |

### `time_blocks` — Bloqueos de tiempo

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `employee_id` | `uuid` | No | FK | — |
| `starts_at` | `timestamptz` | Sí | — | — |
| `ends_at` | `timestamptz` | Sí | — | — |
| `reason` | `text` | Sí | — | — |
| `created_by` | `uuid` | Sí | FK | — |
| `created_at` | `timestamptz` | Sí | — | `now()` |
| `updated_at` | `timestamptz` | Sí | — | `now()` |

### `business_settings` — Configuración general prevista

**Estado:** solo modelo de referencia.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `key` | `text` | Sí | PK | — |
| `value` | `text` | No | — | — |
| `updated_at` | `timestamptz` | No | — | — |

### `clients` — Ficha de cliente

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `profile_id` | `uuid` | No | FK, UK | — |
| `first_name` | `text` | Sí | — | — |
| `last_name` | `text` | No | — | — |
| `phone` | `text` | No | — | — |
| `whatsapp` | `text` | No | — | — |
| `email` | `text` | No | — | — |
| `address` | `text` | No | — | — |
| `tax_doc_type` | `tax_doc_type` | No | — | — |
| `tax_doc_number` | `text` | No | — | — |
| `business_name` | `text` | No | — | — |
| `whatsapp_opt_in` | `boolean` | Sí | — | `false` |
| `deleted_at` | `timestamptz` | No | — | — |
| `created_at` | `timestamptz` | Sí | — | `now()` |
| `updated_at` | `timestamptz` | Sí | — | `now()` |

### `pets` — Mascota de cliente

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `client_id` | `uuid` | Sí | FK | — |
| `name` | `text` | Sí | — | — |
| `breed` | `text` | No | — | — |
| `pet_sex` | `pet_sex` | No | — | — |
| `pet_size` | `pet_size` | No | — | — |
| `pet_coat_type` | `pet_coat_type` | No | — | — |
| `photo_url` | `text` | No | — | — |
| `weight_kg` | `numeric` | No | — | — |
| `allergies` | `boolean` | Sí | — | `false` |
| `bites` | `boolean` | Sí | — | `false` |
| `client_notes` | `text` | No | — | — |
| `birth_date` | `date` | No | — | — |
| `death_date` | `date` | No | — | — |
| `active` | `boolean` | Sí | — | `true` |
| `deleted_at` | `timestamptz` | No | — | — |
| `created_at` | `timestamptz` | Sí | — | `now()` |
| `updated_at` | `timestamptz` | Sí | — | `now()` |

### `pet_vaccinations` — Vacunas de mascota

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `pet_id` | `uuid` | Sí | FK | — |
| `vaccine` | `text` | Sí | — | — |
| `applied_on` | `date` | Sí | — | — |
| `valid_until` | `date` | No | — | — |
| `document_url` | `text` | No | — | — |
| `created_at` | `timestamptz` | Sí | — | `now()` |

### `client_internal` — Notas privadas de cliente

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `client_id` | `uuid` | Sí | PK, FK | — |
| `notes` | `text` | No | — | — |
| `updated_by` | `uuid` | No | FK | — |
| `updated_at` | `timestamptz` | Sí | — | `now()` |

### `pet_internal` — Notas privadas de mascota

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `pet_id` | `uuid` | Sí | PK, FK | — |
| `notes` | `text` | No | — | — |
| `updated_by` | `uuid` | No | FK | — |
| `updated_at` | `timestamptz` | Sí | — | `now()` |

### `appointment_internal` — Notas privadas de cita

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `appointment_id` | `uuid` | Sí | PK, FK | — |
| `notes` | `text` | No | — | — |
| `updated_by` | `uuid` | Sí | FK | — |
| `updated_at` | `timestamptz` | Sí | — | `clock_timestamp()` |

### `services` — Catálogo de servicios

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `name` | `text` | Sí | — | — |
| `description` | `text` | No | — | — |
| `base_price` | `numeric` | Sí | — | — |
| `base_duration_minutes` | `integer` | Sí | — | — |
| `requires_specialist` | `boolean` | Sí | — | `false` |
| `visible_to_clients` | `boolean` | Sí | — | `true` |
| `active` | `boolean` | Sí | — | `true` |
| `created_at` | `timestamptz` | Sí | — | `now()` |
| `updated_at` | `timestamptz` | Sí | — | `now()` |

### `service_prices` — Tarifas por tamaño y pelaje

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `service_id` | `uuid` | Sí | FK | — |
| `pet_size` | `pet_size` | No | — | — |
| `pet_coat_type` | `pet_coat_type` | No | — | — |
| `price` | `numeric` | Sí | — | — |
| `duration_minutes` | `integer` | Sí | — | — |

### `appointments` — Cabecera de cita

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `client_id` | `uuid` | Sí | FK | — |
| `starts_at` | `timestamptz` | Sí | — | — |
| `ends_at` | `timestamptz` | Sí | — | — |
| `requires_pickup` | `boolean` | Sí | — | `false` |
| `pickup_address` | `text` | No | — | — |
| `pickup_fee` | `numeric` | Sí | — | `0` |
| `status` | `appointment_status` | Sí | — | `'CONFIRMED'` |
| `source` | `appointment_source` | Sí | — | `'INTERNAL'` |
| `hold_expires_at` | `timestamptz` | No | — | — |
| `total_price` | `numeric` | Sí | — | — |
| `deposit_required` | `numeric` | Sí | — | `0` |
| `client_notes` | `text` | No | — | — |
| `cancelled_at` | `timestamptz` | No | — | — |
| `cancelled_by` | `uuid` | No | FK | — |
| `cancel_reason` | `text` | No | — | — |
| `created_by` | `uuid` | Sí | FK | — |
| `created_at` | `timestamptz` | Sí | — | `now()` |
| `updated_at` | `timestamptz` | Sí | — | `clock_timestamp()` |
| `version` | `integer` | Sí | — | `1` |

### `appointment_items` — Servicio para una mascota

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `appointment_id` | `uuid` | Sí | FK | — |
| `pet_id` | `uuid` | Sí | FK | — |
| `client_id` | `uuid` | Sí | FK | — |
| `service_id` | `uuid` | Sí | FK | — |
| `price` | `numeric` | Sí | — | — |
| `duration_minutes` | `integer` | Sí | — | — |
| `requires_specialist_snapshot` | `boolean` | Sí | — | — |
| `weight_kg_at_visit` | `numeric` | No | — | — |
| `notes` | `text` | No | — | — |
| `created_at` | `timestamptz` | Sí | — | `now()` |

### `appointment_item_staff` — Etapa asignada a trabajador

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `item_id` | `uuid` | Sí | FK | — |
| `employee_id` | `uuid` | Sí | FK | — |
| `stage` | `text` | Sí | — | — |
| `starts_at` | `timestamptz` | Sí | — | — |
| `ends_at` | `timestamptz` | Sí | — | — |

### `payments` — Cobros de cita

**Estado:** con migración local.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | `gen_random_uuid()` |
| `appointment_id` | `uuid` | Sí | FK | — |
| `type` | `public.payment_type` | Sí | — | — |
| `method` | `public.payment_method` | Sí | — | — |
| `status` | `public.payment_status` | Sí | — | `'PENDING'` |
| `amount` | `numeric` | Sí | — | — |
| `operation_code` | `text` | No | — | — |
| `proof_url` | `text` | No | — | — |
| `external_ref` | `text` | No | — | — |
| `verified_by` | `uuid` | No | FK | — |
| `paid_at` | `timestamptz` | No | — | — |
| `created_at` | `timestamptz` | Sí | — | `clock_timestamp()` |
| `created_by` | `uuid` | Sí | FK | — |
| `updated_at` | `timestamptz` | Sí | — | `clock_timestamp()` |
| `version` | `integer` | Sí | — | `1` |
| `rejection_reason` | `text` | No | — | — |
| `request_id` | `uuid` | Sí | UK | — |

### `billing_documents` — Documento de facturación previsto

**Estado:** solo modelo de referencia.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | — |
| `appointment_id` | `uuid` | No | FK | — |
| `type` | `billing_doc_type` | No | — | — |
| `series` | `text` | No | — | — |
| `number` | `text` | No | — | — |
| `status` | `billing_doc_status` | No | — | — |
| `currency` | `text` | No | — | `'PEN'` |
| `operation_type` | `text` | No | — | — |
| `customer_snapshot` | `jsonb` | No | — | — |
| `subtotal` | `numeric` | No | — | — |
| `tax_amount` | `numeric` | No | — | — |
| `total` | `numeric` | No | — | — |
| `provider_ref` | `text` | No | — | — |
| `provider_response` | `jsonb` | No | — | — |
| `pdf_url` | `text` | No | — | — |
| `issued_at` | `timestamptz` | No | — | — |

### `billing_document_items` — Detalle de documento previsto

**Estado:** solo modelo de referencia.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | — |
| `document_id` | `uuid` | No | FK | — |
| `description` | `text` | No | — | — |
| `unit` | `text` | No | — | — |
| `quantity` | `numeric` | No | — | — |
| `unit_price` | `numeric` | No | — | — |
| `tax_affectation` | `text` | No | — | — |
| `line_total` | `numeric` | No | — | — |

### `notifications` — Notificaciones previstas

**Estado:** solo modelo de referencia.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | — |
| `client_id` | `uuid` | No | FK | — |
| `appointment_id` | `uuid` | No | FK | — |
| `channel` | `notification_channel` | No | — | — |
| `template` | `text` | No | — | — |
| `status` | `notification_status` | No | — | — |
| `scheduled_for` | `timestamptz` | No | — | — |
| `sent_at` | `timestamptz` | No | — | — |
| `provider_message_id` | `text` | No | — | — |
| `error` | `text` | No | — | — |

### `audit_log` — Auditoría prevista

**Estado:** solo modelo de referencia.

| Columna | Tipo | Obligatorio | Clave | Default en SQL raíz |
|---|---|---|---|---|
| `id` | `uuid` | Sí | PK | — |
| `actor_id` | `uuid` | No | FK | — |
| `entity` | `text` | No | — | — |
| `entity_id` | `uuid` | No | — | — |
| `action` | `text` | No | — | — |
| `before` | `jsonb` | No | — | — |
| `after` | `jsonb` | No | — | — |
| `created_at` | `timestamptz` | No | — | — |

## Restricciones y relaciones que requieren lectura conjunta

- `profiles.id` referencia `auth.users.id`, administrada por Supabase Auth; esa tabla externa no aparece en el SQL raíz.
- `role_permissions` y `user_roles` tienen claves primarias compuestas; cada componente también es FK.
- `appointment_items(appointment_id, client_id)` referencia `appointments(id, client_id)` y `(pet_id, client_id)` referencia `pets(id, client_id)`: esto impide mezclar mascota y cita de clientes distintos.
- `service_prices` tiene unicidad por servicio, tamaño y pelaje con `NULLS NOT DISTINCT`; tamaño/pelaje nulos representan comodines.
- `employee_schedules` y `business_hours` restringen día de semana a 1–6, intervalos positivos y unicidad de hora inicial por día.
- `time_blocks.employee_id` nulo expresa bloqueo global; los rangos de bloqueo y cita requieren fin posterior al inicio.
- `appointment_item_staff.stage` acepta SERVICE, BATH o CUT; el intervalo de etapa mide minutos enteros.
- `appointments.status`, `payments.status` y otros estados se rigen además por validaciones/RPC. La presencia de ONLINE y `hold_expires_at` no acredita autorreserva operativa.
- `payments.request_id` es único para idempotencia; el importe es positivo y de dos decimales como máximo. La verificación autorizada se controla en RPC.
- Las cinco tablas sin migración requieren un plan aprobado antes de tratarlas como tablas operativas.

Para relaciones y alcance de implementación, ver los [ERD](actividad-1-modelo-datos.md). Para permisos/RLS, ver [migraciones](../supabase/migrations/20261017152256_identity_foundation.sql) y [validación de seguridad](features/fase-0-fundamentos-seguridad/validation.md).
