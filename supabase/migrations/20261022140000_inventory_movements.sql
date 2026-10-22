-- INV-D01–D05 aprobadas: un local, unidades enteras, sin stock negativo.
create table public.inventory_balances (
 product_id uuid primary key references public.products(id) on delete cascade,
 quantity integer not null default 0 check(quantity>=0),
 initial_loaded boolean not null default false,
 version integer not null default 1 check(version>0)
);
create table public.inventory_movements (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id),
 kind text not null check(kind in ('INITIAL','RECEIPT','ADJUSTMENT','SALE','CANCELLATION')),
 delta integer not null check(delta<>0),
 balance_before integer not null check(balance_before>=0),
 balance_after integer not null check(balance_after>=0),
 reason text not null check(length(btrim(reason)) between 1 and 500),
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default clock_timestamp(),
 sale_id uuid references public.sales(id),
 sale_item_id uuid references public.sale_items(id),
 request_id uuid unique,
 request_payload jsonb,
 constraint inventory_arithmetic check(balance_after::bigint=balance_before::bigint+delta),
 constraint inventory_source check(
  (kind in ('SALE','CANCELLATION') and sale_id is not null and sale_item_id is not null and request_id is null and request_payload is null)
  or (kind in ('INITIAL','RECEIPT','ADJUSTMENT') and sale_id is null and sale_item_id is null and request_id is not null and request_payload is not null)),
 constraint inventory_sign check(kind='ADJUSTMENT' or (kind='SALE' and delta<0) or (kind<>'SALE' and delta>0))
);
create unique index inventory_sale_once on public.inventory_movements(sale_item_id,kind) where sale_item_id is not null;
create index inventory_history on public.inventory_movements(product_id,created_at desc,id desc);
create index inventory_sale on public.inventory_movements(sale_id);
insert into public.inventory_balances(product_id) select id from public.products;
create function private.initialize_inventory() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.inventory_balances(product_id) values(new.id); return new; end $$;
revoke all on function private.initialize_inventory() from public,anon,authenticated;
create trigger product_inventory after insert on public.products for each row execute function private.initialize_inventory();

alter table public.sales add column inventory_disposition text check(inventory_disposition in ('RESTOCK','NO_RESTOCK'));
alter table public.sales add constraint sale_inventory_disposition check(inventory_disposition is null or status='CANCELLED');
-- cancelled_by/at/reason también registran actor/fecha/motivo de la disposición.
insert into public.permissions(code,description) values
 ('inventory.read','Consultar existencias e historial'),('inventory.receive','Registrar entradas de inventario'),('inventory.adjust','Ajustar existencias');
insert into public.role_permissions select r.id,p.id from public.roles r cross join public.permissions p
 where (r.code in ('OWNER','ADMIN') and p.code in ('inventory.read','inventory.receive')) or (r.code='OWNER' and p.code='inventory.adjust');
create function private.inventory_owner() returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active() and exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id
 where ur.user_id=auth.uid() and r.active and r.code='OWNER')
$$;
revoke all on function private.inventory_owner() from public,anon,authenticated;
alter table public.inventory_balances enable row level security;
alter table public.inventory_movements enable row level security;
revoke all on public.inventory_balances,public.inventory_movements from public,anon,authenticated;
grant select on public.inventory_balances,public.inventory_movements to authenticated;
create policy inventory_balances_read on public.inventory_balances for select to authenticated
 using(private.sales_operator() and public.has_permission('sales.read') and public.has_permission('inventory.read'));
create policy inventory_movements_read on public.inventory_movements for select to authenticated
 using(private.sales_operator() and public.has_permission('sales.read') and public.has_permission('inventory.read'));

create function public.search_inventory(p_search text default '',p_page integer default 1,p_size integer default 10)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_sales_permission('inventory.read');
 with filtered as(select b.*,p.name,p.sku,p.active from public.inventory_balances b join public.products p on p.id=b.product_id
 where position(lower(coalesce(p_search,'')) in lower(concat_ws(' ',p.name,p.sku)))>0),
 page as(select * from filtered order by name,product_id limit greatest(1,least(coalesce(p_size,10),100))
 offset (greatest(1,coalesce(p_page,1))-1)*greatest(1,least(coalesce(p_size,10),100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(page) order by name,product_id) from page),'[]'::jsonb),
 'total',(select count(*) from filtered),'can_adjust',private.inventory_owner() and public.has_permission('inventory.adjust')) into result;
 return result;
