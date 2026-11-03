-- Lectura paginada de catalogo con precio decimal en texto para Angular.
create function public.search_products(p_search text default '',p_page integer default 1,
 p_size integer default 10,p_active boolean default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;
begin
 perform private.require_work_permission('products.read');
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
revoke all on function public.search_products(text,integer,integer,boolean) from public,anon;
grant execute on function public.search_products(text,integer,integer,boolean) to authenticated;
