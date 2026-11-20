-- Catálogo comercial aprobado. Esta migración preserva los snapshots históricos.
alter table public.services add column kind text not null default 'MAIN' check (kind in ('MAIN','ADD_ON'));
alter table public.services add column can_sell_alone boolean not null default false;
alter table public.services add column base_max_price numeric;
update public.services set base_max_price=base_price;
alter table public.services alter column base_max_price set not null;
alter table public.services add constraint services_price_range check
 (base_max_price>=base_price and base_max_price<'Infinity'::numeric and base_max_price=round(base_max_price,2));
alter table public.services add constraint services_kind_standalone check (kind='ADD_ON' or not can_sell_alone);
alter table public.service_prices add column max_price numeric;
update public.service_prices set max_price=price;
alter table public.service_prices alter column max_price set not null;
alter table public.service_prices add constraint service_prices_range check
 (max_price>=price and max_price<'Infinity'::numeric and max_price=round(max_price,2));
grant insert(kind,can_sell_alone,base_max_price),update(kind,can_sell_alone,base_max_price) on public.services to authenticated;
grant insert(max_price),update(max_price) on public.service_prices to authenticated;

create table public.service_addon_allowed (
 addon_id uuid not null references public.services(id) on delete cascade,
 main_id uuid not null references public.services(id) on delete cascade,
 primary key(addon_id,main_id)
);
alter table public.service_addon_allowed enable row level security;
revoke all on public.service_addon_allowed from anon,authenticated;
grant select,insert,delete on public.service_addon_allowed to authenticated;
create policy addon_read on public.service_addon_allowed for select to authenticated
 using(public.has_permission('services.read') or (private.catalog_visible(addon_id) and private.catalog_visible(main_id)));
create policy addon_insert on public.service_addon_allowed for insert to authenticated
 with check(public.has_permission('services.manage'));
create policy addon_delete on public.service_addon_allowed for delete to authenticated
 using(public.has_permission('services.manage'));

-- El nombre de la cita ya no depende de que sobreviva el catálogo original.
alter table public.appointment_items add column service_name_snapshot text;
update public.appointment_items ai set service_name_snapshot=s.name
 from public.services s where s.id=ai.service_id;
do $$ begin
 if exists(select 1 from public.appointment_items where service_name_snapshot is null) then
  raise exception 'Cita sin nombre de servicio; conciliar antes de borrar';
 end if;
end $$;
alter table public.appointment_items alter column service_name_snapshot set not null;
alter table public.appointment_items alter column service_id drop not null;
alter table public.appointment_items drop constraint appointment_items_service_id_fkey;
alter table public.appointment_items add constraint appointment_items_service_id_fkey
 foreign key(service_id) references public.services(id) on delete set null;
alter table public.sale_items drop constraint sale_items_service_id_fkey;
alter table public.sale_items add constraint sale_items_service_id_fkey
 foreign key(service_id) references public.services(id) on delete set null;
alter table public.sale_items drop constraint chk_sale_item_source;
alter table public.sale_items add constraint chk_sale_item_source check (
 (kind='SERVICE' and appointment_item_id is not null and product_id is null and quantity=1)
 or (kind='PRODUCT' and appointment_item_id is null and service_id is null and product_id is not null));

-- Mantener los seis registros comerciales con IDs estables del seed local.
do $$ begin
 if exists(select 1 from public.services where id in
 ('d0400000-0000-4000-8000-000000000305','d0400000-0000-4000-8000-000000000310')
 and (id='d0400000-0000-4000-8000-000000000305' and name<>'Baño estético'
   or id='d0400000-0000-4000-8000-000000000310' and name<>'Desparasitación')) then
  raise exception 'ID de servicio comercial ocupado por otra prestación';
 end if;
 if exists(select 1 from public.services where id in
 ('d0400000-0000-4000-8000-000000000313','d0400000-0000-4000-8000-000000000314',
  'd0400000-0000-4000-8000-000000000315','d0400000-0000-4000-8000-000000000316')) then
  raise exception 'ID de servicio nuevo ya ocupado; conciliar';
 end if;
