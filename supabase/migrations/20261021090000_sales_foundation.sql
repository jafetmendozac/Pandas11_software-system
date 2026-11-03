-- Actividad 4.1: registro interno de ventas; articulos solo en borrador hasta inventario.
create type public.sale_status as enum ('DRAFT','CONFIRMED','CANCELLED');
create type public.sale_item_kind as enum ('SERVICE','PRODUCT');

create table public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(btrim(name)) between 1 and 120),
 sku text unique check (sku is null or length(btrim(sku)) between 1 and 60),
 unit text not null default 'UNIT' check (unit='UNIT'),
 price numeric not null check (price>=0 and price<'Infinity'::numeric and price=round(price,2)),
 active boolean not null default true,
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp()
);

create table public.sales (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id),
 appointment_id uuid references public.appointments(id),
 status public.sale_status not null default 'DRAFT',
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
 constraint chk_sale_cancel check (
  (status='CANCELLED' and cancelled_by is not null and cancelled_at is not null and
   length(btrim(cancel_reason)) between 1 and 500)
  or (status<>'CANCELLED' and cancelled_by is null and cancelled_at is null and cancel_reason is null))
);
create unique index sales_one_active_appointment on public.sales(appointment_id)
 where appointment_id is not null and status<>'CANCELLED';
create index sales_created_page on public.sales(created_at desc,id desc);
create index sales_client on public.sales(client_id);

create table public.sale_items (
 id uuid primary key default gen_random_uuid(),
 sale_id uuid not null references public.sales(id),
 kind public.sale_item_kind not null,
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
create unique index sale_service_once on public.sale_items(sale_id,appointment_item_id) where appointment_item_id is not null;
create unique index sale_product_once on public.sale_items(sale_id,product_id) where product_id is not null;
create index sale_items_sale on public.sale_items(sale_id);

insert into public.permissions(code,description) values
 ('products.read','Consultar articulos comerciales'),('products.manage','Gestionar articulos comerciales'),
 ('sales.read','Consultar ventas internas'),('sales.manage','Registrar y gestionar ventas internas');
insert into public.role_permissions
select r.id,p.id from public.roles r cross join public.permissions p
where r.code in ('OWNER','ADMIN') and p.code in ('products.read','products.manage','sales.read','sales.manage');

alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
revoke all on public.products,public.sales,public.sale_items from anon,authenticated;
grant select on public.products,public.sales,public.sale_items to authenticated;
create policy products_read on public.products for select to authenticated using(public.has_permission('products.read'));
create policy sales_read on public.sales for select to authenticated using(public.has_permission('sales.read'));
create policy sale_items_read on public.sale_items for select to authenticated using(public.has_permission('sales.read'));

create function private.require_sales_permission(p_code text) returns void
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_work_permission('sales.read');
 perform private.require_work_permission(p_code);
end $$;

create function private.sale_json(p_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select to_jsonb(s)||jsonb_build_object(
  'total',s.total::text,
  'client_name',concat_ws(' ',c.first_name,c.last_name),
  'confirmed_appointment_payments',coalesce((select sum(p.amount) from public.payments p
   where p.appointment_id=s.appointment_id and p.status='PAID' and p.type in ('DEPOSIT','BALANCE')),0)::text,
  'requires_resolution',s.status='CANCELLED' and exists(select 1 from public.payments p
   where p.appointment_id=s.appointment_id and p.status='PAID' and p.type in ('DEPOSIT','BALANCE')),
  'items',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('unit_price',i.unit_price::text,
   'line_total',i.line_total::text) order by i.created_at,i.id) from public.sale_items i where i.sale_id=s.id),'[]'::jsonb))
 from public.sales s join public.clients c on c.id=s.client_id where s.id=p_id
$$;

create function public.save_product(p_id uuid,p_name text,p_sku text,p_price text,p_active boolean default true)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_id uuid; v_price numeric; v_name text:=btrim(p_name); v_sku text:=nullif(btrim(p_sku),'');
begin
 perform private.require_work_permission('products.manage');
 perform private.require_work_permission('products.read');
 if v_name is null or length(v_name) not between 1 and 120 or length(v_sku)>60 or
    p_price is null or p_price !~ '^[0-9]+([.][0-9]{1,2})?$' or p_active is null then
  raise exception 'Datos de articulo invalidos' using errcode='22023';
 end if;
 v_price:=p_price::numeric;
 if v_price>='Infinity'::numeric then raise exception 'Precio invalido' using errcode='22023'; end if;
 if p_id is null then
  insert into public.products(name,sku,price,active) values(v_name,v_sku,v_price,p_active) returning id into v_id;
 else
  update public.products set name=v_name,sku=v_sku,price=v_price,active=p_active,updated_at=clock_timestamp()
   where id=p_id returning id into v_id;
  if v_id is null then raise exception 'Articulo no encontrado' using errcode='22023'; end if;
 end if;
 return (select to_jsonb(p)||jsonb_build_object('price',p.price::text) from public.products p where p.id=v_id);
