-- Restrict new and reprogrammed internal appointments to one pet.
-- Historical appointments are preserved; the RPC validates only incoming payloads.
create or replace function public.save_internal_appointment(p_input jsonb,p_id uuid default null,p_expected_version integer default null) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare a public.appointments; old_item public.appointment_items; v_item jsonb; v_stage jsonb; item_id uuid; kept uuid[]:=array[]::uuid[]; q jsonb; specialist boolean; pet uuid; service uuid; client uuid;
 price numeric; duration int; target uuid; first_time timestamptz; last_time timestamptz; v_total numeric;
begin
 perform private.require_work_permission('appointments.manage'); perform private.require_work_permission('appointments.read'); perform private.appointment_lock();
 perform private.require_work_permission('appointments.manage'); perform private.require_work_permission('appointments.read');
 if p_input is null or jsonb_typeof(p_input)<>'object' or p_input-array['client_id','client_notes','items']<>'{}'::jsonb then raise exception 'Campos de cita no admitidos' using errcode='22023'; end if;
 if jsonb_typeof(p_input->'items') is distinct from 'array' or jsonb_array_length(p_input->'items')=0 then raise exception 'Añade servicios y asignaciones' using errcode='22023'; end if;
 if (select count(distinct nullif(value->>'pet_id','')) from jsonb_array_elements(p_input->'items'))<>1
  or exists(select 1 from jsonb_array_elements(p_input->'items') where nullif(value->>'pet_id','') is null)
 then raise exception 'Una cita solo puede incluir una mascota' using errcode='22023'; end if;
 client:=(p_input->>'client_id')::uuid;
 perform 1 from public.clients where id=client and deleted_at is null for share;
 if not found then raise exception 'Cliente no disponible' using errcode='22023'; end if;
 if p_id is null then
  insert into public.appointments(client_id,starts_at,ends_at,total_price,created_by,client_notes) values(client,now(),now()+interval '1 minute',0,auth.uid(),p_input->>'client_notes') returning * into a;
 else
  select * into strict a from public.appointments where id=p_id for update;
  if a.version is distinct from p_expected_version then raise exception 'La cita cambió. Recarga antes de guardar' using errcode='40001'; end if;
  if a.status<>'CONFIRMED' or a.client_id<>client then raise exception 'Solo se reprograman citas confirmadas del mismo cliente' using errcode='22023'; end if;
  if (select count(distinct pet_id) from public.appointment_items where appointment_id=a.id)>1 then
   raise exception 'La cita histórica con varias mascotas es solo de consulta' using errcode='22023';
  end if;
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
   select public.quote_service(s.id,p.pet_size),s.requires_specialist into q,specialist from public.services s cross join public.pets p where s.id=service and s.active and p.id=pet;
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

revoke all on function public.save_internal_appointment(jsonb,uuid,integer) from public,anon;
grant execute on function public.save_internal_appointment(jsonb,uuid,integer) to authenticated;
