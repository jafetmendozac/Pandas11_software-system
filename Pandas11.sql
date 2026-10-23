-- Inventario: supabase/migrations/20261022140000_inventory_movements.sql
-- y revalidación de permisos: supabase/migrations/20261022143000_inventory_permission_recheck.sql
-- Ventas: modelo, politicas y RPC en supabase/migrations/20261021090000_sales_foundation.sql
-- y catalogo paginado en supabase/migrations/20261021093000_sales_product_queries.sql;
-- restriccion OWNER/ADMIN en supabase/migrations/20261021100000_sales_role_guard.sql.
-- Pagos: políticas y RPC en supabase/migrations/20261018225928_payments_advances.sql.
-- Agenda interna: seguridad, etapas y reservas en supabase/migrations/20261017220427_internal_appointments.sql.
-- Servicios/precios: seguridad y cálculo en supabase/migrations/20261017210343_services_prices.sql.
-- Clientes/mascotas: políticas y RPC versionados en
-- supabase/migrations/20261017201505_clients_pets.sql.
-- Identidad: políticas, funciones y catálogo versionados en
-- supabase/migrations/20261017152256_identity_foundation.sql.
-- Este archivo describe el modelo completo; no ejecutarlo como migración automática.

-- ---------- ENUMS ----------

CREATE TYPE "pet_sex" AS ENUM (
  'MALE',
  'FEMALE',
  'UNKNOWN'
);

CREATE TYPE "pet_size" AS ENUM (
  'TOY',
  'SMALL',
  'MEDIUM',
  'LARGE',
  'EXTRA_LARGE'
);

CREATE TYPE "pet_coat_type" AS ENUM (
  'SHORT',
  'MEDIUM',
  'LONG',
  'WIRE',
  'CURLY',
  'HAIRLESS'
);

CREATE TYPE "skill_level" AS ENUM (
  'ALL_SERVICES',
  'ASSISTANT'
);

CREATE TYPE "appointment_status" AS ENUM (
  'REQUESTED',
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
);

CREATE TYPE "appointment_source" AS ENUM (
  'INTERNAL',
  'ONLINE'
);

CREATE TYPE "payment_type" AS ENUM (
  'DEPOSIT',
  'BALANCE',
  'REFUND'
);

CREATE TYPE "payment_method" AS ENUM (
  'YAPE',
  'PLIN',
  'CASH',
  'CARD',
  'TRANSFER'
);

