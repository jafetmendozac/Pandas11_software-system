-- Mínimos informativos: los artículos existentes quedan sin umbral.
alter table public.products add column minimum_stock integer check(minimum_stock>=0);

create function public.set_product_minimum(p_id uuid,p_minimum integer) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare v_product public.products;
begin
 perform private.require_sales_permission('products.manage');
 if p_id is null or (p_minimum is not null and p_minimum<0) then
  raise exception 'Mínimo inválido' using errcode='22023'; end if;
 perform private.appointment_lock();
 perform private.require_sales_permission('products.manage');
 select * into v_product from public.products where id=p_id for update;
 if not found then raise exception 'Producto no encontrado' using errcode='22023'; end if;
 perform private.require_sales_permission('products.manage');
 update public.products set minimum_stock=p_minimum,updated_at=clock_timestamp() where id=p_id;
 return (select to_jsonb(p)||jsonb_build_object('price',p.price::text) from public.products p where p.id=p_id);
end $$;

create function public.search_low_stock(p_search text default '',p_page integer default 1,p_size integer default 10) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_sales_permission('inventory.read');
 perform private.require_sales_permission('products.read');
 with filtered as (
  select p.id,p.name,b.quantity from public.products p join public.inventory_balances b on b.product_id=p.id
  where p.minimum_stock is not null and b.quantity<=p.minimum_stock
   and position(lower(coalesce(p_search,'')) in lower(concat_ws(' ',p.name,p.sku)))>0),
 page as (select * from filtered order by name,id limit greatest(1,least(coalesce(p_size,10),100))
  offset (greatest(1,coalesce(p_page,1))-1)*greatest(1,least(coalesce(p_size,10),100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('price',p.price::text,'quantity',page.quantity)
  order by page.name,page.id) from page join public.products p on p.id=page.id),'[]'::jsonb),
  'total',(select count(*) from filtered)) into result;
 return result;
end $$;

revoke all on function public.set_product_minimum(uuid,integer),public.search_low_stock(text,integer,integer) from public,anon;
grant execute on function public.set_product_minimum(uuid,integer),public.search_low_stock(text,integer,integer) to authenticated;
