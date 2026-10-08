-- ---------- ENUMS ----------

CREATE TYPE "pet_sex" AS ENUM (
  'MALE',
  'FEMALE',
  'UNKNOWN'
);

CREATE TYPE "pet_size" AS ENUM (
  'TOY'
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

CREATE TABLE "role_permissions" (
  "role_id" uuid,
  "permission_id" uuid,
  PRIMARY KEY ("role_id", "permission_id")
);

CREATE TABLE "user_roles" (
  "user_id" uuid,
  "role_id" uuid,
  PRIMARY KEY ("user_id", "role_id")
);

CREATE TABLE "employees" (
  "id" uuid PRIMARY KEY,
  "profile_id" uuid UNIQUE,
  "phone" text,
  "skill_level" skill_level,
  "active" boolean DEFAULT true,
  "created_at" timestamptz,
  "updated_at" timestamptz
);

CREATE TABLE "employee_schedules" (
  "id" uuid PRIMARY KEY,
  "employee_id" uuid,
  "weekday" smallint,
  "start_time" time,
  "end_time" time,
  CONSTRAINT "chk_emp_sched_weekday" CHECK (weekday BETWEEN 0 AND 6),
  CONSTRAINT "chk_emp_sched_range" CHECK (end_time > start_time)
);

CREATE TABLE "business_hours" (
  "id" uuid PRIMARY KEY,
  "weekday" smallint,
  "open_time" time,
  "close_time" time,
  CONSTRAINT "chk_bh_weekday" CHECK (weekday BETWEEN 0 AND 6),
  CONSTRAINT "chk_bh_range" CHECK (close_time > open_time)
);

CREATE TABLE "time_blocks" (
  "id" uuid PRIMARY KEY,
  "employee_id" uuid,
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "reason" text,
  "created_by" uuid,
  CONSTRAINT "chk_time_blocks_range" CHECK (ends_at > starts_at)
);

CREATE TABLE "business_settings" (
  "key" text PRIMARY KEY,
  "value" text,
  "updated_at" timestamptz
);

CREATE TABLE "clients" (
  "id" uuid PRIMARY KEY,
  "profile_id" uuid UNIQUE,
  "first_name" text,
  "last_name" text,
  "phone" text,
  "whatsapp" text,
  "email" text,
  "address" text,
  "tax_doc_type" tax_doc_type,
  "tax_doc_number" text,
  "business_name" text,
  "whatsapp_opt_in" boolean DEFAULT false,
  "deleted_at" timestamptz,
  "created_at" timestamptz,
  "updated_at" timestamptz
);

CREATE TABLE "pets" (
  "id" uuid PRIMARY KEY,
  "client_id" uuid NOT NULL,
  "name" text,
  "breed" text,
  "pet_sex" pet_sex,
  "pet_size" pet_size,
  "pet_coat_type" pet_coat_type,
  "weight_kg" numeric,
  "allergies" text,
  "bites" boolean DEFAULT false,
  "client_notes" text,
  "birth_date" date,
  "death_date" date,
  "active" boolean DEFAULT true,
  "deleted_at" timestamptz,
  "created_at" timestamptz,
  "updated_at" timestamptz
);

CREATE TABLE "pet_vaccinations" (
  "id" uuid PRIMARY KEY,
  "pet_id" uuid,
  "vaccine" text,
  "applied_on" date,
  "valid_until" date,
  "document_url" text,
  "created_at" timestamptz
);

CREATE TABLE "client_internal" (
  "client_id" uuid PRIMARY KEY,
  "notes" text,
  "updated_by" uuid,
  "updated_at" timestamptz
);

CREATE TABLE "pet_internal" (
  "pet_id" uuid PRIMARY KEY,
  "notes" text,
  "updated_by" uuid,
  "updated_at" timestamptz
);

CREATE TABLE "appointment_internal" (
  "appointment_id" uuid PRIMARY KEY,
  "notes" text,
  "updated_by" uuid,
  "updated_at" timestamptz
);

CREATE TABLE "services" (
  "id" uuid PRIMARY KEY,
  "name" text,
  "description" text,
  "base_price" numeric,
  "base_duration_minutes" integer,
  "requires_specialist" boolean,
  "visible_to_clients" boolean DEFAULT true,
  "active" boolean DEFAULT true,
  "created_at" timestamptz,
  "updated_at" timestamptz
);

CREATE TABLE "service_prices" (
  "id" uuid PRIMARY KEY,
  "service_id" uuid,
  "pet_size" pet_size,
  "pet_coat_type" pet_coat_type,
  "price" numeric,
  "duration_minutes" integer,
  CONSTRAINT "chk_sp_price" CHECK (price >= 0),
  CONSTRAINT "chk_sp_duration" CHECK (duration_minutes > 0)
);

CREATE TABLE "appointments" (
  "id" uuid PRIMARY KEY,
  "client_id" uuid NOT NULL,
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "status" appointment_status,
  "source" appointment_source,
  "hold_expires_at" timestamptz,
  "total_price" numeric,
  "deposit_required" numeric,
  "client_notes" text,
  "cancelled_at" timestamptz,
  "cancelled_by" uuid,
  "cancel_reason" text,
  "created_by" uuid,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  CONSTRAINT "chk_appt_range" CHECK (ends_at > starts_at)
);

CREATE TABLE "appointment_items" (
  "id" uuid PRIMARY KEY,
  "appointment_id" uuid NOT NULL,
  "pet_id" uuid NOT NULL,
  "client_id" uuid NOT NULL,
  "service_id" uuid,
  "price" numeric,
  "duration_minutes" integer,
  "weight_kg_at_visit" numeric,
  "notes" text,
  "created_at" timestamptz,
  CONSTRAINT "chk_item_price" CHECK (price >= 0),
  CONSTRAINT "chk_item_duration" CHECK (duration_minutes > 0)
);

CREATE TABLE "appointment_item_staff" (
  "item_id" uuid,
  "employee_id" uuid,
  PRIMARY KEY ("item_id", "employee_id")
);

CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY,
  "appointment_id" uuid,
  "type" payment_type,
  "method" payment_method,
  "status" payment_status,
  "amount" numeric,
  "operation_code" text,
  "proof_url" text,
  "external_ref" text,
  "verified_by" uuid,
  "paid_at" timestamptz,
  "created_at" timestamptz,
  CONSTRAINT "chk_payment_amount" CHECK (amount > 0)
);

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

CREATE INDEX ON "appointment_item_staff" ("employee_id");

CREATE INDEX ON "payments" ("appointment_id");

CREATE INDEX ON "payments" ("status", "created_at");

CREATE INDEX ON "payments" ("operation_code");

CREATE INDEX ON "billing_documents" ("appointment_id");

CREATE UNIQUE INDEX ON "billing_documents" ("series", "number");

CREATE INDEX ON "billing_document_items" ("document_id");

CREATE INDEX ON "notifications" ("status", "scheduled_for");

CREATE INDEX ON "notifications" ("appointment_id");

CREATE INDEX ON "notifications" ("client_id");

CREATE INDEX ON "audit_log" ("entity", "entity_id");

CREATE INDEX ON "audit_log" ("actor_id", "created_at");

-- ---------- CLAVES FORÁNEAS ----------

ALTER TABLE "role_permissions" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "role_permissions" ADD FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_roles" ADD FOREIGN KEY ("user_id") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_roles" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

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

ALTER TABLE "payments" ADD FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "payments" ADD FOREIGN KEY ("verified_by") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "billing_documents" ADD FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "billing_document_items" ADD FOREIGN KEY ("document_id") REFERENCES "billing_documents" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_log" ADD FOREIGN KEY ("actor_id") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;