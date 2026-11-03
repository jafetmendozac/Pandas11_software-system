-- Revalidación después de posibles esperas por actualizaciones del catálogo.
create or replace function public.record_inventory_movement(p_input jsonb) returns jsonb
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
 -- Revalidar también si un cambio de catálogo nos hizo esperar por la fila.
 perform private.require_sales_permission('inventory.read');
 if v_kind='ADJUSTMENT' then
  perform private.require_sales_permission('inventory.adjust');
  if not private.inventory_owner() then raise exception 'Solo OWNER ajusta inventario' using errcode='42501'; end if;
 else perform private.require_sales_permission('inventory.receive'); end if;
 if v_balance.version is distinct from (p_input->>'expected_version')::integer then raise exception 'El inventario cambio; recarga' using errcode='40001'; end if;
 if v_kind='INITIAL' and (v_balance.initial_loaded or v_balance.version<>1) then raise exception 'La carga inicial ya no esta disponible' using errcode='22023'; end if;
 v_after:=v_balance.quantity::bigint+v_delta;
 if v_after<0 or v_after>2147483647 then raise exception 'Stock insuficiente o fuera de rango' using errcode='22023'; end if;
 insert into public.inventory_movements(product_id,kind,delta,balance_before,balance_after,reason,created_by,request_id,request_payload)
 values(v_product,v_kind,v_delta,v_balance.quantity,v_after::integer,v_reason,auth.uid(),v_request,p_input) returning id into v_id;
 update public.inventory_balances set quantity=v_after::integer,initial_loaded=initial_loaded or v_kind='INITIAL',version=version+1 where product_id=v_product;
 return (select to_jsonb(m) from public.inventory_movements m where id=v_id);
end $$;

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
 perform private.require_sales_permission('sales.manage');
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

create or replace function public.cancel_sale(p_id uuid,p_expected_version integer,p_reason text,p_disposition text default null) returns jsonb
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
  perform private.require_sales_permission('sales.manage');
  if not private.inventory_owner() then raise exception 'Solo OWNER anula productos confirmados' using errcode='42501'; end if;
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

