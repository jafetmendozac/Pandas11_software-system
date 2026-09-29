

// ============================================================
// Software de citas - Peluquería canina  (v3)
// Pegar en https://dbdiagram.io
// Fase 1 = interno | Fase 2 = preparación | Fase 3 = público
// Los bloques `checks` requieren una versión reciente de DBML;
// si tu editor los rechaza, pásalos a SQL como CHECK constraints.
// ============================================================

// ---------- ENUMS ----------

Enum pet_sex {
  MALE 
  FEMALE 
  UNKNOWN 
}

Enum pet_size { 
  SMALL 
  MEDIUM 
  LARGE 
  EXTRA_LARGE 
}

Enum pet_coat_type { 
  SHORT 
  MEDIUM
  LONG 
  WIRE 
  CURLY 
  HAIRLESS 
}

Enum skill_level {
  ALL_SERVICES   // groomer principal, puede hacer todo
  ASSISTANT      // solo servicios básicos (baño, etc.)
}

Enum appointment_status {
  REQUESTED      // pedida por el cliente, esperando adelanto/aprobación
  PENDING        // creada por el personal, sin confirmar
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

Enum appointment_source { 
  INTERNAL 
  ONLINE 
}

Enum payment_type { 
  DEPOSIT 
  BALANCE 
  REFUND 
}
Enum payment_method { 
  YAPE 
  PLIN 
  CASH 
  CARD 
  TRANSFER 
}
Enum payment_status { 
  PENDING 
  PAID 
  FAILED 
  REFUNDED 
}

Enum notification_channel {
  WHATSAPP
  SMS
  EMAIL
}

Enum notification_status {
  SCHEDULED
  SENT
  DELIVERED
  FAILED
  CANCELLED
}

Enum tax_doc_type {
  DNI
  RUC
  CE
  PASSPORT
}

Enum billing_doc_type {
  BOLETA
  FACTURA
}

Enum billing_doc_status {
  DRAFT
  ISSUED
  VOIDED
}

// ---------- IDENTIDAD Y PERMISOS ----------

// Una fila por cada usuario que inicia sesión (staff o cliente).
// id = id del usuario de autenticación.
// Fuente de verdad de contacto:
//   - clientes -> clients.phone / clients.whatsapp
//   - personal -> employees.phone
// (profiles NO guarda teléfono para evitar duplicación)
Table profiles {
  id uuid [pk]
  first_name text
  last_name text
  active boolean [default: true]
  created_at timestamptz
  updated_at timestamptz
}

Table roles {
  id uuid [pk]
  name text [unique]           // OWNER, ADMIN, RECEPTIONIST, GROOMER, CLIENT
  description text
}

Table permissions {
  id uuid [pk]
  code text [unique]           // 'appointments.create', 'appointments.cancel', 'payments.refund', 'reports.view'
  description text
}

Table role_permissions {
  role_id uuid [ref: > roles.id]
  permission_id uuid [ref: > permissions.id]
  indexes { (role_id, permission_id) [pk] }
}

Table user_roles {
  user_id uuid [ref: > profiles.id]
  role_id uuid [ref: > roles.id]
  indexes { (user_id, role_id) [pk] }
}

// ---------- PERSONAL ----------

Table employees {
  id uuid [pk]
  profile_id uuid [unique, ref: - profiles.id]
  phone text                   // contacto del personal
  skill_level skill_level
  active boolean [default: true]
  created_at timestamptz
  updated_at timestamptz
}

// Horario semanal recurrente. Permite turnos partidos
// (varias filas por día), por eso la unicidad incluye start_time.
Table employee_schedules {
  id uuid [pk]
  employee_id uuid [ref: > employees.id]
  weekday smallint             // 0 = domingo ... 6 = sábado
  start_time time
  end_time time

  indexes {
    (employee_id, weekday, start_time) [unique]
  }
  checks {
    `weekday BETWEEN 0 AND 6` [name: 'chk_emp_sched_weekday']
    `end_time > start_time` [name: 'chk_emp_sched_range']
  }
}

// Horario de atención de la tienda (también admite turnos partidos)
Table business_hours {
  id uuid [pk]
  weekday smallint
  open_time time
  close_time time

  indexes {
    (weekday, open_time) [unique]
  }
  checks {
    `weekday BETWEEN 0 AND 6` [name: 'chk_bh_weekday']
    `close_time > open_time` [name: 'chk_bh_range']
  }
}

// Bloqueos: vacaciones, feriados, cierres, descansos.
// employee_id NULL = afecta a toda la tienda.
Table time_blocks {
  id uuid [pk]
  employee_id uuid [ref: >? employees.id]
  starts_at timestamptz
  ends_at timestamptz
  reason text
  created_by uuid [ref: > profiles.id]

  indexes {
    (employee_id, starts_at, ends_at)
    (starts_at, ends_at)
  }
  checks {
    `ends_at > starts_at` [name: 'chk_time_blocks_range']
  }
}

// Parámetros configurables por el dueño
Table business_settings {
  key text [pk]                // 'deposit_percent', 'deposit_min_amount', 'cancel_hours_before',
                               // 'hold_minutes', 'slot_step_minutes'
  value text
  updated_at timestamptz
}

// ---------- CLIENTES Y MASCOTAS ----------

Table clients {
  id uuid [pk]
  profile_id uuid [unique, null, ref: - profiles.id] // NULL si lo creó recepción y aún no tiene cuenta
  first_name text
  last_name text
  phone text
  whatsapp text                // formato internacional, ej. +519XXXXXXXX
  email text
  address text
  tax_doc_type tax_doc_type    // para boleta/factura (opcional)
  tax_doc_number text
  business_name text           // razón social si pide factura
  whatsapp_opt_in boolean [default: false]
  deleted_at timestamptz
  created_at timestamptz
  updated_at timestamptz

  indexes {
    whatsapp
    (tax_doc_type, tax_doc_number)
  }
}

Table pets {
  id uuid [pk]
  client_id uuid [not null, ref: > clients.id]
  name text
  breed text
  pet_sex pet_sex
  pet_size pet_size
  pet_coat_type pet_coat_type
  weight_kg numeric
  allergies text
  bites boolean [default: false]   // dato de seguridad
  client_notes text            // visibles al cliente
  birth_date date
  death_date date
  active boolean [default: true]
  deleted_at timestamptz
  created_at timestamptz
  updated_at timestamptz

  indexes {
    client_id
    (id, client_id) [unique]   // habilita la FK compuesta desde appointment_items
  }
}

Table pet_vaccinations {
  id uuid [pk]
  pet_id uuid [ref: > pets.id]
  vaccine text
  applied_on date
  valid_until date
  document_url text
  created_at timestamptz

  indexes { pet_id }
}

// ---------- DATOS INTERNOS (solo personal) ----------
// RLS filtra filas, no columnas. Por eso lo que el cliente nunca debe ver
// vive en tablas aparte con una política única: "solo personal".
// Relación 1 a 1 con su tabla padre.

Table client_internal {
  client_id uuid [pk, ref: - clients.id]
  notes text
  updated_by uuid [ref: >? profiles.id]
  updated_at timestamptz
}

Table pet_internal {
  pet_id uuid [pk, ref: - pets.id]
  // bites boolean [default: false]   // dato de seguridad
  notes text
  updated_by uuid [ref: >? profiles.id]
  updated_at timestamptz
}

Table appointment_internal {
  appointment_id uuid [pk, ref: - appointments.id]
  notes text
  updated_by uuid [ref: >? profiles.id]
  updated_at timestamptz
}

// ---------- SERVICIOS Y PRECIOS ----------

Table services {
  id uuid [pk]
  name text
  description text
  base_price numeric
  base_duration_minutes integer
  requires_specialist boolean  // TRUE = solo skill_level ALL_SERVICES
  visible_to_clients boolean [default: true]
  active boolean [default: true]
  created_at timestamptz
  updated_at timestamptz
}

// Sobrescribe precio/duración según la mascota.
// NULL en pet_size / pet_coat_type = "aplica a todos".
// Prioridad al resolver (mayor a menor):
//   1) size + coat exactos
//   2) solo size
//   3) solo coat
//   4) fila sin size ni coat
//   5) services.base_price / base_duration_minutes
// La unicidad usa COALESCE porque en un UNIQUE normal
// los NULL cuentan como distintos y permitirían duplicados.
Table service_prices {
  id uuid [pk]
  service_id uuid [ref: > services.id]
  pet_size pet_size [null]
  pet_coat_type pet_coat_type [null]
  price numeric
  duration_minutes integer

  indexes {
    (service_id, `coalesce(pet_size::text, '*')`, `coalesce(pet_coat_type::text, '*')`) [unique, name: 'uq_service_prices_rule']
  }
  checks {
    `price >= 0` [name: 'chk_sp_price']
    `duration_minutes > 0` [name: 'chk_sp_duration']
  }
}

// ---------- CITAS ----------

// Una cita = una visita de un cliente (puede traer varias mascotas).
Table appointments {
  id uuid [pk]
  client_id uuid [not null, ref: > clients.id]
  starts_at timestamptz
  ends_at timestamptz
  status appointment_status
  source appointment_source
  hold_expires_at timestamptz  // si el adelanto no llega a tiempo, se libera el horario
  total_price numeric          // suma de items (snapshot)
  deposit_required numeric
  client_notes text            // visibles al cliente
  cancelled_at timestamptz
  cancelled_by uuid [ref: >? profiles.id]
  cancel_reason text
  created_by uuid [ref: >? profiles.id]
  created_at timestamptz
  updated_at timestamptz

  indexes {
    (starts_at, ends_at)
    (client_id)
    (status, starts_at)
    (status, hold_expires_at)  // job que libera reservas sin adelanto
    (id, client_id) [unique]   // habilita la FK compuesta desde appointment_items
  }
  checks {
    `ends_at > starts_at` [name: 'chk_appt_range']
  }
}

// Cada fila = un servicio para una mascota dentro de la cita.
// client_id se repite a propósito: con las dos FK compuestas de abajo,
// la BD garantiza que la mascota pertenece al mismo cliente de la cita.
Table appointment_items {
  id uuid [pk]
  appointment_id uuid [not null]
  pet_id uuid [not null]
  client_id uuid [not null]
  service_id uuid [ref: > services.id]
  price numeric                // snapshot
  duration_minutes integer     // snapshot
  weight_kg_at_visit numeric
  notes text
  created_at timestamptz

  indexes {
    appointment_id
    pet_id
    service_id
  }
  checks {
    `price >= 0` [name: 'chk_item_price']
    `duration_minutes > 0` [name: 'chk_item_duration']
  }
}

Ref: appointment_items.(appointment_id, client_id) > appointments.(id, client_id)
Ref: appointment_items.(pet_id, client_id) > pets.(id, client_id)

Table appointment_item_staff {
  item_id uuid [ref: > appointment_items.id]
  employee_id uuid [ref: > employees.id]
  indexes {
    (item_id, employee_id) [pk]
    employee_id
  }
}

// ---------- PAGOS ----------

Table payments {
  id uuid [pk]
  appointment_id uuid [ref: > appointments.id]
  type payment_type
  method payment_method
  status payment_status
  amount numeric
  operation_code text          // código de operación de Yape/Plin
  proof_url text
  external_ref text            // id en pasarela, si se integra una
  verified_by uuid [ref: >? profiles.id]
  paid_at timestamptz
  created_at timestamptz

  indexes {
    appointment_id
    (status, created_at)       // cola de "pagos por verificar"
    operation_code             // evita reutilizar el mismo voucher
  }
  checks {
    `amount > 0` [name: 'chk_payment_amount']
  }
}

// ---------- COMPROBANTES (Fase 3, si aplica) ----------
// Emitir vía un proveedor autorizado por SUNAT (PSE/OSE).
// Los campos exactos varían por proveedor: revisa su documentación
// antes de cerrar esta parte. Guardamos snapshot del cliente porque
// el comprobante no debe cambiar si luego se edita la ficha.
Table billing_documents {
  id uuid [pk]
  appointment_id uuid [ref: > appointments.id]
  type billing_doc_type
  series text
  number text
  status billing_doc_status
  currency text [default: 'PEN']
  operation_type text          // tipo de operación que exija el proveedor
  customer_snapshot jsonb      // tipo/nro de documento, nombre o razón social, dirección
  subtotal numeric
  tax_amount numeric
  total numeric
  provider_ref text
  provider_response jsonb      // respuesta/CDR del proveedor
  pdf_url text
  issued_at timestamptz

  indexes {
    appointment_id
    (series, number) [unique]
  }
}

Table billing_document_items {
  id uuid [pk]
  document_id uuid [ref: > billing_documents.id]
  description text
  unit text                    // unidad de medida (ej. ZZ = servicio)
  quantity numeric
  unit_price numeric
  tax_affectation text         // afectación IGV (gravado, exonerado, etc.)
  line_total numeric

  indexes { document_id }
}

// ---------- NOTIFICACIONES ----------

Table notifications {
  id uuid [pk]
  client_id uuid [ref: > clients.id]
  appointment_id uuid [ref: >? appointments.id]
  channel notification_channel
  template text                // 'reminder_24h', 'confirmation', 'deposit_pending'
  status notification_status
  scheduled_for timestamptz
  sent_at timestamptz
  provider_message_id text
  error text

  indexes {
    (status, scheduled_for)    // consulta del worker que envía
    appointment_id
    client_id
  }
}

// ---------- AUDITORÍA ----------

Table audit_log {
  id uuid [pk]
  actor_id uuid [ref: >? profiles.id]
  entity text
  entity_id uuid
  action text                  // 'CANCEL', 'REFUND', 'PRICE_CHANGE'
  before jsonb
  after jsonb
  created_at timestamptz

  indexes {
    (entity, entity_id)
    (actor_id, created_at)
  }
}