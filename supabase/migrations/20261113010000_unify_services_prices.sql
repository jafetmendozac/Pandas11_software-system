-- Unifica la gestión comercial: las tarifas varían solo por tamaño.
-- Detener la migración antes de elegir o borrar silenciosamente una tarifa por raza.
do $$ begin
  if exists (select 1 from public.service_prices where pet_breed_id is not null) then
    raise exception 'Existen tarifas por raza; conciliar sus precios antes de retirar pet_breed_id';
  end if;
end $$;

-- Una eventual regla general vigente reemplaza los valores base antes de retirarse.
update public.services s
set base_price=sp.price,base_duration_minutes=sp.duration_minutes
from public.service_prices sp
where sp.service_id=s.id and sp.pet_size is null and sp.pet_breed_id is null;
delete from public.service_prices where pet_size is null;

drop index public.uq_service_prices_rule;
alter table public.service_prices drop column pet_breed_id;
alter table public.service_prices alter column pet_size set not null;
create unique index uq_service_prices_rule on public.service_prices(service_id,pet_size);

-- Retirar la firma pública anterior evita argumentos predeterminados ambiguos.
drop function public.quote_service(uuid,public.pet_size,uuid);

create function public.quote_service(p_service_id uuid,p_size public.pet_size default null)
returns jsonb language plpgsql stable set search_path='' as $$
declare result jsonb;
begin
 select jsonb_build_object(
  'service_id',s.id,'price',coalesce(r.price,s.base_price)::text,
  'duration_minutes',coalesce(r.duration_minutes,s.base_duration_minutes),
  'rule_id',r.id,'source',case when r.id is null then 'BASE' else 'SIZE' end) into result
 from public.services s
 left join public.service_prices r on r.service_id=s.id and r.pet_size=p_size
 where s.id=p_service_id and s.active
  and (public.has_permission('services.read') or private.catalog_visible(s.id));
 if result is null then raise exception 'Servicio no disponible para calcular' using errcode='42501'; end if;
 if public.has_permission('services.read') and not public.has_permission('service_prices.read') and not private.catalog_visible(p_service_id) then
  raise exception 'Sin permiso para consultar tarifas de este servicio' using errcode='42501';
 end if;
 return result;
end $$;

-- Compatibilidad interna para save_internal_appointment, cuya definición histórica
-- todavía envía breed_id. El tercer argumento se ignora y no se expone a authenticated.
create function public.quote_service(p_service_id uuid,p_size public.pet_size,p_ignored_breed uuid)
returns jsonb language sql stable set search_path='' as $$
 select public.quote_service(p_service_id,p_size)
$$;

revoke all on function public.quote_service(uuid,public.pet_size),public.quote_service(uuid,public.pet_size,uuid) from public,anon,authenticated;
grant execute on function public.quote_service(uuid,public.pet_size) to authenticated;