end $$;

create function public.search_inventory_movements(p_product_id uuid default null,p_kind text default null,
 p_from timestamptz default null,p_until timestamptz default null,p_sale_id uuid default null,
 p_page integer default 1,p_size integer default 10)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_sales_permission('inventory.read');
 if (p_from is not null and not isfinite(p_from)) or (p_until is not null and not isfinite(p_until))
 or (p_from is not null and p_until is not null and p_until<=p_from) then raise exception 'Rango de historial invalido' using errcode='22023'; end if;
 with filtered as(select m.*,p.name as product_name,concat_ws(' ',pr.first_name,pr.last_name) as actor_name
 from public.inventory_movements m join public.products p on p.id=m.product_id join public.profiles pr on pr.id=m.created_by
 where (p_product_id is null or m.product_id=p_product_id) and (p_kind is null or m.kind=p_kind)
 and (p_from is null or m.created_at>=p_from) and (p_until is null or m.created_at<p_until)
 and (p_sale_id is null or m.sale_id=p_sale_id)),
 page as(select * from filtered order by created_at desc,id desc limit greatest(1,least(coalesce(p_size,10),100))
 offset (greatest(1,coalesce(p_page,1))-1)*greatest(1,least(coalesce(p_size,10),100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc,id desc) from page),'[]'::jsonb),
 'total',(select count(*) from filtered)) into result;
 return result;
end $$;

create function public.record_inventory_movement(p_input jsonb) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare v_product uuid; v_request uuid; v_kind text; v_delta integer; v_reason text;
 v_old public.inventory_movements; v_balance public.inventory_balances; v_id uuid; v_after bigint;
begin
 perform private.require_sales_permission('inventory.read');
 perform private.appointment_lock();
 perform private.require_sales_permission('inventory.read');
 if p_input is null or jsonb_typeof(p_input)<>'object' or
 p_input-array['product_id','request_id','kind','delta','reason','expected_version']<>'{}'::jsonb or
 coalesce(p_input->>'delta','') !~ '^-?[1-9][0-9]{0,9}$' or
 coalesce(p_input->>'expected_version','') !~ '^[1-9][0-9]{0,9}$' then
 raise exception 'Datos de movimiento invalidos' using errcode='22023'; end if;
 v_product:=(p_input->>'product_id')::uuid; v_request:=(p_input->>'request_id')::uuid;
 v_kind:=p_input->>'kind'; v_delta:=(p_input->>'delta')::integer; v_reason:=btrim(p_input->>'reason');
 if v_product is null or v_request is null or v_kind is null or v_kind not in ('INITIAL','RECEIPT','ADJUSTMENT') or
 v_reason is null or length(v_reason) not between 1 and 500 or (v_kind<>'ADJUSTMENT' and v_delta<1) then
 raise exception 'Tipo, cantidad o motivo invalido' using errcode='22023'; end if;
 if v_kind='ADJUSTMENT' then
  perform private.require_sales_permission('inventory.adjust');
  if not private.inventory_owner() then raise exception 'Solo OWNER ajusta inventario' using errcode='42501'; end if;
 else perform private.require_sales_permission('inventory.receive'); end if;
 select * into v_old from public.inventory_movements where request_id=v_request;
 if found then
  if v_old.created_by<>auth.uid() or v_old.request_payload<>p_input then raise exception 'Reintento con otro contenido o autor' using errcode='22023'; end if;
  return to_jsonb(v_old);
 end if;
 -- Producto antes de saldo; confirmación y anulación siguen el mismo orden.
 perform 1 from public.products where id=v_product and active for update;
 if not found then raise exception 'Producto no disponible' using errcode='22023'; end if;
 select * into v_balance from public.inventory_balances where product_id=v_product for update;
 if v_balance.version is distinct from (p_input->>'expected_version')::integer then raise exception 'El inventario cambio; recarga' using errcode='40001'; end if;
 if v_kind='INITIAL' and (v_balance.initial_loaded or v_balance.version<>1) then raise exception 'La carga inicial ya no esta disponible' using errcode='22023'; end if;
 v_after:=v_balance.quantity::bigint+v_delta;
 if v_after<0 or v_after>2147483647 then raise exception 'Stock insuficiente o fuera de rango' using errcode='22023'; end if;
 insert into public.inventory_movements(product_id,kind,delta,balance_before,balance_after,reason,created_by,request_id,request_payload)
 values(v_product,v_kind,v_delta,v_balance.quantity,v_after::integer,v_reason,auth.uid(),v_request,p_input) returning id into v_id;
 update public.inventory_balances set quantity=v_after::integer,initial_loaded=initial_loaded or v_kind='INITIAL',version=version+1 where product_id=v_product;
 return (select to_jsonb(m) from public.inventory_movements m where id=v_id);