CREATE TYPE "payment_status" AS ENUM (
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE "sale_status" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

CREATE TYPE "sale_item_kind" AS ENUM ('SERVICE', 'PRODUCT');

CREATE TYPE "notification_channel" AS ENUM (
  'WHATSAPP',
  'SMS',
  'EMAIL'
);

CREATE TYPE "notification_status" AS ENUM (
  'SCHEDULED',
  'SENT',
  'DELIVERED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "tax_doc_type" AS ENUM (
  'DNI',
  'RUC',
  'CE',
  'PASSPORT'
);

CREATE TYPE "billing_doc_type" AS ENUM (
  'BOLETA',
  'FACTURA'
);

CREATE TYPE "billing_doc_status" AS ENUM (
  'DRAFT',
  'ISSUED',
  'VOIDED'
);

-- ---------- TABLAS ----------

-- CREATE TABLE "profiles" (
--   "id" uuid PRIMARY KEY,
--   "first_name" text,
--   "last_name" text,
--   "active" boolean DEFAULT true,
--   "created_at" timestamptz,
--   "updated_at" timestamptz
-- );
CREATE TABLE "profiles" (
    id uuid PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    first_name text,
    last_name text,

    active boolean NOT NULL DEFAULT true,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- CREATE TABLE "roles" (
--   "id" uuid PRIMARY KEY,
--   "name" text UNIQUE,
--   "description" text
-- );
CREATE TABLE "roles" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  code text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE,
  description text,

  is_system boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CREATE TABLE "permissions" (
--   "id" uuid PRIMARY KEY,
--   "code" text UNIQUE,
--   "description" text
-- );
CREATE TABLE "permissions" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  code text NOT NULL UNIQUE,
  description text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- CREATE TABLE "role_permissions" (
--   "role_id" uuid,
--   "permission_id" uuid,
--   PRIMARY KEY ("role_id", "permission_id")
-- );

-- CREATE TABLE "user_roles" (
--   "user_id" uuid,
--   "role_id" uuid,
--   PRIMARY KEY ("user_id", "role_id")
-- );

CREATE TABLE "role_permissions" (
  "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permission_id" uuid NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  PRIMARY KEY ("role_id", "permission_id")
);

CREATE TABLE "user_roles" (
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  PRIMARY KEY ("user_id", "role_id")
);

CREATE TABLE "employees" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" uuid NOT NULL UNIQUE,
  "phone" text,
  "skill_level" skill_level NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "employee_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "employee_id" uuid NOT NULL,
  "weekday" smallint NOT NULL,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  CONSTRAINT "chk_emp_sched_weekday" CHECK (weekday BETWEEN 1 AND 6),
  CONSTRAINT "chk_emp_sched_range" CHECK (end_time > start_time AND end_time < time '24:00')
);

CREATE TABLE "business_hours" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "weekday" smallint NOT NULL,
  "open_time" time NOT NULL,
  "close_time" time NOT NULL,
  CONSTRAINT "chk_bh_weekday" CHECK (weekday BETWEEN 1 AND 6),
  CONSTRAINT "chk_bh_range" CHECK (close_time > open_time AND close_time < time '24:00')
);

CREATE TABLE "time_blocks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "employee_id" uuid,
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  "reason" text NOT NULL CHECK (length(btrim(reason)) > 0),
  "created_by" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "chk_time_blocks_range" CHECK (isfinite(starts_at) AND isfinite(ends_at) AND ends_at > starts_at)
);

CREATE TABLE "business_settings" (
  "key" text PRIMARY KEY,
  "value" text,
  "updated_at" timestamptz
);

CREATE TABLE "clients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" uuid UNIQUE,
  "first_name" text NOT NULL CHECK (length(btrim(first_name)) > 0),
  "last_name" text,
  "phone" text,
  "whatsapp" text,
  "email" text,
  "address" text,
  "tax_doc_type" tax_doc_type,
  "tax_doc_number" text,
  "business_name" text,
  "whatsapp_opt_in" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "pets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL,
  "name" text NOT NULL CHECK (length(btrim(name)) > 0),
  "breed" text,
  "pet_sex" pet_sex,
  "pet_size" pet_size,
  "pet_coat_type" pet_coat_type,
  "photo_url" text,
  "weight_kg" numeric CHECK (weight_kg > 0),
  "allergies" boolean NOT NULL DEFAULT false,
  "bites" boolean NOT NULL DEFAULT false,
  "client_notes" text,
  "birth_date" date,
  "death_date" date,
  "active" boolean NOT NULL DEFAULT true,
  "deleted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_pet_life CHECK (death_date IS NULL OR birth_date IS NULL OR death_date >= birth_date)
);

CREATE TABLE "pet_vaccinations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pet_id" uuid NOT NULL,
  "vaccine" text NOT NULL CHECK (length(btrim(vaccine)) > 0),
  "applied_on" date NOT NULL,
  "valid_until" date,
  "document_url" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_vaccination_dates CHECK (valid_until IS NULL OR valid_until >= applied_on)
);

