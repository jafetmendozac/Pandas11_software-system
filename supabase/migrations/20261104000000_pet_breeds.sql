-- Reemplaza pet_coat_type por pet_breeds (tabla de razas gestionable)
-- Se elimina el enum pet_coat_type y la columna de pets/service_prices.
-- Se añade tabla pet_breeds con CRUD para que el negocio agregue razas libremente.

CREATE TABLE "pet_breeds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL CHECK (length(btrim(name)) > 0),
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Mascotas: quitar pet_coat_type, convertir breed (text) en breed_id (FK opcional)
ALTER TABLE public.pets DROP COLUMN "pet_coat_type";
ALTER TABLE public.pets RENAME COLUMN "breed" TO "breed_id";
ALTER TABLE public.pets ALTER COLUMN "breed_id" DROP NOT NULL;
ALTER TABLE public.pets ADD CONSTRAINT fk_pets_breed FOREIGN KEY ("breed_id") REFERENCES public.pet_breeds(id);

-- Tarifas: quitar pet_coat_type, añadir pet_breed_id (FK opcional)
ALTER TABLE public.service_prices DROP COLUMN "pet_coat_type";
ALTER TABLE public.service_prices ADD COLUMN "pet_breed_id" uuid REFERENCES public.pet_breeds(id);
DROP INDEX IF EXISTS "uq_service_prices_rule";
CREATE UNIQUE INDEX "uq_service_prices_rule" ON "service_prices" ("service_id", "pet_size", "pet_breed_id") NULLS NOT DISTINCT;

-- Eliminar enum ya no usado
DROP TYPE IF EXISTS public.pet_coat_type;

-- RLS y permisos para pet_breeds
alter table public.pet_breeds enable row level security;
revoke all on public.pet_breeds from anon,authenticated;
grant select on public.pet_breeds to authenticated;
grant insert(name,active),update(name,active) on public.pet_breeds to authenticated;
create policy breeds_read on public.pet_breeds for select to authenticated using(public.has_permission('services.read') or true);
create policy breeds_manage on public.pet_breeds for all to authenticated using(public.has_permission('services.manage')) with check(public.has_permission('services.manage'));

-- Función de cotización ajustada: recibe breed_id en lugar de pet_coat_type
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
    where sp.service_id=s.id and (sp.pet_size is null or sp.pet_size=p_size) and (sp.pet_breed_id is null or sp.pet_breed_id=p_breed)
    order by case when sp.pet_size is not null and sp.pet_breed_id is not null then 1 when sp.pet_size is not null then 2 when sp.pet_breed_id is not null then 3 else 4 end
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

revoke all on function public.quote_service(uuid,public.pet_size,public.pet_coat_type) from public,anon;
grant execute on function public.quote_service(uuid,public.pet_size,uuid),public.search_services(text,integer,integer,boolean),public.search_service_prices(text,integer,integer) to authenticated;
