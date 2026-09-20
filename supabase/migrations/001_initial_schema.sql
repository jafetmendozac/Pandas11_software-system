-- Initial schema for Spa & Boutique Pandas 11.
create extension if not exists "pgcrypto";

create type public.pet_sex as enum ('MALE', 'FEMALE', 'UNKNOWN');
create type public.pet_size as enum ('SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE');
create type public.pet_coat_type as enum ('SHORT', 'MEDIUM', 'LONG', 'WIRE', 'CURLY', 'HAIRLESS');
create type public.employee_role as enum ('ALL_SERVICES', 'ASSISTANT');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  role public.employee_role not null default 'ASSISTANT',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  breed text,
  pet_sex public.pet_sex not null default 'UNKNOWN',
  pet_size public.pet_size not null default 'MEDIUM',
  bites boolean not null default false,
  pet_coat_type public.pet_coat_type,
  weight numeric(8,2),
  allergies text,
  notes text,
  active boolean not null default true,
  birth_date date,
  death_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0 check (price >= 0),
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  requires_specialist boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  pet_id uuid not null references public.pets(id) on delete restrict,
  employee_id uuid references public.profiles(id) on delete set null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'SCHEDULED',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  price numeric(10,2) not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, service_id)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles', 'clients', 'pets', 'services', 'appointments', 'appointment_services'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || table_name || '_updated_at', table_name);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.pets enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;

create policy "Allow all for authenticated" on public.profiles for all to authenticated using (true) with check (true);
create policy "Allow all for authenticated" on public.clients for all to authenticated using (true) with check (true);
create policy "Allow all for authenticated" on public.pets for all to authenticated using (true) with check (true);
create policy "Allow all for authenticated" on public.services for all to authenticated using (true) with check (true);
create policy "Allow all for authenticated" on public.appointments for all to authenticated using (true) with check (true);
create policy "Allow all for authenticated" on public.appointment_services for all to authenticated using (true) with check (true);