CREATE TABLE "client_internal" (
  "client_id" uuid PRIMARY KEY,
  "notes" text,
  "updated_by" uuid,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "pet_internal" (
  "pet_id" uuid PRIMARY KEY,
  "notes" text,
  "updated_by" uuid,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "appointment_internal" (
  "appointment_id" uuid PRIMARY KEY,
  "notes" text,
  "updated_by" uuid NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE "services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL CHECK (length(btrim(name)) > 0),
  "description" text,
  "base_price" numeric NOT NULL CHECK (base_price >= 0 AND base_price < 'Infinity'::numeric AND base_price = round(base_price,2)),
  "base_duration_minutes" integer NOT NULL CHECK (base_duration_minutes > 0),
  "requires_specialist" boolean NOT NULL DEFAULT false,
  "visible_to_clients" boolean NOT NULL DEFAULT true,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "service_prices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "service_id" uuid NOT NULL,
  "pet_size" pet_size,
  "pet_coat_type" pet_coat_type,
  "price" numeric NOT NULL,
  "duration_minutes" integer NOT NULL,
  CONSTRAINT "chk_sp_price" CHECK (price >= 0 AND price < 'Infinity'::numeric AND price = round(price,2)),
  CONSTRAINT "chk_sp_duration" CHECK (duration_minutes > 0)
);

CREATE TABLE "appointments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL,
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  "requires_pickup" boolean NOT NULL DEFAULT false,
  "pickup_address" text,
  "pickup_fee" numeric NOT NULL DEFAULT 0 CHECK (pickup_fee >= 0 AND pickup_fee < 'Infinity'::numeric AND pickup_fee = round(pickup_fee,2)),
  "status" appointment_status NOT NULL DEFAULT 'CONFIRMED',
  "source" appointment_source NOT NULL DEFAULT 'INTERNAL',
  "hold_expires_at" timestamptz,
  "total_price" numeric NOT NULL CHECK (total_price >= 0 AND total_price < 'Infinity'::numeric AND total_price = round(total_price,2)),
  "deposit_required" numeric NOT NULL DEFAULT 0 CHECK (deposit_required >= 0 AND deposit_required < 'Infinity'::numeric AND deposit_required = round(deposit_required,2)),
  "client_notes" text,
  "cancelled_at" timestamptz,
  "cancelled_by" uuid,
  "cancel_reason" text,
  "created_by" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "version" integer NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT "chk_appt_range" CHECK (isfinite(starts_at) AND isfinite(ends_at) AND ends_at > starts_at),
  CONSTRAINT "chk_appt_cancel" CHECK ((status = 'CANCELLED' AND cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL AND coalesce(length(btrim(cancel_reason)),0) > 0) OR (status <> 'CANCELLED' AND cancelled_at IS NULL AND cancelled_by IS NULL AND cancel_reason IS NULL))
);

CREATE TABLE "appointment_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "appointment_id" uuid NOT NULL,
  "pet_id" uuid NOT NULL,
  "client_id" uuid NOT NULL,
  "service_id" uuid NOT NULL,
  "price" numeric NOT NULL,
  "duration_minutes" integer NOT NULL,
  "requires_specialist_snapshot" boolean NOT NULL,
  "weight_kg_at_visit" numeric CHECK (weight_kg_at_visit > 0 AND weight_kg_at_visit < 'Infinity'::numeric),
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "chk_item_price" CHECK (price >= 0 AND price < 'Infinity'::numeric AND price = round(price,2)),
  CONSTRAINT "chk_item_duration" CHECK (duration_minutes > 0),
  UNIQUE (appointment_id,pet_id,service_id)
);

CREATE TABLE "appointment_item_staff" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "item_id" uuid NOT NULL,
  "employee_id" uuid NOT NULL,
  "stage" text NOT NULL CHECK (stage IN ('SERVICE','BATH','CUT')),
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  CHECK (isfinite(starts_at) AND isfinite(ends_at) AND ends_at > starts_at),
  CONSTRAINT "chk_staff_minutes" CHECK (extract(epoch from (ends_at-starts_at)) >= 60 AND mod(extract(epoch from (ends_at-starts_at)),60)=0),
  UNIQUE (item_id,stage)
);

