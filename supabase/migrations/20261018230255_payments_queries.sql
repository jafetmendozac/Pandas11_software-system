-- Selector financiero paginado: no requiere exponer fichas completas de agenda.
create function public.search_payment_appointments(p_search text default '',p_page integer default 1,p_size integer default 10)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_payment_permission('payments.read');
 with filtered as (select a.id,a.starts_at,a.status,a.total_price::text as total,concat_ws(' ',c.first_name,c.last_name) as client_name
 from public.appointments a join public.clients c on c.id=a.client_id where a.source='INTERNAL' and a.status='COMPLETED'
 and position(lower(coalesce(p_search,'')) in lower(concat_ws(' ',a.id::text,c.first_name,c.last_name)))>0),
 page as (select * from filtered order by starts_at desc,id desc limit greatest(1,least(coalesce(p_size,10),100)) offset (greatest(1,coalesce(p_page,1))-1)*greatest(1,least(coalesce(p_size,10),100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(page) order by starts_at desc,id desc) from page),'[]'::jsonb),'total',(select count(*) from filtered)) into result;
 return result;
end $$;
revoke all on function public.search_payment_appointments(text,integer,integer) from public,anon;
grant execute on function public.search_payment_appointments(text,integer,integer) to authenticated;

create function public.get_payment(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_payment_permission('payments.read');
 result:=private.payment_json(p_id);
 if result is null then raise exception 'Pago no encontrado' using errcode='22023'; end if;
 return result;
end $$;
revoke all on function public.get_payment(uuid) from public,anon;
grant execute on function public.get_payment(uuid) to authenticated;
