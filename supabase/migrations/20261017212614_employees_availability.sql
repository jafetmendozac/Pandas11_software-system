-- Fase 3. Solo tablas laborales; no importa ni reinicia el modelo completo.
create type public.skill_level as enum ('ALL_SERVICES','ASSISTANT');
create table public.employees (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null unique references public.profiles(id) deferrable initially immediate,
 phone text, skill_level public.skill_level not null,
 active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.employee_schedules (
 id uuid primary key default gen_random_uuid(),
 employee_id uuid not null references public.employees(id) deferrable initially immediate,
 weekday smallint not null check(weekday between 1 and 6),
 start_time time not null, end_time time not null,
 check(end_time > start_time and end_time < time '24:00')
);
create table public.business_hours (
 id uuid primary key default gen_random_uuid(),
 weekday smallint not null check(weekday between 1 and 6),
 open_time time not null, close_time time not null,
 check(close_time > open_time and close_time < time '24:00')
);
create table public.time_blocks (
 id uuid primary key default gen_random_uuid(),
 employee_id uuid references public.employees(id) deferrable initially immediate,
 starts_at timestamptz not null, ends_at timestamptz not null,
 reason text not null check(length(btrim(reason)) > 0),
 created_by uuid not null references public.profiles(id) deferrable initially immediate,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(isfinite(starts_at) and isfinite(ends_at) and ends_at > starts_at)
);
create unique index on public.employee_schedules(employee_id,weekday,start_time);
create unique index on public.business_hours(weekday,open_time);
create index on public.time_blocks(employee_id,starts_at,ends_at);
create index on public.time_blocks(starts_at,ends_at);
insert into public.business_hours(weekday,open_time,close_time) select d,'07:00','18:00' from generate_series(1,6) d;

insert into public.permissions(code,description) values
 ('employees.read','Consultar empleados'),('employees.manage','Administrar empleados'),
 ('schedules.read','Consultar turnos y horario comercial'),('schedules.manage','Administrar turnos y horario comercial'),
 ('availability.read','Consultar disponibilidad laboral'),
 ('time_blocks.read','Consultar bloqueos laborales'),('time_blocks.manage','Administrar bloqueos laborales');
insert into public.role_permissions
 select r.id,p.id from public.roles r cross join public.permissions p
 where p.code in ('employees.read','employees.manage','schedules.read','schedules.manage','availability.read','time_blocks.read','time_blocks.manage')
 and (r.code in ('OWNER','ADMIN') or (r.code='STAFF' and p.code in ('employees.read','schedules.read','availability.read','time_blocks.read')));

alter table public.employees enable row level security;
alter table public.employee_schedules enable row level security;
alter table public.business_hours enable row level security;
alter table public.time_blocks enable row level security;
-- Escrituras SOLO por RPC. No se puede eludir el bloqueo de concurrencia desde REST.
revoke all on public.employees,public.employee_schedules,public.business_hours,public.time_blocks from anon,authenticated;
grant select on public.employees,public.employee_schedules,public.business_hours,public.time_blocks to authenticated;
create policy employees_read on public.employees for select to authenticated using(public.has_permission('employees.read'));
create policy schedules_read on public.employee_schedules for select to authenticated using(public.has_permission('schedules.read'));
create policy business_hours_read on public.business_hours for select to authenticated using(public.has_permission('schedules.read'));
create policy blocks_read on public.time_blocks for select to authenticated using(public.has_permission('time_blocks.read'));

create function private.require_work_permission(p_code text) returns void language plpgsql stable security definer set search_path='' as $$
begin
 if not public.has_permission(p_code) then raise exception 'Sin permiso: %',p_code using errcode='42501'; end if;
end $$;
create function public.save_employee(p_input jsonb,p_id uuid default null) returns public.employees
language plpgsql security definer set search_path='' as $$
declare result public.employees; linked uuid;
begin
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

create function public.search_employees(p_search text default '',p_page integer default 1,p_size integer default 10)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_work_permission('employees.read');
 with filtered as (
  select e.*,concat_ws(' ',p.first_name,p.last_name) as employee_name,p.active as profile_active
  from public.employees e join public.profiles p on p.id=e.profile_id
  where position(lower(coalesce(p_search,'')) in lower(concat_ws(' ',p.first_name,p.last_name,e.phone)))>0
 ), page as (
  select * from filtered order by employee_name,id limit greatest(1,least(p_size,100)) offset (greatest(1,p_page)-1)*greatest(1,least(p_size,100))
 ) select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb),'total',(select count(*) from filtered)) into result;
 return result;