CREATE TABLE "payments" (
 id uuid primary key default gen_random_uuid(),
 appointment_id uuid not null references public.appointments(id),
 type public.payment_type not null,
 method public.payment_method not null,
 status public.payment_status not null default 'PENDING',
 amount numeric not null,
 operation_code text check (operation_code is null or (length(operation_code)<=120 and length(btrim(operation_code))>0)),
 proof_url text check (proof_url is null),
 external_ref text check (external_ref is null or (length(external_ref)<=120 and length(btrim(external_ref))>0)),
 verified_by uuid references public.profiles(id),
 paid_at timestamptz,
 created_at timestamptz not null default clock_timestamp(),
 created_by uuid not null references public.profiles(id),
 updated_at timestamptz not null default clock_timestamp(),
 version integer not null default 1 check(version>0),
 rejection_reason text check(rejection_reason is null or (length(btrim(rejection_reason))>0 and length(rejection_reason)<=500)),
 request_id uuid not null unique,
 constraint chk_payment_amount check(amount>0 and amount<'Infinity'::numeric and amount=round(amount,2)),
 constraint chk_payment_verification check (
  (status='PAID' and verified_by is not null and paid_at is not null and isfinite(paid_at) and rejection_reason is null)
  or (status='PENDING' and verified_by is null and paid_at is null and rejection_reason is null)
  or (status='FAILED' and verified_by is null and paid_at is null and rejection_reason is not null)
  or status='REFUNDED')
);

CREATE TABLE "products" (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(btrim(name)) between 1 and 120),
 sku text unique check (sku is null or length(btrim(sku)) between 1 and 60),
 unit text not null default 'UNIT' check (unit='UNIT'),
 price numeric not null check (price>=0 and price<'Infinity'::numeric and price=round(price,2)),
 active boolean not null default true,
 minimum_stock integer check(minimum_stock>=0),
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp()
);

CREATE TABLE "sales" (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id),
 appointment_id uuid references public.appointments(id),
 status sale_status not null default 'DRAFT',
 currency text not null default 'PEN' check (currency='PEN'),
 total numeric not null default 0 check (total>=0 and total<'Infinity'::numeric and total=round(total,2)),
 request_id uuid not null unique,
 request_payload jsonb not null,
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 version integer not null default 1 check (version>0),
 cancelled_by uuid references public.profiles(id),
 cancelled_at timestamptz,
 cancel_reason text,
 inventory_disposition text check(inventory_disposition in ('RESTOCK','NO_RESTOCK')),
 constraint sale_inventory_disposition check(inventory_disposition is null or status='CANCELLED'),
 constraint chk_sale_cancel check (
  (status='CANCELLED' and cancelled_by is not null and cancelled_at is not null and length(btrim(cancel_reason)) between 1 and 500)
  or (status<>'CANCELLED' and cancelled_by is null and cancelled_at is null and cancel_reason is null))
);
CREATE UNIQUE INDEX sales_one_active_appointment ON "sales"(appointment_id)
 WHERE appointment_id IS NOT NULL AND status<>'CANCELLED';
CREATE INDEX sales_created_page ON "sales"(created_at DESC,id DESC);
CREATE INDEX sales_client ON "sales"(client_id);

CREATE TABLE "sale_items" (
 id uuid primary key default gen_random_uuid(),
 sale_id uuid not null references public.sales(id),
 kind sale_item_kind not null,
 appointment_item_id uuid references public.appointment_items(id),
 service_id uuid references public.services(id),
 product_id uuid references public.products(id),
 description text not null check (length(btrim(description)) between 1 and 200),
 unit text not null check (unit='UNIT'),
 quantity integer not null check (quantity between 1 and 1000000),
 unit_price numeric not null check (unit_price>=0 and unit_price<'Infinity'::numeric and unit_price=round(unit_price,2)),
 line_total numeric generated always as (quantity*unit_price) stored,
 created_at timestamptz not null default clock_timestamp(),
 constraint chk_sale_item_source check (
  (kind='SERVICE' and appointment_item_id is not null and service_id is not null and product_id is null and quantity=1)
  or (kind='PRODUCT' and appointment_item_id is null and service_id is null and product_id is not null))
);
CREATE UNIQUE INDEX sale_service_once ON "sale_items"(sale_id,appointment_item_id) WHERE appointment_item_id IS NOT NULL;
CREATE UNIQUE INDEX sale_product_once ON "sale_items"(sale_id,product_id) WHERE product_id IS NOT NULL;
CREATE INDEX sale_items_sale ON "sale_items"(sale_id);

