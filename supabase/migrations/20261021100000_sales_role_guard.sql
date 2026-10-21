-- RN-21: un permiso delegado no convierte un rol personalizado en OWNER/ADMIN.
create function private.sales_operator() returns boolean
language sql stable security definer set search_path='' as $$
 select private.is_active() and exists(
  select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id
  where ur.user_id=auth.uid() and r.active and r.code in ('OWNER','ADMIN'))
$$;
revoke all on function private.sales_operator() from public,anon;
grant execute on function private.sales_operator() to authenticated;

drop policy products_read on public.products;
drop policy sales_read on public.sales;
drop policy sale_items_read on public.sale_items;
create policy products_read on public.products for select to authenticated
 using(private.sales_operator() and public.has_permission('products.read'));
create policy sales_read on public.sales for select to authenticated
 using(private.sales_operator() and public.has_permission('sales.read'));
create policy sale_items_read on public.sale_items for select to authenticated
 using(private.sales_operator() and public.has_permission('sales.read'));

create or replace function private.require_sales_permission(p_code text) returns void
language plpgsql stable security definer set search_path='' as $$
begin
 if not private.sales_operator() then
  raise exception 'Solo OWNER o ADMIN acceden a ventas' using errcode='42501';
 end if;
 perform private.require_work_permission('sales.read');
 perform private.require_work_permission(p_code);
end $$;

create or replace function public.save_product(p_id uuid,p_name text,p_sku text,p_price text,p_active boolean default true)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_id uuid; v_price numeric; v_name text:=btrim(p_name); v_sku text:=nullif(btrim(p_sku),'');
begin
 perform private.require_sales_permission('products.manage');
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

create or replace function public.search_products(p_search text default '',p_page integer default 1,
 p_size integer default 10,p_active boolean default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;
begin
 perform private.require_sales_permission('products.read');
 with filtered as (
  select p.id,p.name from public.products p
  where (p_active is null or p.active=p_active)
   and position(lower(coalesce(p_search,'')) in lower(concat_ws(' ',p.name,p.sku)))>0),
 page as (select * from filtered order by name,id limit greatest(1,least(coalesce(p_size,10),100))
  offset (greatest(1,coalesce(p_page,1))-1)*greatest(1,least(coalesce(p_size,10),100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('price',p.price::text)
  order by page.name,page.id) from page join public.products p on p.id=page.id),'[]'::jsonb),
  'total',(select count(*) from filtered)) into v_result;
 return v_result;
end $$;
