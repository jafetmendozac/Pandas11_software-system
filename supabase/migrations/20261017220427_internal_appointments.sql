-- Fase 4 aprobada: adopción incremental local; sin reset ni tabla legacy.

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

CREATE TABLE "appointment_internal" (
  "appointment_id" uuid PRIMARY KEY,
  "notes" text,
  "updated_by" uuid NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT clock_timestamp()
);

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

ALTER TABLE "appointment_internal" ADD FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointment_internal" ADD FOREIGN KEY ("updated_by") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointments" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointments" ADD FOREIGN KEY ("cancelled_by") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointments" ADD FOREIGN KEY ("created_by") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointment_items" ADD FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointment_items" ADD FOREIGN KEY ("appointment_id", "client_id") REFERENCES "appointments" ("id", "client_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointment_items" ADD FOREIGN KEY ("pet_id", "client_id") REFERENCES "pets" ("id", "client_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointment_item_staff" ADD FOREIGN KEY ("item_id") REFERENCES "appointment_items" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "appointment_item_staff" ADD FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") DEFERRABLE INITIALLY IMMEDIATE;

insert into public.permissions(code,description) values
 ('appointments.read','Consultar agenda interna'),('appointments.manage','Crear y reprogramar citas internas'),
 ('appointments.status','Cambiar estados de cita'),('appointments.cancel','Cancelar citas'),
 ('appointment_internal.read','Consultar observaciones internas de cita'),('appointment_internal.manage','Editar observaciones internas de cita');
insert into public.role_permissions select r.id,p.id from public.roles r cross join public.permissions p
 where p.code in ('appointments.read','appointments.manage','appointments.status','appointments.cancel','appointment_internal.read','appointment_internal.manage')
 and (r.code in ('OWNER','ADMIN') or (r.code='STAFF' and p.code in ('appointments.read','appointment_internal.read')));
alter table public.appointments enable row level security;
alter table public.appointment_items enable row level security;
alter table public.appointment_item_staff enable row level security;
alter table public.appointment_internal enable row level security;
revoke all on public.appointments,public.appointment_items,public.appointment_item_staff,public.appointment_internal from anon,authenticated;
grant select on public.appointments,public.appointment_items,public.appointment_item_staff,public.appointment_internal to authenticated;
create policy appointments_read on public.appointments for select to authenticated using(public.has_permission('appointments.read'));
create policy items_read on public.appointment_items for select to authenticated using(public.has_permission('appointments.read'));
create policy assignments_read on public.appointment_item_staff for select to authenticated using(public.has_permission('appointments.read'));
create policy appointment_notes_read on public.appointment_internal for select to authenticated using(public.has_permission('appointments.read') and public.has_permission('appointment_internal.read'));

create function private.appointment_lock() returns void language plpgsql volatile set search_path='' as $$
begin
 if current_setting('transaction_isolation') <> 'read committed' then raise exception 'La agenda requiere Read Committed' using errcode='25000'; end if;
 perform pg_catalog.pg_advisory_xact_lock(930003);
end $$;
create function private.lima_instant(p_value text) returns timestamptz language plpgsql stable set search_path='' as $$
begin
 if p_value is null or p_value !~ '^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$' then
  raise exception 'Indica fecha y hora de Lima sin offset' using errcode='22023'; end if;
 return p_value::timestamp at time zone 'America/Lima';
end $$;
-- Helper sin permisos de usuario: solo invocado por operaciones controladas.
create function private.labor_coverage(p_employee uuid,p_date date,p_specialist boolean default false)
returns tstzmultirange language plpgsql stable security definer set search_path='' as $$
declare shifts tstzmultirange; hours tstzmultirange; blocked tstzmultirange; result tstzmultirange; closing time; d int:=extract(dow from p_date);
begin
 if not exists(select 1 from public.employees e join public.profiles p on p.id=e.profile_id where e.id=p_employee and e.active and p.active and (not p_specialist or e.skill_level='ALL_SERVICES')) then return '{}'::tstzmultirange; end if;
 select coalesce(range_agg(tstzrange((p_date+start_time) at time zone 'America/Lima',(p_date+end_time) at time zone 'America/Lima','[)')),'{}'::tstzmultirange) into shifts from public.employee_schedules where employee_id=p_employee and weekday=d;
 select coalesce(range_agg(tstzrange((p_date+open_time) at time zone 'America/Lima',(p_date+close_time) at time zone 'America/Lima','[)')),'{}'::tstzmultirange),max(close_time) into hours,closing from public.business_hours where weekday=d;
 result:=shifts*hours;
 if closing is not null then
  select result+coalesce(range_agg(tstzrange((p_date+closing) at time zone 'America/Lima',(p_date+end_time) at time zone 'America/Lima','[)')),'{}'::tstzmultirange) into result from public.employee_schedules where employee_id=p_employee and weekday=d and start_time<=closing and end_time>closing;
 end if;
 select coalesce(range_agg(tstzrange(starts_at,ends_at,'[)')),'{}'::tstzmultirange) into blocked from public.time_blocks where employee_id=p_employee or employee_id is null;
 return result-blocked;
end $$;

create function private.validate_appointment(p_id uuid) returns void language plpgsql stable security definer set search_path='' as $$
declare a public.appointments; i record; t record; first_start timestamptz; last_end timestamptz; d date;
begin
 select * into strict a from public.appointments where id=p_id;
 if not exists(select 1 from public.appointment_items where appointment_id=p_id) then raise exception 'Añade al menos un servicio por mascota' using errcode='22023'; end if;
 for i in select ai.*,min(s.starts_at) as first_time,max(s.ends_at) as last_time,count(s.id) as stage_count,sum(extract(epoch from(s.ends_at-s.starts_at))) as seconds
  from public.appointment_items ai left join public.appointment_item_staff s on s.item_id=ai.id where ai.appointment_id=p_id group by ai.id
 loop
  if i.stage_count not in (1,2) or i.seconds is distinct from (i.duration_minutes::numeric*60) then raise exception 'Las etapas deben sumar exactamente la duración del servicio' using errcode='22023'; end if;
  if i.stage_count=1 and not exists(select 1 from public.appointment_item_staff where item_id=i.id and stage='SERVICE') then raise exception 'Un servicio simple requiere una etapa SERVICE' using errcode='22023'; end if;
  if i.stage_count=2 and (not i.requires_specialist_snapshot or not exists(select 1 from public.appointment_item_staff b join public.appointment_item_staff c on c.item_id=b.item_id where b.item_id=i.id and b.stage='BATH' and c.stage='CUT' and b.ends_at=c.starts_at)) then
   raise exception 'El relevo requiere baño seguido de corte, sin huecos' using errcode='22023'; end if;
  for t in select * from public.appointment_item_staff where item_id=i.id loop
   d:=(t.starts_at at time zone 'America/Lima')::date;
   if d<>(t.ends_at at time zone 'America/Lima')::date or not (private.labor_coverage(t.employee_id,d,t.stage='CUT' or (t.stage='SERVICE' and i.requires_specialist_snapshot)) @> tstzrange(t.starts_at,t.ends_at,'[)')) then
    raise exception 'Empleado sin cobertura laboral o habilidad para la etapa' using errcode='23P01',detail='Cita: '||p_id; end if;
  end loop;
 end loop;
 -- Cada mascota inicia hasta17; continuaciones pueden comenzar más tarde.
 for t in select ai.pet_id,min(s.starts_at) as first_time,max(s.ends_at) as last_time,sum(extract(epoch from(s.ends_at-s.starts_at))) as seconds
  from public.appointment_items ai join public.appointment_item_staff s on s.item_id=ai.id where ai.appointment_id=p_id group by ai.pet_id
 loop
  d:=(t.first_time at time zone 'America/Lima')::date;
  if (t.first_time at time zone 'America/Lima')::time>time '17:00' or not exists(select 1 from public.business_hours where weekday=extract(dow from d) and open_time<=(t.first_time at time zone 'America/Lima')::time and close_time>(t.first_time at time zone 'America/Lima')::time) then
   raise exception 'La primera atención de cada mascota debe iniciar dentro del horario comercial y hasta las 17:00' using errcode='22023'; end if;
  if t.seconds<>extract(epoch from(t.last_time-t.first_time)) then raise exception 'Los servicios de la mascota deben ser consecutivos' using errcode='22023'; end if;
 end loop;
 -- Conflictos internos (suma sola no detectaría hueco+solapamiento compensados).
 if exists(select 1 from public.appointment_item_staff x join public.appointment_items ix on ix.id=x.item_id
  join public.appointment_item_staff y on x.id<y.id and x.starts_at<y.ends_at and x.ends_at>y.starts_at
  join public.appointment_items iy on iy.id=y.item_id
  where ix.appointment_id=p_id and iy.appointment_id=p_id and (x.employee_id=y.employee_id or ix.pet_id=iy.pet_id)) then
  raise exception 'Las asignaciones de una persona o mascota se solapan dentro de la cita' using errcode='23P01'; end if;
 if exists(select 1 from public.appointment_item_staff x join public.appointment_items ix on ix.id=x.item_id
  join public.appointment_item_staff y on x.starts_at<y.ends_at and x.ends_at>y.starts_at
  join public.appointment_items iy on iy.id=y.item_id join public.appointments ay on ay.id=iy.appointment_id
  where ix.appointment_id=p_id and iy.appointment_id<>p_id and ay.status in ('CONFIRMED','IN_PROGRESS','COMPLETED') and (x.employee_id=y.employee_id or ix.pet_id=iy.pet_id)) then
  raise exception 'El empleado o la mascota ya tiene una reserva en ese intervalo' using errcode='23P01'; end if;
 select min(s.starts_at),max(s.ends_at) into first_start,last_end from public.appointment_items ai join public.appointment_item_staff s on s.item_id=ai.id where ai.appointment_id=p_id;
 if a.starts_at<>first_start or a.ends_at<>last_end then raise exception 'Los extremos de la cita no coinciden con sus etapas' using errcode='22023'; end if;
end $$;

create function private.appointment_json(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select to_jsonb(a)||jsonb_build_object('total_price',a.total_price::text,'deposit_required',a.deposit_required::text,'pickup_fee',a.pickup_fee::text,
  'client_name',concat_ws(' ',c.first_name,c.last_name),
  'needs_attention',exists(select 1 from public.appointment_items ai join public.appointment_item_staff s on s.item_id=ai.id where ai.appointment_id=a.id and not (private.labor_coverage(s.employee_id,(s.starts_at at time zone 'America/Lima')::date,s.stage='CUT' or (s.stage='SERVICE' and ai.requires_specialist_snapshot)) @> tstzrange(s.starts_at,s.ends_at,'[)'))),
  'items',coalesce((select jsonb_agg(to_jsonb(ai)||jsonb_build_object('price',ai.price::text,'pet_name',p.name,'service_name',sv.name,'stages',coalesce((
   select jsonb_agg(to_jsonb(s)||jsonb_build_object('employee_name',concat_ws(' ',pr.first_name,pr.last_name)) order by s.starts_at,s.id) from public.appointment_item_staff s join public.employees e on e.id=s.employee_id join public.profiles pr on pr.id=e.profile_id where s.item_id=ai.id),'[]'::jsonb)) order by ai.created_at,ai.id)
   from public.appointment_items ai join public.pets p on p.id=ai.pet_id join public.services sv on sv.id=ai.service_id where ai.appointment_id=a.id),'[]'::jsonb))
 from public.appointments a join public.clients c on c.id=a.client_id where a.id=p_id
$$;
create function public.get_appointment(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_work_permission('appointments.read'); result:=private.appointment_json(p_id);
 if result is null then raise exception 'Cita inexistente' using errcode='P0002'; end if; return result;
end $$;
create function public.search_appointments(p_from timestamptz,p_until timestamptz,p_page integer default 1,p_size integer default 50,p_employee uuid default null,p_status public.appointment_status default null,p_search text default '')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_work_permission('appointments.read');
 if p_from is null or p_until is null or not isfinite(p_from) or not isfinite(p_until) or p_until<=p_from then raise exception 'Rango de agenda inválido' using errcode='22023'; end if;
 with filtered as(select a.id,a.starts_at from public.appointments a join public.clients c on c.id=a.client_id
  where a.starts_at<p_until and a.ends_at>p_from and (p_status is null or a.status=p_status)
  and (p_employee is null or exists(select 1 from public.appointment_items i join public.appointment_item_staff s on s.item_id=i.id where i.appointment_id=a.id and s.employee_id=p_employee))
  and (coalesce(p_search,'')='' or position(lower(p_search) in lower(concat_ws(' ',c.first_name,c.last_name)))>0 or exists(select 1 from public.appointment_items i join public.pets p on p.id=i.pet_id where i.appointment_id=a.id and position(lower(p_search) in lower(p.name))>0))),
 page as(select * from filtered order by starts_at,id limit greatest(1,least(p_size,100)) offset(greatest(1,p_page)-1)*greatest(1,least(p_size,100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(private.appointment_json(id) order by starts_at,id) from page),'[]'::jsonb),'total',(select count(*) from filtered)) into result;
 return result;
end $$;

create function public.save_internal_appointment(p_input jsonb,p_id uuid default null,p_expected_version integer default null) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare a public.appointments; old_item public.appointment_items; v_item jsonb; v_stage jsonb; item_id uuid; kept uuid[]:=array[]::uuid[]; q jsonb; specialist boolean; pet uuid; service uuid; client uuid;
 price numeric; duration int; target uuid; first_time timestamptz; last_time timestamptz; v_total numeric;
begin
 perform private.require_work_permission('appointments.manage'); perform private.require_work_permission('appointments.read'); perform private.appointment_lock();
 perform private.require_work_permission('appointments.manage'); perform private.require_work_permission('appointments.read');
 if p_input is null or jsonb_typeof(p_input)<>'object' or p_input-array['client_id','client_notes','items']<>'{}'::jsonb then raise exception 'Campos de cita no admitidos' using errcode='22023'; end if;
 if jsonb_typeof(p_input->'items') is distinct from 'array' or jsonb_array_length(p_input->'items')=0 then raise exception 'Añade servicios y asignaciones' using errcode='22023'; end if;
 client:=(p_input->>'client_id')::uuid;
 perform 1 from public.clients where id=client and deleted_at is null for share;
 if not found then raise exception 'Cliente no disponible' using errcode='22023'; end if;
 if p_id is null then
  insert into public.appointments(client_id,starts_at,ends_at,total_price,created_by,client_notes) values(client,now(),now()+interval '1 minute',0,auth.uid(),p_input->>'client_notes') returning * into a;
 else
  select * into strict a from public.appointments where id=p_id for update;
  if a.version is distinct from p_expected_version then raise exception 'La cita cambió. Recarga antes de guardar' using errcode='40001'; end if;
  if a.status<>'CONFIRMED' or a.client_id<>client then raise exception 'Solo se reprograman citas confirmadas del mismo cliente' using errcode='22023'; end if;
 end if;
 for v_item in select value from jsonb_array_elements(p_input->'items') loop
  if jsonb_typeof(v_item)<>'object' or v_item-array['id','pet_id','service_id','weight_kg_at_visit','notes','stages']<>'{}'::jsonb then raise exception 'Campos de servicio no admitidos' using errcode='22023'; end if;
  pet:=(v_item->>'pet_id')::uuid; service:=(v_item->>'service_id')::uuid;
  perform 1 from public.pets where id=pet and client_id=client and active and deleted_at is null and death_date is null for share;
  if not found then raise exception 'Mascota ajena, retirada o no disponible' using errcode='22023'; end if;
  old_item:=null;
  if nullif(v_item->>'id','') is not null then
   select * into strict old_item from public.appointment_items where id=(v_item->>'id')::uuid and appointment_id=a.id;
   if old_item.pet_id<>pet or old_item.service_id<>service then raise exception 'Para sustituir mascota o servicio añade un item nuevo' using errcode='22023'; end if;
   item_id:=old_item.id; price:=old_item.price; duration:=old_item.duration_minutes; specialist:=old_item.requires_specialist_snapshot;
   update public.appointment_items set notes=v_item->>'notes',weight_kg_at_visit=(v_item->>'weight_kg_at_visit')::numeric where id=item_id;
   delete from public.appointment_item_staff st where st.item_id=old_item.id;
  else
   select public.quote_service(s.id,p.pet_size,p.pet_coat_type),s.requires_specialist into q,specialist from public.services s cross join public.pets p where s.id=service and s.active and p.id=pet;
   if not found then raise exception 'Servicio no disponible' using errcode='22023'; end if;
   price:=(q->>'price')::numeric; duration:=(q->>'duration_minutes')::integer;
   insert into public.appointment_items(appointment_id,pet_id,client_id,service_id,price,duration_minutes,requires_specialist_snapshot,weight_kg_at_visit,notes)
    values(a.id,pet,client,service,price,duration,specialist,(v_item->>'weight_kg_at_visit')::numeric,v_item->>'notes') returning id into item_id;
  end if;
  if item_id=any(kept) then raise exception 'Servicio repetido' using errcode='22023'; end if; kept:=array_append(kept,item_id);
  if jsonb_typeof(v_item->'stages') is distinct from 'array' then raise exception 'Indica las etapas' using errcode='22023'; end if;
  for v_stage in select value from jsonb_array_elements(v_item->'stages') loop
   if jsonb_typeof(v_stage)<>'object' or v_stage-array['employee_id','stage','starts_local','ends_local']<>'{}'::jsonb then raise exception 'Campos de etapa no admitidos' using errcode='22023'; end if;
   target:=(v_stage->>'employee_id')::uuid;
   perform 1 from public.employees e join public.profiles pr on pr.id=e.profile_id where e.id=target for share of e,pr;
   if not found then raise exception 'Empleado inexistente' using errcode='22023'; end if;
   insert into public.appointment_item_staff(item_id,employee_id,stage,starts_at,ends_at) values(item_id,target,v_stage->>'stage',private.lima_instant(v_stage->>'starts_local'),private.lima_instant(v_stage->>'ends_local'));
  end loop;
 end loop;
 delete from public.appointment_item_staff st where st.item_id in(select id from public.appointment_items where appointment_id=a.id and not(id=any(kept)));
 delete from public.appointment_items where appointment_id=a.id and not(id=any(kept));
 select min(s.starts_at),max(s.ends_at) into first_time,last_time from public.appointment_items i join public.appointment_item_staff s on s.item_id=i.id where i.appointment_id=a.id;
 if first_time is null or first_time<clock_timestamp() then raise exception 'No se puede reservar o reprogramar en el pasado' using errcode='22023'; end if;
 select sum(i.price) into v_total from public.appointment_items i where i.appointment_id=a.id;
 update public.appointments set starts_at=first_time,ends_at=last_time,total_price=v_total,client_notes=p_input->>'client_notes',updated_at=clock_timestamp(),version=case when p_id is null then 1 else version+1 end where id=a.id;
 perform private.validate_appointment(a.id);
 return private.appointment_json(a.id);
end $$;

create function public.change_appointment_status(p_id uuid,p_target public.appointment_status,p_expected_version integer,p_reason text default null)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare a public.appointments;
begin
 perform private.require_work_permission(case when p_target='CANCELLED' then 'appointments.cancel' else 'appointments.status' end); perform private.require_work_permission('appointments.read'); perform private.appointment_lock();
 perform private.require_work_permission(case when p_target='CANCELLED' then 'appointments.cancel' else 'appointments.status' end); perform private.require_work_permission('appointments.read');
 select * into strict a from public.appointments where id=p_id for update;
 if a.version is distinct from p_expected_version then raise exception 'La cita cambió. Recarga antes de guardar' using errcode='40001'; end if;
 if p_target is null or not ((a.status='CONFIRMED' and p_target in ('IN_PROGRESS','CANCELLED','NO_SHOW')) or (a.status='IN_PROGRESS' and p_target='COMPLETED')) then raise exception 'Transición de estado no permitida' using errcode='22023'; end if;
 if p_target in ('IN_PROGRESS','NO_SHOW') and a.starts_at>clock_timestamp() then raise exception 'Todavía no llegó el inicio programado' using errcode='22023'; end if;
 if p_target='CANCELLED' and coalesce(length(btrim(p_reason)),0)=0 then raise exception 'El motivo de cancelación es obligatorio' using errcode='22023'; end if;
 if p_target='IN_PROGRESS' then perform private.validate_appointment(p_id); end if;
 update public.appointments set status=p_target,version=version+1,updated_at=clock_timestamp(),cancelled_at=case when p_target='CANCELLED' then clock_timestamp() end,cancelled_by=case when p_target='CANCELLED' then auth.uid() end,cancel_reason=case when p_target='CANCELLED' then btrim(p_reason) end where id=p_id;
 return private.appointment_json(p_id);
end $$;
create function public.save_appointment_internal(p_id uuid,p_notes text,p_expected_version integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.appointments;
begin
 perform private.require_work_permission('appointment_internal.manage'); perform private.require_work_permission('appointments.read'); perform private.appointment_lock();
 perform private.require_work_permission('appointment_internal.manage'); perform private.require_work_permission('appointments.read');
 select * into strict a from public.appointments where id=p_id for update;
 if a.version is distinct from p_expected_version then raise exception 'La cita cambió. Recarga antes de guardar' using errcode='40001'; end if;
 insert into public.appointment_internal(appointment_id,notes,updated_by) values(p_id,p_notes,auth.uid()) on conflict(appointment_id) do update set notes=excluded.notes,updated_by=auth.uid(),updated_at=clock_timestamp();
 update public.appointments set version=version+1,updated_at=clock_timestamp() where id=p_id;
 return private.appointment_json(p_id);
end $$;
create function public.appointment_availability(p_employee_id uuid,p_date date,p_start time default null,p_end time default null,p_requires_specialist boolean default false,p_exclude_appointment_id uuid default null,p_continuation boolean default false)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare free tstzmultirange; busy tstzmultirange; requested tstzrange; covered boolean; admissible boolean; reasons text[]:=array[]::text[]; windows jsonb;
begin
 perform private.require_work_permission('availability.read'); perform private.require_work_permission('appointments.read');
 if p_date is null or not isfinite(p_date) or (p_start is null)<>(p_end is null) or p_end<=p_start or p_end>=time '24:00' then raise exception 'Fecha o intervalo inválido' using errcode='22023'; end if;
 free:=private.labor_coverage(p_employee_id,p_date,coalesce(p_requires_specialist,false));
 select coalesce(range_agg(tstzrange(s.starts_at,s.ends_at,'[)')),'{}'::tstzmultirange) into busy from public.appointment_item_staff s join public.appointment_items i on i.id=s.item_id join public.appointments a on a.id=i.appointment_id where s.employee_id=p_employee_id and a.status in ('CONFIRMED','IN_PROGRESS','COMPLETED') and a.id is distinct from p_exclude_appointment_id;
 if p_start is not null then
  requested:=tstzrange((p_date+p_start) at time zone 'America/Lima',(p_date+p_end) at time zone 'America/Lima','[)');
  if not(free @> requested) then reasons:=array_append(reasons,'NO_COVERAGE'); end if;
  if busy && requested then reasons:=array_append(reasons,'BUSY'); end if;
  admissible:=coalesce(p_continuation,false) or (p_start<=time '17:00' and exists(select 1 from public.business_hours where weekday=extract(dow from p_date) and open_time<=p_start and close_time>p_start));
  if not admissible then reasons:=array_append(reasons,'INVALID_START'); end if;
  covered:=(free-busy) @> requested;
 end if;
 free:=free-busy;
 select coalesce(jsonb_agg(jsonb_build_object('starts_at',lower(r),'ends_at',upper(r)) order by lower(r)),'[]'::jsonb) into windows from unnest(free) r;
 return jsonb_build_object('windows',windows,'interval_covered',covered,'can_start_service',covered and admissible,'reasons',reasons,'timezone','America/Lima','notice','Incluye reservas programadas y bloqueos registrados; no reserva capacidad ni registra recojos automáticamente.');
end $$;

-- Configuración laboral y reservas comparten mutex, antes de leer conflictos.
create function private.lock_work_change() returns trigger language plpgsql set search_path='' as $$
begin perform private.appointment_lock(); return null; end $$;
create function private.check_work_change() returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid; days integer[]; r record;
begin
 if tg_table_name='employees' then
  if tg_op<>'UPDATE' then return null; end if;
  if new.active and (new.skill_level=old.skill_level or new.skill_level='ALL_SERVICES') then return null; end if;
  target:=new.id;
 elsif tg_table_name='employee_schedules' then
  if tg_op='INSERT' then return null; end if;
  target:=old.employee_id;
 elsif tg_table_name='business_hours' then
  if tg_op='INSERT' then days:=array[new.weekday::int];
  elsif tg_op='DELETE' then days:=array[old.weekday::int];
  else days:=array[old.weekday::int,new.weekday::int]; end if;
 elsif tg_table_name='time_blocks' then
  if tg_op='DELETE' then return null; end if;
  target:=new.employee_id;
 end if;
 for r in select distinct a.id,a.starts_at from public.appointments a join public.appointment_items i on i.appointment_id=a.id join public.appointment_item_staff s on s.item_id=i.id
  where a.status in ('CONFIRMED','IN_PROGRESS') and (target is null or s.employee_id=target)
  and (days is null or extract(dow from s.starts_at at time zone 'America/Lima')::int=any(days))
 loop
  if tg_table_name='time_blocks' then
  if not exists(select 1 from public.appointment_items i join public.appointment_item_staff s on s.item_id=i.id where i.appointment_id=r.id and (new.employee_id is null or s.employee_id=new.employee_id) and s.starts_at<new.ends_at and s.ends_at>new.starts_at) then continue; end if;
  end if;
  begin
   perform private.validate_appointment(r.id);
  exception when sqlstate '23P01' or sqlstate '22023' then
   if public.has_permission('appointments.read') then
    raise exception 'El cambio invalida la cita % del % (Lima). Reprograma o cancela esa cita primero.',r.id,to_char(r.starts_at at time zone 'America/Lima','YYYY-MM-DD HH24:MI') using errcode='23P01';
   else
    raise exception 'El cambio invalida una cita vigente. Solicita su revisión a recepción.' using errcode='23P01';
   end if;
  end;
 end loop;
 return null;
end $$;
create trigger lock_employee_changes before insert or update or delete on public.employees for each statement execute function private.lock_work_change();
create trigger check_employee_changes after update on public.employees for each row execute function private.check_work_change();
create trigger lock_schedule_changes before insert or update or delete on public.employee_schedules for each statement execute function private.lock_work_change();
create trigger check_schedule_changes after update or delete on public.employee_schedules for each row execute function private.check_work_change();
create trigger lock_business_changes before insert or update or delete on public.business_hours for each statement execute function private.lock_work_change();
create trigger check_business_changes after insert or update or delete on public.business_hours for each row execute function private.check_work_change();
create trigger lock_block_changes before insert or update or delete on public.time_blocks for each statement execute function private.lock_work_change();
create trigger check_block_changes after insert or update on public.time_blocks for each row execute function private.check_work_change();

revoke all on function private.appointment_lock(),private.lima_instant(text),private.labor_coverage(uuid,date,boolean),private.validate_appointment(uuid),private.appointment_json(uuid),private.lock_work_change(),private.check_work_change() from public,anon,authenticated;
revoke all on function public.get_appointment(uuid),public.search_appointments(timestamptz,timestamptz,integer,integer,uuid,public.appointment_status,text),public.save_internal_appointment(jsonb,uuid,integer),public.change_appointment_status(uuid,public.appointment_status,integer,text),public.save_appointment_internal(uuid,text,integer),public.appointment_availability(uuid,date,time,time,boolean,uuid,boolean) from public,anon;
grant execute on function public.get_appointment(uuid),public.search_appointments(timestamptz,timestamptz,integer,integer,uuid,public.appointment_status,text),public.save_internal_appointment(jsonb,uuid,integer),public.change_appointment_status(uuid,public.appointment_status,integer,text),public.save_appointment_internal(uuid,text,integer),public.appointment_availability(uuid,date,time,time,boolean,uuid,boolean) to authenticated;

create or replace function public.save_employee(p_input jsonb,p_id uuid default null) returns public.employees
language plpgsql security definer set search_path='' as $$
declare result public.employees; linked uuid;
begin
 perform private.require_work_permission('employees.manage'); perform private.appointment_lock();
 perform private.require_work_permission('employees.manage');
 if p_id is not null then
  select * into strict result from public.employees where id=p_id for update;
  linked:=result.profile_id;
  if p_input ? 'profile_id' and (p_input->>'profile_id')::uuid is distinct from linked then
   raise exception 'El perfil asociado no se puede sustituir' using errcode='22023';
  end if;
 else linked:=(p_input->>'profile_id')::uuid;
 end if;
 if p_id is null or coalesce((p_input->>'active')::boolean,result.active,true) then
  perform 1 from public.profiles where id=linked and active for share;
  if not found then raise exception 'Selecciona un perfil activo' using errcode='22023'; end if;
 end if;
 if p_id is null then
  insert into public.employees(profile_id,phone,skill_level,active) values
   (linked,nullif(btrim(p_input->>'phone'),''),(p_input->>'skill_level')::public.skill_level,coalesce((p_input->>'active')::boolean,true)) returning * into result;
 else
  update public.employees set phone=case when p_input ? 'phone' then nullif(btrim(p_input->>'phone'),'') else phone end,
   skill_level=case when p_input ? 'skill_level' then (p_input->>'skill_level')::public.skill_level else skill_level end,
   active=coalesce((p_input->>'active')::boolean,active),updated_at=now() where id=p_id returning * into result;
 end if;
 return result;
end $$;

create or replace function public.save_work_period(p_kind text,p_input jsonb,p_id uuid default null) returns uuid
language plpgsql volatile security definer set search_path='' as $$
declare d smallint; a time; b time; emp uuid; result uuid;
begin
 perform private.require_work_permission('schedules.manage');
 perform private.appointment_lock();
 perform private.require_work_permission('schedules.manage');

 d:=(p_input->>'weekday')::smallint; a:=(p_input->>'start_time')::time; b:=(p_input->>'end_time')::time;
 if d is null or d not between 1 and 6 or a is null or b is null or b<=a or b>=time '24:00' then
  raise exception 'Día/rango laboral inválido; usa lunes a sábado e inicio anterior al fin' using errcode='22023';
 end if;
 if p_kind='employee' then
  emp:=(p_input->>'employee_id')::uuid;
  if emp is null then raise exception 'Selecciona empleado' using errcode='22023'; end if;
  if exists(select 1 from public.employee_schedules where employee_id=emp and weekday=d and id is distinct from p_id and start_time<b and end_time>a) then
   raise exception 'El turno se solapa con otro turno' using errcode='23P01';
  end if;
  if p_id is null then insert into public.employee_schedules(employee_id,weekday,start_time,end_time) values(emp,d,a,b) returning id into result;
  else update public.employee_schedules set employee_id=emp,weekday=d,start_time=a,end_time=b where id=p_id returning id into result; end if;
 elsif p_kind='business' then
  if exists(select 1 from public.business_hours where weekday=d and id is distinct from p_id and open_time<b and close_time>a) then
   raise exception 'El horario se solapa con otro tramo comercial' using errcode='23P01';
  end if;
  if p_id is null then insert into public.business_hours(weekday,open_time,close_time) values(d,a,b) returning id into result;
  else update public.business_hours set weekday=d,open_time=a,close_time=b where id=p_id returning id into result; end if;
 else raise exception 'Tipo de horario inválido' using errcode='22023'; end if;
 if result is null then raise exception 'Horario inexistente' using errcode='P0002'; end if;
 return result;
end $$;

create or replace function public.remove_work_period(p_kind text,p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform private.require_work_permission('schedules.manage');
 perform private.appointment_lock();
 perform private.require_work_permission('schedules.manage');

 if p_kind='employee' then delete from public.employee_schedules where id=p_id;
 elsif p_kind='business' then delete from public.business_hours where id=p_id;
 else raise exception 'Tipo de horario inválido' using errcode='22023'; end if;
 if not found then raise exception 'Horario inexistente' using errcode='P0002'; end if;
end $$;

create or replace function public.save_time_block(p_input jsonb,p_id uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid; a timestamptz; b timestamptz;
begin
 perform private.require_work_permission('time_blocks.manage'); perform private.appointment_lock();
 perform private.require_work_permission('time_blocks.manage');
 -- Contrato: fecha/hora de pared Lima SIN offset. No depender de TimeZone de sesión.
 if (p_input->>'starts_local') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$'
 or (p_input->>'ends_local') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$' then
  raise exception 'Usa fecha y hora local de Lima sin zona ni offset' using errcode='22023';
 end if;
 a:=(p_input->>'starts_local')::timestamp at time zone 'America/Lima';
 b:=(p_input->>'ends_local')::timestamp at time zone 'America/Lima';
 if p_id is null then
  insert into public.time_blocks(employee_id,starts_at,ends_at,reason,created_by)
  values(nullif(p_input->>'employee_id','')::uuid,a,b,btrim(p_input->>'reason'),auth.uid()) returning id into result;
 else
  update public.time_blocks set employee_id=nullif(p_input->>'employee_id','')::uuid,starts_at=a,ends_at=b,reason=btrim(p_input->>'reason'),updated_at=now()
  where id=p_id returning id into result;
 end if;
 if result is null then raise exception 'Bloqueo inexistente' using errcode='P0002'; end if;
 return result;
end $$;

create or replace function public.remove_time_block(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_work_permission('time_blocks.manage'); perform private.appointment_lock();
 perform private.require_work_permission('time_blocks.manage');
 delete from public.time_blocks where id=p_id;
 if not found then raise exception 'Bloqueo inexistente' using errcode='P0002'; end if;
end $$;
