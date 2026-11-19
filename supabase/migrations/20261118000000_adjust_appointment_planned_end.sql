-- Keep the quoted duration as a snapshot and store the reserved duration separately.
alter table public.appointment_items add column planned_duration_minutes integer;
alter table public.appointment_items add constraint chk_item_planned_duration check(planned_duration_minutes>0);

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

-- A dedicated operation changes only the last planned stage of an internal appointment.
-- Historical multi-pet appointments remain read-only.
create function public.adjust_appointment_planned_end(p_id uuid,p_expected_version integer,p_ends_local text) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare a public.appointments; last_stage public.appointment_item_staff; last_item public.appointment_items; new_end timestamptz; previous_minutes integer;
begin
 perform private.require_work_permission('appointments.manage');
 perform private.require_work_permission('appointments.read');
 perform private.appointment_lock();
 perform private.require_work_permission('appointments.manage');
 perform private.require_work_permission('appointments.read');
 select * into strict a from public.appointments where id=p_id for update;
 if a.version is distinct from p_expected_version then raise exception 'La cita cambió. Recarga antes de guardar' using errcode='40001'; end if;
 if a.source<>'INTERNAL' or a.status<>'CONFIRMED' then raise exception 'Solo se ajusta el fin de una cita interna programada' using errcode='22023'; end if;
 if (select count(distinct pet_id) from public.appointment_items where appointment_id=p_id)<>1 then raise exception 'La cita histórica con varias mascotas es solo de consulta' using errcode='22023'; end if;
 select st.* into strict last_stage from public.appointment_item_staff st join public.appointment_items i on i.id=st.item_id where i.appointment_id=p_id order by st.ends_at desc,st.id desc limit 1;
 select * into strict last_item from public.appointment_items where id=last_stage.item_id;
 new_end:=private.lima_instant(p_ends_local);
 if new_end<=last_stage.starts_at or new_end<=clock_timestamp() then raise exception 'El nuevo fin debe ser posterior al inicio de la última etapa y a la hora actual' using errcode='22023'; end if;
 if (new_end at time zone 'America/Lima')::date<>(last_stage.starts_at at time zone 'America/Lima')::date then raise exception 'El fin previsto debe estar en el mismo día' using errcode='22023'; end if;
 previous_minutes:=extract(epoch from(last_stage.ends_at-last_stage.starts_at))::integer/60;
 update public.appointment_item_staff set ends_at=new_end where id=last_stage.id;
 update public.appointment_items set planned_duration_minutes=coalesce(planned_duration_minutes,duration_minutes)-previous_minutes+extract(epoch from(new_end-last_stage.starts_at))::integer/60 where id=last_item.id;
 update public.appointments set ends_at=new_end,version=version+1,updated_at=clock_timestamp() where id=p_id;
 perform private.validate_appointment(p_id);
 return private.appointment_json(p_id);
end $$;
revoke all on function public.adjust_appointment_planned_end(uuid,integer,text) from public,anon;
grant execute on function public.adjust_appointment_planned_end(uuid,integer,text) to authenticated;