create table public.inventory_balances (
 product_id uuid primary key references public.products(id) on delete cascade,
 quantity integer not null default 0 check(quantity>=0),
 initial_loaded boolean not null default false,
 version integer not null default 1 check(version>0)
);
create table public.inventory_movements (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id),
 kind text not null check(kind in ('INITIAL','RECEIPT','ADJUSTMENT','SALE','CANCELLATION')),
 delta integer not null check(delta<>0),
 balance_before integer not null check(balance_before>=0),
 balance_after integer not null check(balance_after>=0),
 reason text not null check(length(btrim(reason)) between 1 and 500),
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default clock_timestamp(),
 sale_id uuid references public.sales(id),
 sale_item_id uuid references public.sale_items(id),
 request_id uuid unique,
 request_payload jsonb,
 constraint inventory_arithmetic check(balance_after::bigint=balance_before::bigint+delta),
 constraint inventory_source check(
  (kind in ('SALE','CANCELLATION') and sale_id is not null and sale_item_id is not null and request_id is null and request_payload is null)
  or (kind in ('INITIAL','RECEIPT','ADJUSTMENT') and sale_id is null and sale_item_id is null and request_id is not null and request_payload is not null)),
 constraint inventory_sign check(kind='ADJUSTMENT' or (kind='SALE' and delta<0) or (kind<>'SALE' and delta>0))
);
create unique index inventory_sale_once on public.inventory_movements(sale_item_id,kind) where sale_item_id is not null;
create index inventory_history on public.inventory_movements(product_id,created_at desc,id desc);
create index inventory_sale on public.inventory_movements(sale_id);