end $$;

insert into public.services(id,name,base_price,base_max_price,base_duration_minutes,requires_specialist,kind,can_sell_alone)
values
 ('d0400000-0000-4000-8000-000000000305','Baño estético',25,25,45,false,'MAIN',false),
 ('d0400000-0000-4000-8000-000000000310','Desparasitación',5,30,15,false,'ADD_ON',true),
 ('d0400000-0000-4000-8000-000000000313','Baño y corte',45,45,90,true,'MAIN',false),
 ('d0400000-0000-4000-8000-000000000314','Corte estético',25,25,45,true,'MAIN',false),
 ('d0400000-0000-4000-8000-000000000315','Baño medicado',5,15,15,false,'ADD_ON',false),
 ('d0400000-0000-4000-8000-000000000316','Corte higiénico',5,20,20,true,'ADD_ON',true)
on conflict(id) do update set name=excluded.name,base_price=excluded.base_price,
 base_max_price=excluded.base_max_price,base_duration_minutes=excluded.base_duration_minutes,
 requires_specialist=excluded.requires_specialist,kind=excluded.kind,can_sell_alone=excluded.can_sell_alone,
 active=true,visible_to_clients=true;

delete from public.service_prices where service_id in
 ('d0400000-0000-4000-8000-000000000305','d0400000-0000-4000-8000-000000000310');
insert into public.service_prices(service_id,pet_size,price,max_price,duration_minutes)
values
 ('d0400000-0000-4000-8000-000000000305','TOY',25,25,45),
 ('d0400000-0000-4000-8000-000000000305','SMALL',30,30,60),
 ('d0400000-0000-4000-8000-000000000305','MEDIUM',35,35,75),
 ('d0400000-0000-4000-8000-000000000305','LARGE',40,45,90),
 ('d0400000-0000-4000-8000-000000000305','EXTRA_LARGE',50,60,120),
 ('d0400000-0000-4000-8000-000000000313','TOY',45,45,90),
 ('d0400000-0000-4000-8000-000000000313','SMALL',45,50,105),
 ('d0400000-0000-4000-8000-000000000313','MEDIUM',50,50,120),
 ('d0400000-0000-4000-8000-000000000313','LARGE',55,60,150),
 ('d0400000-0000-4000-8000-000000000313','EXTRA_LARGE',60,75,180),
 ('d0400000-0000-4000-8000-000000000314','TOY',25,25,45),
 ('d0400000-0000-4000-8000-000000000314','SMALL',30,30,60),
 ('d0400000-0000-4000-8000-000000000314','MEDIUM',35,35,75),
 ('d0400000-0000-4000-8000-000000000314','LARGE',40,40,90),
 ('d0400000-0000-4000-8000-000000000314','EXTRA_LARGE',50,50,120);

insert into public.service_addon_allowed(addon_id,main_id) values
 ('d0400000-0000-4000-8000-000000000315','d0400000-0000-4000-8000-000000000305'),
 ('d0400000-0000-4000-8000-000000000316','d0400000-0000-4000-8000-000000000305'),
 ('d0400000-0000-4000-8000-000000000310','d0400000-0000-4000-8000-000000000305'),
 ('d0400000-0000-4000-8000-000000000310','d0400000-0000-4000-8000-000000000313'),
 ('d0400000-0000-4000-8000-000000000310','d0400000-0000-4000-8000-000000000314');

