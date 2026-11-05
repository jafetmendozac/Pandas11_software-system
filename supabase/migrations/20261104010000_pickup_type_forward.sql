-- Lleva la modalidad de transporte a bases que ya aplicaron la migración
-- original de citas. Conserva requires_pickup para conciliación posterior.
do $$
begin
 if not exists (
  select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
  where n.nspname='public' and t.typname='pickup_type'
 ) then
  create type public.pickup_type as enum ('PICKUP_ONLY','DROPOFF_ONLY','BOTH','NONE');
 end if;
end $$;

alter table public.appointments
 add column if not exists pickup_type public.pickup_type not null default 'NONE';

do $$
begin
 if exists (
  select 1 from information_schema.columns
  where table_schema='public' and table_name='appointments'
   and column_name='requires_pickup'
 ) then
  update public.appointments
  set pickup_type='PICKUP_ONLY'::public.pickup_type
  where requires_pickup and pickup_type='NONE';
 end if;
end $$;