end $$;

create function public.create_sale_draft(p_input jsonb) returns jsonb
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
  select v_sale,'SERVICE',ai.id,ai.service_id,s.name,'UNIT',1,ai.price
  from public.appointment_items ai join public.services s on s.id=ai.service_id
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

create function public.get_sale(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;
begin
 perform private.require_sales_permission('sales.read');
 v_result:=private.sale_json(p_id);
 if v_result is null then raise exception 'Venta no encontrada' using errcode='22023'; end if;
 return v_result;
end $$;

create function public.search_sales(p_search text default '',p_page integer default 1,p_size integer default 10)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;
begin
 perform private.require_sales_permission('sales.read');
 with filtered as (
  select s.id,s.created_at from public.sales s join public.clients c on c.id=s.client_id
  where position(lower(coalesce(p_search,'')) in lower(concat_ws(' ',c.first_name,c.last_name,s.id::text,s.appointment_id::text)))>0),
 page as (select * from filtered order by created_at desc,id desc
  limit greatest(1,least(coalesce(p_size,10),100))
  offset (greatest(1,coalesce(p_page,1))-1)*greatest(1,least(coalesce(p_size,10),100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(private.sale_json(id) order by created_at desc,id desc) from page),'[]'::jsonb),
  'total',(select count(*) from filtered)) into v_result;
 return v_result;
end $$;

create function public.confirm_sale(p_id uuid,p_expected_version integer) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare v_sale public.sales; v_appointment public.appointments;
begin
 perform private.require_sales_permission('sales.manage');
 perform private.appointment_lock();
 perform private.require_sales_permission('sales.manage');
 select * into v_sale from public.sales where id=p_id;
 if not found then raise exception 'Venta no encontrada' using errcode='22023'; end if;
 if v_sale.version is distinct from p_expected_version then raise exception 'La venta cambio; recarga' using errcode='40001'; end if;
 if v_sale.status<>'DRAFT' or v_sale.appointment_id is null or
    exists(select 1 from public.sale_items where sale_id=p_id and kind='PRODUCT') or
    not exists(select 1 from public.sale_items where sale_id=p_id) then
  raise exception 'Solo se confirma venta de servicios de cita, sin articulos' using errcode='22023';
 end if;
 select * into v_appointment from public.appointments where id=v_sale.appointment_id;
 if v_appointment.status<>'COMPLETED' or v_sale.total<>v_appointment.total_price then
  raise exception 'La cita o el total ya no coincide' using errcode='22023';
 end if;
 update public.sales set status='CONFIRMED',updated_at=clock_timestamp(),version=version+1 where id=p_id;
 return private.sale_json(p_id);
end $$;

create function public.cancel_sale(p_id uuid,p_expected_version integer,p_reason text) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare v_sale public.sales; v_paid numeric;
begin
 perform private.require_sales_permission('sales.manage');
 perform private.appointment_lock();
 perform private.require_sales_permission('sales.manage');
 select * into v_sale from public.sales where id=p_id;
 if not found then raise exception 'Venta no encontrada' using errcode='22023'; end if;
 if v_sale.version is distinct from p_expected_version then raise exception 'La venta cambio; recarga' using errcode='40001'; end if;
 if v_sale.status='CANCELLED' or p_reason is null or length(btrim(p_reason)) not between 1 and 500 then
  raise exception 'Estado o motivo de anulacion invalido' using errcode='22023';
 end if;
 select coalesce(sum(amount),0) into v_paid from public.payments
  where appointment_id=v_sale.appointment_id and status='PAID' and type in ('DEPOSIT','BALANCE');
 if v_paid>0 and not exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id
  where ur.user_id=auth.uid() and r.code='OWNER' and r.active) then
  raise exception 'Solo OWNER anula ventas con cobro confirmado' using errcode='42501';
 end if;
 update public.sales set status='CANCELLED',cancelled_by=auth.uid(),cancelled_at=clock_timestamp(),
  cancel_reason=btrim(p_reason),updated_at=clock_timestamp(),version=version+1 where id=p_id;
 return private.sale_json(p_id);
end $$;

revoke all on function private.require_sales_permission(text),private.sale_json(uuid) from public,anon,authenticated;
revoke all on function public.save_product(uuid,text,text,text,boolean),public.create_sale_draft(jsonb),
 public.get_sale(uuid),public.search_sales(text,integer,integer),public.confirm_sale(uuid,integer),
 public.cancel_sale(uuid,integer,text) from public,anon;
grant execute on function public.save_product(uuid,text,text,text,boolean),public.create_sale_draft(jsonb),
 public.get_sale(uuid),public.search_sales(text,integer,integer),public.confirm_sale(uuid,integer),
 public.cancel_sale(uuid,integer,text) to authenticated;