-- Solo filas antiguas conocidas. Las referencias conservan nombre e importes.
do $$ begin
 if exists(select 1 from public.services where id in
 ('d0400000-0000-4000-8000-000000000301','d0400000-0000-4000-8000-000000000302',
  'd0400000-0000-4000-8000-000000000303','d0400000-0000-4000-8000-000000000304',
  'd0400000-0000-4000-8000-000000000306','d0400000-0000-4000-8000-000000000307',
  'd0400000-0000-4000-8000-000000000308','d0400000-0000-4000-8000-000000000309',
  'd0400000-0000-4000-8000-000000000311','d0400000-0000-4000-8000-000000000312')
  and name not in ('Baño canino','Baño y corte canino','Hidratación de pelaje','Spa de temporada',
   'Baño medicado para piel delicada','Baño medicado para parásitos externos',
   'Corte de pelo simple','Corte de pelo de raza','Cepillados','Corte de uñas')) then
  raise exception 'Servicio antiguo con ID y nombre no conciliados';
 end if;
 if exists(
  select 1 from public.services s join (values
   ('d0400000-0000-4000-8000-000000000301'::uuid,'Baño canino'),
   ('d0400000-0000-4000-8000-000000000302'::uuid,'Baño y corte canino'),
   ('d0400000-0000-4000-8000-000000000303'::uuid,'Hidratación de pelaje'),
   ('d0400000-0000-4000-8000-000000000304'::uuid,'Spa de temporada'),
   ('d0400000-0000-4000-8000-000000000306'::uuid,'Baño medicado para piel delicada'),
   ('d0400000-0000-4000-8000-000000000307'::uuid,'Baño medicado para parásitos externos'),
   ('d0400000-0000-4000-8000-000000000308'::uuid,'Corte de pelo simple'),
   ('d0400000-0000-4000-8000-000000000309'::uuid,'Corte de pelo de raza'),
   ('d0400000-0000-4000-8000-000000000311'::uuid,'Cepillados'),
   ('d0400000-0000-4000-8000-000000000312'::uuid,'Corte de uñas')
  ) expected(id,name) on expected.id=s.id where s.name<>expected.name
 ) then raise exception 'Nombre de servicio antiguo no coincide con su ID'; end if;
 if exists(select 1 from public.services where name in
  ('Baño canino','Baño y corte canino','Hidratación de pelaje','Spa de temporada',
   'Baño medicado para piel delicada','Baño medicado para parásitos externos',
   'Corte de pelo simple','Corte de pelo de raza','Cepillados','Corte de uñas')
  and id not in
  ('d0400000-0000-4000-8000-000000000301','d0400000-0000-4000-8000-000000000302',
   'd0400000-0000-4000-8000-000000000303','d0400000-0000-4000-8000-000000000304',
   'd0400000-0000-4000-8000-000000000306','d0400000-0000-4000-8000-000000000307',
   'd0400000-0000-4000-8000-000000000308','d0400000-0000-4000-8000-000000000309',
   'd0400000-0000-4000-8000-000000000311','d0400000-0000-4000-8000-000000000312')) then
  raise exception 'Nombre antiguo duplicado fuera del seed; conciliar antes de borrar';
 end if;
 if exists(select 1 from public.services where name in ('Servicio Duplex','Servicio Express')
  group by name having count(*)>1) then
  raise exception 'Duplex/Express duplicados; conciliar antes de borrar';
 end if;
end $$;
delete from public.service_prices where service_id in
 (select id from public.services where name in
 ('Baño canino','Baño y corte canino','Hidratación de pelaje','Spa de temporada',
  'Baño medicado para piel delicada','Baño medicado para parásitos externos',
  'Corte de pelo simple','Corte de pelo de raza','Cepillados','Corte de uñas',
  'Servicio Duplex','Servicio Express'));
delete from public.services where name in
 ('Baño canino','Baño y corte canino','Hidratación de pelaje','Spa de temporada',
  'Baño medicado para piel delicada','Baño medicado para parásitos externos',
  'Corte de pelo simple','Corte de pelo de raza','Cepillados','Corte de uñas',
  'Servicio Duplex','Servicio Express');

-- Cotización con límites, snapshots y validación autoritativa.