end $$;

-- Un único mutex transaccional para cambios de ventanas: más conservador que
-- empleado/día, también cubre movimientos entre días sin riesgo de deadlock.
create function public.save_work_period(p_kind text,p_input jsonb,p_id uuid default null) returns uuid
language plpgsql volatile security definer set search_path='' as $$
declare d smallint; a time; b time; emp uuid; result uuid;
begin
 perform private.require_work_permission('schedules.manage');
 perform pg_catalog.pg_advisory_xact_lock(930003);
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
create function public.remove_work_period(p_kind text,p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform private.require_work_permission('schedules.manage');
 perform pg_catalog.pg_advisory_xact_lock(930003);
 if p_kind='employee' then delete from public.employee_schedules where id=p_id;
 elsif p_kind='business' then delete from public.business_hours where id=p_id;
 else raise exception 'Tipo de horario inválido' using errcode='22023'; end if;
 if not found then raise exception 'Horario inexistente' using errcode='P0002'; end if;
end $$;

create function public.save_time_block(p_input jsonb,p_id uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid; a timestamptz; b timestamptz;
begin
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
create function public.remove_time_block(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_work_permission('time_blocks.manage');
 delete from public.time_blocks where id=p_id;
 if not found then raise exception 'Bloqueo inexistente' using errcode='P0002'; end if;
end $$;

-- JSON agregado: no se trunca silenciosamente al límite REST de 1000 filas.
create function public.work_calendar(p_employee_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_work_permission('schedules.read');
 perform private.require_work_permission('time_blocks.read');
 select jsonb_build_object(
  'schedules',coalesce((select jsonb_agg(to_jsonb(s) order by weekday,start_time,id) from public.employee_schedules s where employee_id=p_employee_id),'[]'::jsonb),
  'business',coalesce((select jsonb_agg(to_jsonb(h)||jsonb_build_object('start_time',open_time,'end_time',close_time) order by weekday,open_time,id) from public.business_hours h),'[]'::jsonb),
  'blocks',coalesce((select jsonb_agg(to_jsonb(b)||jsonb_build_object(
    'starts_local',to_char(starts_at at time zone 'America/Lima','YYYY-MM-DD"T"HH24:MI:SS'),
    'ends_local',to_char(ends_at at time zone 'America/Lima','YYYY-MM-DD"T"HH24:MI:SS')) order by starts_at,id)
   from public.time_blocks b where employee_id=p_employee_id or employee_id is null),'[]'::jsonb)) into result;
 return result;
end $$;

create function public.employee_availability(p_employee_id uuid,p_date date,p_start time default null,p_end time default null,p_requires_specialist boolean default false)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 e public.employees; profile_ok boolean; skill_ok boolean; d integer; closing time;
 shifts tstzmultirange; commercial tstzmultirange; coverage tstzmultirange; blocks tstzmultirange; free tstzmultirange;
 requested tstzrange; a timestamptz; b timestamptz; covered boolean; admissible boolean;
 reasons text[]:=array[]::text[]; windows jsonb;
begin
 perform private.require_work_permission('availability.read');
 if p_date is null or not isfinite(p_date) or (p_start is null)<>(p_end is null) or p_end<=p_start or p_end>=time '24:00' then
  raise exception 'Fecha o intervalo inválido' using errcode='22023';
 end if;
 select * into strict e from public.employees where id=p_employee_id;
 select active into profile_ok from public.profiles where id=e.profile_id;
 skill_ok:=not coalesce(p_requires_specialist,false) or e.skill_level='ALL_SERVICES';
 d:=extract(dow from p_date);
 select coalesce(range_agg(tstzrange((p_date+start_time) at time zone 'America/Lima',(p_date+end_time) at time zone 'America/Lima','[)')),'{}'::tstzmultirange)
 into shifts from public.employee_schedules where employee_id=e.id and weekday=d;
 select coalesce(range_agg(tstzrange((p_date+open_time) at time zone 'America/Lima',(p_date+close_time) at time zone 'America/Lima','[)')),'{}'::tstzmultirange),max(close_time)
 into commercial,closing from public.business_hours where weekday=d;
 coverage:=shifts * commercial;
 -- Prolongación solo del turno que realmente cubre el cierre final del local.
 if closing is not null then
  select coverage + coalesce(range_agg(tstzrange((p_date+closing) at time zone 'America/Lima',(p_date+end_time) at time zone 'America/Lima','[)')),'{}'::tstzmultirange)
  into coverage from public.employee_schedules where employee_id=e.id and weekday=d and start_time<=closing and end_time>closing;
 end if;
 select coalesce(range_agg(tstzrange(starts_at,ends_at,'[)')),'{}'::tstzmultirange) into blocks
 from public.time_blocks where (employee_id=e.id or employee_id is null)
  and starts_at < ((p_date+1)::timestamp at time zone 'America/Lima') and ends_at > (p_date::timestamp at time zone 'America/Lima');
 free:=coverage-blocks;
 if not e.active then reasons:=array_append(reasons,'INACTIVE_EMPLOYEE'); end if;
 if not profile_ok then reasons:=array_append(reasons,'INACTIVE_PROFILE'); end if;
 if not skill_ok then reasons:=array_append(reasons,'SKILL_REQUIRED'); end if;
 if isempty(commercial) then reasons:=array_append(reasons,'CLOSED'); end if;
 if isempty(shifts) then reasons:=array_append(reasons,'NO_SHIFT'); end if;
 if p_start is not null then
  a:=(p_date+p_start) at time zone 'America/Lima'; b:=(p_date+p_end) at time zone 'America/Lima'; requested:=tstzrange(a,b,'[)');
  covered:=free @> requested and e.active and profile_ok and skill_ok;
  admissible:=commercial @> a and p_start<=time '17:00';
  if not (coverage @> requested) then reasons:=array_append(reasons,'OUTSIDE_WORKING_HOURS'); end if;
  if blocks && requested then reasons:=array_append(reasons,'BLOCKED'); end if;
  if not (commercial @> a) then reasons:=array_append(reasons,'CLOSED_AT_START'); end if;
  if p_start>time '17:00' then reasons:=array_append(reasons,'LATE_START'); end if;
 end if;
 if not e.active or not profile_ok or not skill_ok then free:='{}'::tstzmultirange; end if;
 select coalesce(jsonb_agg(jsonb_build_object('starts_at',lower(r),'ends_at',upper(r)) order by lower(r)),'[]'::jsonb) into windows from unnest(free) r;
 return jsonb_build_object('employee_id',e.id,'date',p_date,'timezone','America/Lima',
  'interval_covered',covered,'can_start_service',covered and admissible,'reasons',reasons,'windows',windows,
  'occupancy_verified',false,'notice','Horario habilitado; ocupación de citas/recojos no verificada');
end $$;

revoke all on function private.require_work_permission(text) from public,anon,authenticated;
revoke all on function public.save_employee(jsonb,uuid),public.search_employees(text,integer,integer),
 public.save_work_period(text,jsonb,uuid),public.remove_work_period(text,uuid),public.save_time_block(jsonb,uuid),public.remove_time_block(uuid),
 public.work_calendar(uuid),public.employee_availability(uuid,date,time,time,boolean) from public,anon;
grant execute on function public.save_employee(jsonb,uuid),public.search_employees(text,integer,integer),
 public.save_work_period(text,jsonb,uuid),public.remove_work_period(text,uuid),public.save_time_block(jsonb,uuid),public.remove_time_block(uuid),
 public.work_calendar(uuid),public.employee_availability(uuid,date,time,time,boolean) to authenticated;
