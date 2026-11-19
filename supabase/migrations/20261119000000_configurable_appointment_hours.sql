-- Use configured business hours and employee shifts for all appointment starts.
create or replace function private.validate_appointment(p_id uuid) returns void language plpgsql stable security definer set search_path='' as $$
declare a public.appointments; i record; t record; first_start timestamptz; last_end timestamptz; d date;
begin
 select * into strict a from public.appointments where id=p_id;
 if not exists(select 1 from public.appointment_items where appointment_id=p_id) then raise exception 'Añade al menos un servicio por mascota' using errcode='22023'; end if;
 for i in select ai.*,min(s.starts_at) as first_time,max(s.ends_at) as last_time,count(s.id) as stage_count,sum(extract(epoch from(s.ends_at-s.starts_at))) as seconds
  from public.appointment_items ai left join public.appointment_item_staff s on s.item_id=ai.id where ai.appointment_id=p_id group by ai.id
 loop
  if i.stage_count not in (1,2) or i.seconds is distinct from (coalesce(i.planned_duration_minutes,i.duration_minutes)::numeric*60) then raise exception 'Las etapas deben sumar la duración prevista del servicio' using errcode='22023'; end if;
  if i.stage_count=1 and not exists(select 1 from public.appointment_item_staff where item_id=i.id and stage='SERVICE') then raise exception 'Un servicio simple requiere una etapa SERVICE' using errcode='22023'; end if;
  if i.stage_count=2 and (not i.requires_specialist_snapshot or not exists(select 1 from public.appointment_item_staff b join public.appointment_item_staff c on c.item_id=b.item_id where b.item_id=i.id and b.stage='BATH' and c.stage='CUT' and b.ends_at=c.starts_at)) then
   raise exception 'El relevo requiere baño seguido de corte, sin huecos' using errcode='22023'; end if;
  for t in select * from public.appointment_item_staff where item_id=i.id loop
   d:=(t.starts_at at time zone 'America/Lima')::date;
   if d<>(t.ends_at at time zone 'America/Lima')::date or not (private.labor_coverage(t.employee_id,d,t.stage='CUT' or (t.stage='SERVICE' and i.requires_specialist_snapshot)) @> tstzrange(t.starts_at,t.ends_at,'[)')) then
    raise exception 'Empleado sin cobertura laboral o habilidad para la etapa' using errcode='23P01',detail='Cita: '||p_id; end if;
  end loop;
 end loop;
 -- La primera atención empieza dentro de un tramo comercial configurado.
 for t in select ai.pet_id,min(s.starts_at) as first_time,max(s.ends_at) as last_time,sum(extract(epoch from(s.ends_at-s.starts_at))) as seconds
  from public.appointment_items ai join public.appointment_item_staff s on s.item_id=ai.id where ai.appointment_id=p_id group by ai.pet_id
 loop
  d:=(t.first_time at time zone 'America/Lima')::date;
  if not exists(select 1 from public.business_hours where weekday=extract(dow from d) and open_time<=(t.first_time at time zone 'America/Lima')::time and close_time>(t.first_time at time zone 'America/Lima')::time) then
   raise exception 'La primera atención de cada mascota debe iniciar dentro del horario configurado del local' using errcode='22023'; end if;
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

create or replace function public.employee_availability(p_employee_id uuid,p_date date,p_start time default null,p_end time default null,p_requires_specialist boolean default false)
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
  admissible:=commercial @> a;
  if not (coverage @> requested) then reasons:=array_append(reasons,'OUTSIDE_WORKING_HOURS'); end if;
  if blocks && requested then reasons:=array_append(reasons,'BLOCKED'); end if;
  if not (commercial @> a) then reasons:=array_append(reasons,'CLOSED_AT_START'); end if;
 end if;
 if not e.active or not profile_ok or not skill_ok then free:='{}'::tstzmultirange; end if;
 select coalesce(jsonb_agg(jsonb_build_object('starts_at',lower(r),'ends_at',upper(r)) order by lower(r)),'[]'::jsonb) into windows from unnest(free) r;
 return jsonb_build_object('employee_id',e.id,'date',p_date,'timezone','America/Lima',
  'interval_covered',covered,'can_start_service',covered and admissible,'reasons',reasons,'windows',windows,
  'occupancy_verified',false,'notice','Horario habilitado; ocupación de citas/recojos no verificada');
end $$;

create or replace function public.appointment_availability(p_employee_id uuid,p_date date,p_start time default null,p_end time default null,p_requires_specialist boolean default false,p_exclude_appointment_id uuid default null,p_continuation boolean default false)
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
  admissible:=coalesce(p_continuation,false) or (exists(select 1 from public.business_hours where weekday=extract(dow from p_date) and open_time<=p_start and close_time>p_start));
  if not admissible then reasons:=array_append(reasons,'INVALID_START'); end if;
  covered:=(free-busy) @> requested;
 end if;
 free:=free-busy;
 select coalesce(jsonb_agg(jsonb_build_object('starts_at',lower(r),'ends_at',upper(r)) order by lower(r)),'[]'::jsonb) into windows from unnest(free) r;
 return jsonb_build_object('windows',windows,'interval_covered',covered,'can_start_service',covered and admissible,'reasons',reasons,'timezone','America/Lima','notice','Incluye reservas programadas y bloqueos registrados; no reserva capacidad ni registra recojos automáticamente.');
end $$;

notify pgrst, 'reload schema';