create or replace function public.quote_service(p_service_id uuid,p_size public.pet_size default null)
returns jsonb language plpgsql stable set search_path='' as $$
declare result jsonb;
begin
 select jsonb_build_object('service_id',s.id,'price',coalesce(r.price,s.base_price)::text,
  'max_price',coalesce(r.max_price,s.base_max_price)::text,
  'duration_minutes',coalesce(r.duration_minutes,s.base_duration_minutes),
  'rule_id',r.id,'source',case when r.id is null then 'BASE' else 'SIZE' end) into result
 from public.services s left join public.service_prices r on r.service_id=s.id and r.pet_size=p_size
 where s.id=p_service_id and s.active
  and (public.has_permission('services.read') or private.catalog_visible(s.id));
 if result is null then raise exception 'Servicio no disponible para calcular' using errcode='42501'; end if;
 if public.has_permission('services.read') and not public.has_permission('service_prices.read') and not private.catalog_visible(p_service_id) then
  raise exception 'Sin permiso para consultar tarifas de este servicio' using errcode='42501';
 end if;
 return result;
end $$;

create or replace function private.appointment_json(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select to_jsonb(a)||jsonb_build_object('total_price',a.total_price::text,'deposit_required',a.deposit_required::text,'pickup_fee',a.pickup_fee::text,'pickup_type',a.pickup_type,
  'client_name',concat_ws(' ',c.first_name,c.last_name),
  'needs_attention',exists(select 1 from public.appointment_items ai join public.appointment_item_staff s on s.item_id=ai.id where ai.appointment_id=a.id and not (private.labor_coverage(s.employee_id,(s.starts_at at time zone 'America/Lima')::date,s.stage='CUT' or (s.stage='SERVICE' and ai.requires_specialist_snapshot)) @> tstzrange(s.starts_at,s.ends_at,'[)'))),
  'items',coalesce((select jsonb_agg(to_jsonb(ai)||jsonb_build_object('price',ai.price::text,'pet_name',p.name,'service_name',ai.service_name_snapshot,'stages',coalesce((
   select jsonb_agg(to_jsonb(s)||jsonb_build_object('employee_name',concat_ws(' ',pr.first_name,pr.last_name)) order by s.starts_at,s.id) from public.appointment_item_staff s join public.employees e on e.id=s.employee_id join public.profiles pr on pr.id=e.profile_id where s.item_id=ai.id),'[]'::jsonb)) order by ai.created_at,ai.id)
   from public.appointment_items ai join public.pets p on p.id=ai.pet_id where ai.appointment_id=a.id),'[]'::jsonb))
 from public.appointments a join public.clients c on c.id=a.client_id where a.id=p_id
$$;

create or replace function public.save_internal_appointment(p_input jsonb,p_id uuid default null,p_expected_version integer default null) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare a public.appointments; old_item public.appointment_items; v_item jsonb; v_stage jsonb; item_id uuid; kept uuid[]:=array[]::uuid[]; q jsonb; specialist boolean; pet uuid; service uuid; client uuid;
 price numeric; duration int; target uuid; first_time timestamptz; last_time timestamptz; v_total numeric; v_price_text text; v_main uuid; v_main_count integer; v_addon_count integer;
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
  if jsonb_typeof(v_item)<>'object' or v_item-array['id','pet_id','service_id','weight_kg_at_visit','notes','stages','planned_duration_minutes','price']<>'{}'::jsonb then raise exception 'Campos de servicio no admitidos' using errcode='22023'; end if;
  pet:=(v_item->>'pet_id')::uuid; service:=(v_item->>'service_id')::uuid;
  perform 1 from public.pets where id=pet and client_id=client and active and deleted_at is null and death_date is null for share;
  if not found then raise exception 'Mascota ajena, retirada o no disponible' using errcode='22023'; end if;
  if p_id is not null and v_item ? 'planned_duration_minutes' then raise exception 'El ajuste de duración al crear no se admite al editar una cita' using errcode='22023'; end if;
  old_item:=null;
  if nullif(v_item->>'id','') is not null then
   select * into strict old_item from public.appointment_items where id=(v_item->>'id')::uuid and appointment_id=a.id;
   if old_item.service_id is null then raise exception 'Servicio histórico retirado; esta cita es solo de consulta' using errcode='22023'; end if;
   if old_item.pet_id<>pet or old_item.service_id<>service then raise exception 'Para sustituir mascota o servicio añade un item nuevo' using errcode='22023'; end if;
   item_id:=old_item.id; price:=old_item.price; duration:=old_item.duration_minutes; specialist:=old_item.requires_specialist_snapshot;
   update public.appointment_items set notes=v_item->>'notes',weight_kg_at_visit=(v_item->>'weight_kg_at_visit')::numeric where id=item_id;
   delete from public.appointment_item_staff st where st.item_id=old_item.id;
  else
   select public.quote_service(s.id,p.pet_size),s.requires_specialist into q,specialist from public.services s cross join public.pets p where s.id=service and s.active and p.id=pet;
   if not found then raise exception 'Servicio no disponible' using errcode='22023'; end if;
   v_price_text:=v_item->>'price';
   if v_price_text is null then
    if (q->>'price')::numeric<>(q->>'max_price')::numeric then
     raise exception 'Elige un precio dentro del rango del servicio' using errcode='22023';
    end if;
    price:=(q->>'price')::numeric;
   else
    if v_price_text !~ '^[0-9]+([.][0-9]{1,2})?$' then raise exception 'Precio de servicio inválido' using errcode='22023'; end if;
    price:=v_price_text::numeric;
    if price<(q->>'price')::numeric or price>(q->>'max_price')::numeric then
     raise exception 'Precio fuera del rango del servicio' using errcode='22023'; end if;
   end if;
   duration:=(q->>'duration_minutes')::integer;
   insert into public.appointment_items(appointment_id,pet_id,client_id,service_id,service_name_snapshot,price,duration_minutes,planned_duration_minutes,requires_specialist_snapshot,weight_kg_at_visit,notes)
    values(a.id,pet,client,service,(select name from public.services where id=service),price,duration,(v_item->>'planned_duration_minutes')::integer,specialist,(v_item->>'weight_kg_at_visit')::numeric,v_item->>'notes') returning id into item_id;
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
 if p_id is null and exists(select 1 from public.appointment_items where appointment_id=a.id and planned_duration_minutes is not null) then
  if (select count(*) from public.appointment_items where appointment_id=a.id and planned_duration_minutes is not null)<>1
   or exists(select 1 from public.appointment_items i where i.appointment_id=a.id and i.planned_duration_minutes is not null
    and i.id<>(select st.item_id from public.appointment_item_staff st join public.appointment_items ai on ai.id=st.item_id where ai.appointment_id=a.id order by st.ends_at desc,st.id desc limit 1))
  then raise exception 'Solo el último servicio puede ajustar su duración prevista' using errcode='22023'; end if;
 end if;
 select count(*) filter(where s.kind='MAIN'),count(*) filter(where s.kind='ADD_ON'),
  max(s.id) filter(where s.kind='MAIN') into v_main_count,v_addon_count,v_main
 from public.appointment_items i join public.services s on s.id=i.service_id where i.appointment_id=a.id;
 if v_main_count=1 then
  if exists(select 1 from public.appointment_items i join public.services s on s.id=i.service_id
   where i.appointment_id=a.id and s.kind='ADD_ON' and not exists
    (select 1 from public.service_addon_allowed x where x.addon_id=s.id and x.main_id=v_main)) then
   raise exception 'Adicional incompatible con el servicio principal' using errcode='22023'; end if;
 elsif v_main_count=0 and v_addon_count=1 then
  if not exists(select 1 from public.appointment_items i join public.services s on s.id=i.service_id
   where i.appointment_id=a.id and s.can_sell_alone) then
   raise exception 'Este adicional requiere Baño estético' using errcode='22023'; end if;
 else raise exception 'Elige un principal o una prestación que se venda sola' using errcode='22023'; end if;
 select min(s.starts_at),max(s.ends_at) into first_time,last_time from public.appointment_items i join public.appointment_item_staff s on s.item_id=i.id where i.appointment_id=a.id;
 if first_time is null or first_time<clock_timestamp() then raise exception 'No se puede reservar o reprogramar en el pasado' using errcode='22023'; end if;
 select sum(i.price) into v_total from public.appointment_items i where i.appointment_id=a.id;
 update public.appointments set starts_at=first_time,ends_at=last_time,total_price=v_total,client_notes=p_input->>'client_notes',updated_at=clock_timestamp(),version=case when p_id is null then 1 else version+1 end where id=a.id;
 perform private.validate_appointment(a.id);
 return private.appointment_json(a.id);
end $$;

create or replace function public.create_sale_draft(p_input jsonb) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare v_request uuid; v_client uuid; v_appointment uuid; v_sale uuid; v_existing public.sales;
 v_appointment_row public.appointments; v_lines jsonb; v_line jsonb; v_product public.products;
 v_product_id uuid; v_quantity integer; v_total numeric; v_service_total numeric;
begin
 perform private.require_sales_permission('sales.manage');
 perform private.appointment_lock();
 perform private.require_sales_permission('sales.manage');
 if p_input is null or jsonb_typeof(p_input)<>'object' or
    p_input-array['request_id','client_id','appointment_id','products']<>'{}'::jsonb or
    p_input->>'request_id' is null or p_input->>'client_id' is null then
  raise exception 'Campos de venta invalidos' using errcode='22023';
 end if;
 v_request:=(p_input->>'request_id')::uuid;
 v_client:=(p_input->>'client_id')::uuid;
 v_appointment:=nullif(p_input->>'appointment_id','')::uuid;
 v_lines:=coalesce(p_input->'products','[]'::jsonb);
 if jsonb_typeof(v_lines)<>'array' or jsonb_array_length(v_lines)>100 or v_request is null or v_client is null then
  raise exception 'Detalle de venta invalido' using errcode='22023';
 end if;
 select * into v_existing from public.sales where request_id=v_request;
 if found then
  if v_existing.created_by<>auth.uid() or v_existing.request_payload<>p_input then
   raise exception 'Clave de reintento usada con otro contenido o autor' using errcode='22023';
  end if;
  return private.sale_json(v_existing.id);
 end if;
 if not exists(select 1 from public.clients c where c.id=v_client and c.deleted_at is null) then
  raise exception 'Cliente no disponible' using errcode='22023';
 end if;
 if v_appointment is not null then
  select * into v_appointment_row from public.appointments where id=v_appointment;
  if not found or v_appointment_row.client_id<>v_client or v_appointment_row.source<>'INTERNAL' or
     v_appointment_row.status<>'COMPLETED' then
   raise exception 'La venta requiere cita interna completada del cliente' using errcode='22023';
  end if;
  select coalesce(sum(price),0) into v_service_total from public.appointment_items where appointment_id=v_appointment;
  if v_service_total<>v_appointment_row.total_price then
   raise exception 'El total de la cita incluye conceptos aun no modelados en venta' using errcode='22023';
  end if;
 end if;
 if v_appointment is null and jsonb_array_length(v_lines)=0 then
  raise exception 'Agrega al menos un articulo' using errcode='22023';
 end if;
 insert into public.sales(client_id,appointment_id,request_id,request_payload,created_by)
 values(v_client,v_appointment,v_request,p_input,auth.uid()) returning id into v_sale;
 if v_appointment is not null then
  insert into public.sale_items(sale_id,kind,appointment_item_id,service_id,description,unit,quantity,unit_price)
  select v_sale,'SERVICE',ai.id,ai.service_id,ai.service_name_snapshot,'UNIT',1,ai.price
  from public.appointment_items ai
  where ai.appointment_id=v_appointment;
 end if;
 for v_line in select value from jsonb_array_elements(v_lines) loop
  if jsonb_typeof(v_line)<>'object' or v_line-array['product_id','quantity']<>'{}'::jsonb or
     coalesce(v_line->>'quantity','') !~ '^[1-9][0-9]{0,5}$' then
   raise exception 'Linea de articulo invalida' using errcode='22023';
  end if;
  v_product_id:=(v_line->>'product_id')::uuid;
  v_quantity:=(v_line->>'quantity')::integer;
  select * into v_product from public.products where id=v_product_id and active;
  if not found then raise exception 'Articulo no disponible' using errcode='22023'; end if;
  insert into public.sale_items(sale_id,kind,product_id,description,unit,quantity,unit_price)
  values(v_sale,'PRODUCT',v_product_id,v_product.name,v_product.unit,v_quantity,v_product.price);
 end loop;
 select coalesce(sum(line_total),0) into v_total from public.sale_items where sale_id=v_sale;
 update public.sales set total=v_total where id=v_sale;
 return private.sale_json(v_sale);
end $$;

create or replace function public.dashboard_analytics(p_month date)
returns jsonb
language plpgsql stable security definer
set search_path = '' as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_trend_start timestamptz;
  v_kpis jsonb;
  v_trend jsonb;
  v_services jsonb;
  v_products jsonb;
begin
  if not private.sales_operator() or not public.has_permission('analytics.read') then
    raise exception 'Sin permiso para consultar indicadores' using errcode = '42501';
  end if;
  if p_month is null or p_month <> date_trunc('month', p_month)::date then
    raise exception 'Indique el primer día del mes' using errcode = '22023';
  end if;

  v_start := p_month::timestamp at time zone 'America/Lima';
  v_end := (p_month + interval '1 month')::timestamp at time zone 'America/Lima';
  v_trend_start := (p_month - interval '11 months')::timestamp at time zone 'America/Lima';
  v_kpis := public.dashboard_kpis(p_month);

  with months as (
    select (p_month - (11 - g.n) * interval '1 month')::date as month_start
    from generate_series(0, 11) as g(n)
  ), service_receipts as (
    select date_trunc('month', p.paid_at at time zone 'America/Lima')::date as month_start,
           sum(p.amount) as amount
    from public.payments p
    where p.status = 'PAID' and p.type in ('BALANCE', 'DEPOSIT')
      and p.paid_at >= v_trend_start and p.paid_at < v_end
    group by 1
  ), product_receipts as (
    select date_trunc('month', sp.paid_at at time zone 'America/Lima')::date as month_start,
           sum(sp.amount) as amount
    from public.sale_payments sp
    where sp.status = 'PAID' and sp.paid_at >= v_trend_start and sp.paid_at < v_end
    group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'month', to_char(m.month_start, 'YYYY-MM'),
    'service_collections', round(coalesce(sr.amount, 0), 2)::text,
    'product_collections', round(coalesce(pr.amount, 0), 2)::text
  ) order by m.month_start), '[]'::jsonb)
  into v_trend
  from months m
  left join service_receipts sr using (month_start)
  left join product_receipts pr using (month_start);

  select coalesce(jsonb_agg(jsonb_build_object(
    'service_id', ranked.service_id,
    'name', ranked.name,
    'quantity', ranked.quantity
  ) order by ranked.quantity desc, ranked.service_id), '[]'::jsonb)
  into v_services
  from (
    select i.service_id, i.service_name_snapshot as name, count(*) as quantity
    from public.appointment_items i
    join public.appointments a on a.id = i.appointment_id
    where a.status = 'COMPLETED' and a.starts_at >= v_start and a.starts_at < v_end
    group by i.service_id, i.service_name_snapshot
    order by quantity desc, i.service_id
    limit 5
  ) ranked;

  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', ranked.product_id,
    'name', ranked.name,
    'quantity', ranked.quantity
  ) order by ranked.quantity desc, ranked.product_id), '[]'::jsonb)
  into v_products
  from (
    select m.product_id, p.name, sum(-m.delta)::bigint as quantity
    from public.inventory_movements m
    join public.sales sa on sa.id = m.sale_id and sa.status = 'CONFIRMED'
    join public.products p on p.id = m.product_id
    where m.kind = 'SALE' and m.created_at >= v_start and m.created_at < v_end
    group by m.product_id, p.name
    order by quantity desc, m.product_id
    limit 5
  ) ranked;

  return jsonb_build_object(
    'month', to_char(p_month, 'YYYY-MM'),
    'timezone', 'America/Lima',
    'kpis', v_kpis,
    'trend', v_trend,
    'services', v_services,
    'products', v_products
  );
end;
$$;
notify pgrst, 'reload schema';