end $$;

-- Confirmación comercial y salida de stock son una sola transacción.
create or replace function public.confirm_sale(p_id uuid,p_expected_version integer) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare s public.sales; a public.appointments; i public.sale_items; b public.inventory_balances; v_services numeric;
begin
 perform private.require_sales_permission('sales.manage'); perform private.appointment_lock();
 perform private.require_sales_permission('sales.manage');
 select * into s from public.sales where id=p_id;
 if not found then raise exception 'Venta no encontrada' using errcode='22023'; end if;
 if s.status='CONFIRMED' and s.version=p_expected_version+1 then return private.sale_json(p_id); end if;
 if s.version is distinct from p_expected_version then raise exception 'La venta cambio; recarga' using errcode='40001'; end if;
 if s.status<>'DRAFT' or not exists(select 1 from public.sale_items where sale_id=p_id) then raise exception 'La venta no es un borrador con detalle' using errcode='22023'; end if;
 if not exists(select 1 from public.clients where id=s.client_id and deleted_at is null) then raise exception 'Cliente no disponible' using errcode='22023'; end if;
 if s.total<>(select sum(line_total) from public.sale_items where sale_id=p_id) then raise exception 'Total de venta inconsistente' using errcode='22023'; end if;
 if s.appointment_id is not null then
  select * into a from public.appointments where id=s.appointment_id;
  select coalesce(sum(line_total),0) into v_services from public.sale_items where sale_id=p_id and kind='SERVICE';
  if a.status<>'COMPLETED' or a.source<>'INTERNAL' or a.client_id<>s.client_id or v_services<>a.total_price then
   raise exception 'La cita o subtotal de servicios cambio' using errcode='22023'; end if;
 elsif exists(select 1 from public.sale_items where sale_id=p_id and kind='SERVICE') then raise exception 'Servicio sin cita' using errcode='22023'; end if;
 -- Orden determinista compartido: mutex, productos por UUID y luego saldos.
 perform 1 from public.products p where p.id in(select product_id from public.sale_items where sale_id=p_id and kind='PRODUCT') order by p.id for update;
 for i in select * from public.sale_items where sale_id=p_id and kind='PRODUCT' order by product_id loop
  if not exists(select 1 from public.products where id=i.product_id and active) then raise exception 'Producto inactivo' using errcode='22023'; end if;
  select * into b from public.inventory_balances where product_id=i.product_id for update;
  if not found or b.quantity<i.quantity then raise exception 'Stock insuficiente para %',i.description using errcode='22023'; end if;
  insert into public.inventory_movements(product_id,kind,delta,balance_before,balance_after,reason,created_by,sale_id,sale_item_id)
  values(i.product_id,'SALE',-i.quantity,b.quantity,b.quantity-i.quantity,'Confirmacion de venta',auth.uid(),p_id,i.id);
  update public.inventory_balances set quantity=quantity-i.quantity,version=version+1 where product_id=i.product_id;
 end loop;
 update public.sales set status='CONFIRMED',updated_at=clock_timestamp(),version=version+1 where id=p_id;
 return private.sale_json(p_id);
end $$;