-- Cobros comerciales, caja y mínimos: estructura local de referencia.
-- RPC, grants, RLS y disparadores están en las migraciones 20261022160000,
-- 20261022163000, 20261022164000, 20261022165000, 20261022166000 y 20261022167000; no ejecutar este archivo raíz.
create table public.sale_payments (
 id uuid primary key default gen_random_uuid(),
 sale_id uuid not null references public.sales(id),
 method public.payment_method not null,
 status public.payment_status not null default 'PENDING',
 amount numeric not null check(amount>0 and amount<'Infinity'::numeric and amount=round(amount,2)),
 operation_code text check(operation_code is null or length(btrim(operation_code)) between 1 and 120),
 external_ref text check(external_ref is null or length(btrim(external_ref)) between 1 and 120),
 verified_by uuid references public.profiles(id),
 paid_at timestamptz,
 created_at timestamptz not null default clock_timestamp(),
 created_by uuid not null references public.profiles(id),
 version integer not null default 1 check(version>0),
 rejection_reason text check(rejection_reason is null or length(btrim(rejection_reason)) between 1 and 500),
 request_id uuid not null unique,
 constraint sale_payment_state check (
  (status='PAID' and verified_by is not null and paid_at is not null and rejection_reason is null)
  or (status='PENDING' and verified_by is null and paid_at is null and rejection_reason is null)
  or (status='FAILED' and verified_by is null and paid_at is null and rejection_reason is not null))
);
create index sale_payments_sale on public.sale_payments(sale_id,created_at desc,id desc);
create table public.cash_sessions (
 id uuid primary key default gen_random_uuid(),
 status text not null default 'OPEN' check(status in ('OPEN','CLOSED')),
 opening_cash numeric not null check(opening_cash>=0 and opening_cash<'Infinity'::numeric and opening_cash=round(opening_cash,2)),
 opened_at timestamptz not null default clock_timestamp(),
 opened_by uuid not null references public.profiles(id),
 request_id uuid not null unique,
 closed_at timestamptz,
 closed_by uuid references public.profiles(id),
 counted_cash numeric check(counted_cash>=0 and counted_cash<'Infinity'::numeric and counted_cash=round(counted_cash,2)),
 expected_cash numeric check(expected_cash>=0 and expected_cash<'Infinity'::numeric and expected_cash=round(expected_cash,2)),
 difference numeric,
 version integer not null default 1 check(version>0),
 constraint cash_session_state check(
  (status='OPEN' and closed_at is null and closed_by is null and counted_cash is null and expected_cash is null and difference is null)
  or (status='CLOSED' and closed_at is not null and closed_by is not null and counted_cash is not null and expected_cash is not null and difference=counted_cash-expected_cash))
);
create unique index cash_one_open on public.cash_sessions(status) where status='OPEN';
create table public.cash_movements (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.cash_sessions(id),
 source text not null check(source in ('APPOINTMENT_PAYMENT','SALE_PAYMENT','MANUAL_IN','MANUAL_OUT')),
 method public.payment_method not null,
 amount numeric not null check(amount<>0 and amount<'Infinity'::numeric and amount>'-Infinity'::numeric and amount=round(amount,2)),
 appointment_payment_id uuid unique references public.payments(id),
 sale_payment_id uuid unique references public.sale_payments(id),
 request_id uuid unique,
 request_payload jsonb,
 reason text not null check(length(btrim(reason)) between 1 and 500),
 created_at timestamptz not null default clock_timestamp(),
 created_by uuid not null references public.profiles(id),
 constraint cash_movement_source check(
  (source='APPOINTMENT_PAYMENT' and appointment_payment_id is not null and sale_payment_id is null and request_id is null and request_payload is null and amount>0)
  or (source='SALE_PAYMENT' and sale_payment_id is not null and appointment_payment_id is null and request_id is null and request_payload is null and amount>0)
  or (source='MANUAL_IN' and method='CASH' and amount>0 and appointment_payment_id is null and sale_payment_id is null and request_id is not null and request_payload is not null)
  or (source='MANUAL_OUT' and method='CASH' and amount<0 and appointment_payment_id is null and sale_payment_id is null and request_id is not null and request_payload is not null))
);
create index cash_movements_session on public.cash_movements(session_id,created_at desc,id desc);

CREATE TABLE "billing_documents" (
  "id" uuid PRIMARY KEY,
  "appointment_id" uuid,
  "type" billing_doc_type,
  "series" text,
  "number" text,
  "status" billing_doc_status,
  "currency" text DEFAULT 'PEN',
  "operation_type" text,
  "customer_snapshot" jsonb,
  "subtotal" numeric,
  "tax_amount" numeric,
  "total" numeric,
  "provider_ref" text,
  "provider_response" jsonb,
  "pdf_url" text,
  "issued_at" timestamptz
);

CREATE TABLE "billing_document_items" (
  "id" uuid PRIMARY KEY,
  "document_id" uuid,
  "description" text,
  "unit" text,
  "quantity" numeric,
  "unit_price" numeric,
  "tax_affectation" text,
  "line_total" numeric
);

CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY,
  "client_id" uuid,
  "appointment_id" uuid,
  "channel" notification_channel,
  "template" text,
  "status" notification_status,
  "scheduled_for" timestamptz,
  "sent_at" timestamptz,
  "provider_message_id" text,
  "error" text
);

CREATE TABLE "audit_log" (
  "id" uuid PRIMARY KEY,
  "actor_id" uuid,
  "entity" text,
  "entity_id" uuid,
  "action" text,
  "before" jsonb,
  "after" jsonb,
  "created_at" timestamptz
);

-- ---------- ÍNDICES Y RESTRICCIONES DE UNICIDAD ----------

CREATE UNIQUE INDEX ON "employee_schedules" ("employee_id", "weekday", "start_time");

