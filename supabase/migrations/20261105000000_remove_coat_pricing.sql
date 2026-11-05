-- Corrección del modelo comercial: pelaje no es una dimensión de tarifa.
-- Se eliminan únicamente reglas definidas por esa dimensión; no se infiere raza.
delete from public.service_prices where pet_coat_type is not null;

drop index public.uq_service_prices_rule;
alter table public.service_prices drop column pet_coat_type;
alter table public.pets drop column pet_coat_type;
drop type public.pet_coat_type;

create unique index uq_service_prices_rule on public.service_prices
 (service_id,pet_size,pet_breed_id) nulls not distinct;

-- Mantener la misma prioridad por tamaño/raza sin depender de la columna retirada.
create or replace function public.quote_service(p_service_id uuid,p_size public.pet_size default null,p_breed uuid default null)
returns jsonb language plpgsql stable set search_path='' as $$
declare result jsonb;
begin
 select jsonb_build_object(
  'service_id',s.id,'price',coalesce(r.price,s.base_price)::text,
  'duration_minutes',coalesce(r.duration_minutes,s.base_duration_minutes),
  'rule_id',r.id,'source',coalesce(r.source,'BASE')) into result
 from public.services s
 left join lateral (
  select sp.*,case
   when sp.pet_size is not null and sp.pet_breed_id is not null then 'SIZE_BREED'
   when sp.pet_size is not null then 'SIZE'
   when sp.pet_breed_id is not null then 'BREED' else 'GENERAL' end as source
  from public.service_prices sp
  where sp.service_id=s.id
   and (sp.pet_size is null or sp.pet_size=p_size)
   and (sp.pet_breed_id is null or sp.pet_breed_id=p_breed)
  order by case when sp.pet_size is not null and sp.pet_breed_id is not null then 1
   when sp.pet_size is not null then 2 when sp.pet_breed_id is not null then 3 else 4 end
  limit 1
 ) r on true
 where s.id=p_service_id and s.active
  and (public.has_permission('services.read') or private.catalog_visible(s.id));
 if result is null then raise exception 'Servicio no disponible para calcular' using errcode='42501'; end if;
 if public.has_permission('services.read') and not public.has_permission('service_prices.read') and not private.catalog_visible(p_service_id) then
  raise exception 'Sin permiso para consultar tarifas de este servicio' using errcode='42501';
 end if;
 return result;
end $$;
