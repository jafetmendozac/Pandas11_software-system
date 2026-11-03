-- Conserva bloqueo y autorización del umbral sin variable de fila innecesaria.
create or replace function public.set_product_minimum(p_id uuid,p_minimum integer) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
begin
 perform private.require_sales_permission('products.manage');
 if p_id is null or (p_minimum is not null and p_minimum<0) then
  raise exception 'Mínimo inválido' using errcode='22023'; end if;
 perform private.appointment_lock();
 perform private.require_sales_permission('products.manage');
 perform 1 from public.products where id=p_id for update;
 if not found then raise exception 'Producto no encontrado' using errcode='22023'; end if;
 perform private.require_sales_permission('products.manage');
 update public.products set minimum_stock=p_minimum,updated_at=clock_timestamp() where id=p_id;
 return (select to_jsonb(p)||jsonb_build_object('price',p.price::text) from public.products p where p.id=p_id);
end $$;