-- Sustituir firma anterior: omitir disposición nunca permite cancelar artículos confirmados.
drop function public.cancel_sale(uuid,integer,text);
create function public.cancel_sale(p_id uuid,p_expected_version integer,p_reason text,p_disposition text default null) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare s public.sales; v_paid numeric; v_products boolean; i public.sale_items; b public.inventory_balances; v_after bigint;
begin
 perform private.require_sales_permission('sales.manage'); perform private.appointment_lock();
 perform private.require_sales_permission('sales.manage');
 select * into s from public.sales where id=p_id;
 if not found then raise exception 'Venta no encontrada' using errcode='22023'; end if;
 if p_reason is null or length(btrim(p_reason)) not between 1 and 500 then raise exception 'Motivo invalido' using errcode='22023'; end if;
 if s.status='CANCELLED' and s.version=p_expected_version+1 and s.cancelled_by=auth.uid()
 and s.cancel_reason=btrim(p_reason) and s.inventory_disposition is not distinct from p_disposition then return private.sale_json(p_id); end if;
 if s.version is distinct from p_expected_version then raise exception 'La venta cambio; recarga' using errcode='40001'; end if;
 if s.status='CANCELLED' then raise exception 'Venta ya anulada' using errcode='22023'; end if;
 v_products:=s.status='CONFIRMED' and exists(select 1 from public.sale_items where sale_id=p_id and kind='PRODUCT');
 if v_products then
  if not private.inventory_owner() then raise exception 'Solo OWNER anula productos confirmados' using errcode='42501'; end if;
  if p_disposition is null or p_disposition not in ('RESTOCK','NO_RESTOCK') then raise exception 'Indica si la mercaderia vuelve al inventario' using errcode='22023'; end if;
 elsif p_disposition is not null then raise exception 'Disposicion no aplicable' using errcode='22023'; end if;
 select coalesce(sum(amount),0) into v_paid from public.payments where appointment_id=s.appointment_id and status='PAID' and type in ('DEPOSIT','BALANCE');
 if v_paid>0 and not private.inventory_owner() then raise exception 'Solo OWNER anula ventas con cobro confirmado' using errcode='42501'; end if;
 if v_products and p_disposition='RESTOCK' then
  perform 1 from public.products p where p.id in(select product_id from public.sale_items where sale_id=p_id and kind='PRODUCT') order by p.id for update;
  for i in select * from public.sale_items where sale_id=p_id and kind='PRODUCT' order by product_id loop
   select * into b from public.inventory_balances where product_id=i.product_id for update;
   v_after:=b.quantity::bigint+i.quantity;
   if v_after>2147483647 then raise exception 'Stock fuera de rango al reponer' using errcode='22023'; end if;
   insert into public.inventory_movements(product_id,kind,delta,balance_before,balance_after,reason,created_by,sale_id,sale_item_id)
   values(i.product_id,'CANCELLATION',i.quantity,b.quantity,v_after::integer,btrim(p_reason),auth.uid(),p_id,i.id);
   update public.inventory_balances set quantity=v_after::integer,version=version+1 where product_id=i.product_id;
  end loop;
 end if;
 update public.sales set status='CANCELLED',cancelled_by=auth.uid(),cancelled_at=clock_timestamp(),cancel_reason=btrim(p_reason),inventory_disposition=p_disposition,updated_at=clock_timestamp(),version=version+1 where id=p_id;
 return private.sale_json(p_id);
end $$;

create or replace function private.sale_json(p_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select to_jsonb(s)||jsonb_build_object(
  'total',s.total::text,
  'can_cancel_products',private.inventory_owner() and public.has_permission('sales.manage'),
  'client_name',concat_ws(' ',c.first_name,c.last_name),
  'confirmed_appointment_payments',coalesce((select sum(p.amount) from public.payments p
   where p.appointment_id=s.appointment_id and p.status='PAID' and p.type in ('DEPOSIT','BALANCE')),0)::text,
  'requires_resolution',s.status='CANCELLED' and exists(select 1 from public.payments p
   where p.appointment_id=s.appointment_id and p.status='PAID' and p.type in ('DEPOSIT','BALANCE')),
  'items',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('unit_price',i.unit_price::text,
   'line_total',i.line_total::text) order by i.created_at,i.id) from public.sale_items i where i.sale_id=s.id),'[]'::jsonb))
 from public.sales s join public.clients c on c.id=s.client_id where s.id=p_id
$$;


revoke all on function public.search_inventory(text,integer,integer),
 public.search_inventory_movements(uuid,text,timestamptz,timestamptz,uuid,integer,integer),
 public.record_inventory_movement(jsonb),public.cancel_sale(uuid,integer,text,text) from public,anon;
grant execute on function public.search_inventory(text,integer,integer),
 public.search_inventory_movements(uuid,text,timestamptz,timestamptz,uuid,integer,integer),
 public.record_inventory_movement(jsonb),public.cancel_sale(uuid,integer,text,text) to authenticated;
