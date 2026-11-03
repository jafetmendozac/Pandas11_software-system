-- La pantalla de alertas necesita versión real para abrir el historial/registrar entradas.
create or replace function public.search_low_stock(p_search text default '',p_page integer default 1,p_size integer default 10) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_sales_permission('inventory.read');
 perform private.require_sales_permission('products.read');
 with filtered as (
  select p.id,p.name,b.quantity,b.version as balance_version,b.initial_loaded
  from public.products p join public.inventory_balances b on b.product_id=p.id
  where p.minimum_stock is not null and b.quantity<=p.minimum_stock
   and position(lower(coalesce(p_search,'')) in lower(concat_ws(' ',p.name,p.sku)))>0),
 page as (select * from filtered order by name,id limit greatest(1,least(coalesce(p_size,10),100))
  offset (greatest(1,coalesce(p_page,1))-1)*greatest(1,least(coalesce(p_size,10),100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('price',p.price::text,
   'quantity',page.quantity,'balance_version',page.balance_version,'initial_loaded',page.initial_loaded)
  order by page.name,page.id) from page join public.products p on p.id=page.id),'[]'::jsonb),
  'total',(select count(*) from filtered)) into result;
 return result;
end $$;