CREATE UNIQUE INDEX ON "business_hours" ("weekday", "open_time");

CREATE INDEX ON "time_blocks" ("employee_id", "starts_at", "ends_at");

CREATE INDEX ON "time_blocks" ("starts_at", "ends_at");

CREATE INDEX ON "clients" ("whatsapp");

CREATE INDEX ON "clients" ("tax_doc_type", "tax_doc_number");

CREATE INDEX ON "pets" ("client_id");

CREATE UNIQUE INDEX ON "pets" ("id", "client_id");

CREATE INDEX ON "pet_vaccinations" ("pet_id");

-- SOLUCIÓN AL ERROR EN POSTGRESQL 15+:
CREATE UNIQUE INDEX "uq_service_prices_rule" 
ON "service_prices" ("service_id", "pet_size", "pet_coat_type") 
NULLS NOT DISTINCT;

CREATE INDEX ON "appointments" ("starts_at", "ends_at");

CREATE INDEX ON "appointments" ("client_id");

CREATE INDEX ON "appointments" ("status", "starts_at");

CREATE INDEX ON "appointments" ("status", "hold_expires_at");

CREATE UNIQUE INDEX ON "appointments" ("id", "client_id");

CREATE INDEX ON "appointment_items" ("appointment_id");

CREATE INDEX ON "appointment_items" ("pet_id");

CREATE INDEX ON "appointment_items" ("service_id");

CREATE INDEX ON "appointment_item_staff" ("employee_id", "starts_at", "ends_at");

CREATE INDEX ON "appointment_item_staff" ("item_id");

CREATE INDEX ON "payments" ("appointment_id");

CREATE INDEX ON "payments" ("status", "created_at");

CREATE INDEX ON "payments" ("operation_code");

CREATE INDEX ON "payments" ("created_at" DESC, "id" DESC);

CREATE INDEX ON "billing_documents" ("appointment_id");

CREATE UNIQUE INDEX ON "billing_documents" ("series", "number");

CREATE INDEX ON "billing_document_items" ("document_id");

CREATE INDEX ON "notifications" ("status", "scheduled_for");

CREATE INDEX ON "notifications" ("appointment_id");

CREATE INDEX ON "notifications" ("client_id");

CREATE INDEX ON "audit_log" ("entity", "entity_id");

CREATE INDEX ON "audit_log" ("actor_id", "created_at");

-- ---------- CLAVES FORÁNEAS ----------

ALTER TABLE "employees" ADD FOREIGN KEY ("profile_id") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "employee_schedules" ADD FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "time_blocks" ADD FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "time_blocks" ADD FOREIGN KEY ("created_by") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "clients" ADD FOREIGN KEY ("profile_id") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pets" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pet_vaccinations" ADD FOREIGN KEY ("pet_id") REFERENCES "pets" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "client_internal" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "client_internal" ADD FOREIGN KEY ("updated_by") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pet_internal" ADD FOREIGN KEY ("pet_id") REFERENCES "pets" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pet_internal" ADD FOREIGN KEY ("updated_by") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointment_internal" ADD FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointment_internal" ADD FOREIGN KEY ("updated_by") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "service_prices" ADD FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointments" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointments" ADD FOREIGN KEY ("cancelled_by") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointments" ADD FOREIGN KEY ("created_by") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointment_items" ADD FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointment_items" ADD FOREIGN KEY ("appointment_id", "client_id") REFERENCES "appointments" ("id", "client_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointment_items" ADD FOREIGN KEY ("pet_id", "client_id") REFERENCES "pets" ("id", "client_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointment_item_staff" ADD FOREIGN KEY ("item_id") REFERENCES "appointment_items" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointment_item_staff" ADD FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "billing_documents" ADD FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "billing_document_items" ADD FOREIGN KEY ("document_id") REFERENCES "billing_documents" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_log" ADD FOREIGN KEY ("actor_id") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;
