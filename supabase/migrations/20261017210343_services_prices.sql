-- Fase 2: modelo aprobado, sin reset de datos locales.
CREATE TABLE "services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL CHECK (length(btrim(name)) > 0),
  "description" text,
  "base_price" numeric NOT NULL CHECK (base_price >= 0 AND base_price < 'Infinity'::numeric AND base_price = round(base_price,2)),
  "base_duration_minutes" integer NOT NULL CHECK (base_duration_minutes > 0),
  "requires_specialist" boolean NOT NULL DEFAULT false,
  "visible_to_clients" boolean NOT NULL DEFAULT true,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "service_prices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "service_id" uuid NOT NULL,
  "pet_size" pet_size,
  "pet_coat_type" pet_coat_type,
  "price" numeric NOT NULL,
  "duration_minutes" integer NOT NULL,
  CONSTRAINT "chk_sp_price" CHECK (price >= 0 AND price < 'Infinity'::numeric AND price = round(price,2)),
  CONSTRAINT "chk_sp_duration" CHECK (duration_minutes > 0)
);

ALTER TABLE "service_prices" ADD FOREIGN KEY ("service_id") REFERENCES "services" ("id");

CREATE UNIQUE INDEX "uq_service_prices_rule" ON "service_prices" ("service_id", "pet_size", "pet_coat_type") NULLS NOT DISTINCT;

insert into public.permissions(code,description) values
 ('services.read','Consultar catálogo de servicios'),('services.manage','Administrar servicios'),
 ('service_prices.read','Consultar tarifas'),('service_prices.manage','Administrar tarifas');
insert into public.role_permissions select r.id,p.id from public.roles r cross join public.permissions p
where p.code in ('services.read','services.manage','service_prices.read','service_prices.manage')
and (r.code in ('OWNER','ADMIN') or (r.code='STAFF' and p.code in ('services.read','service_prices.read')));

create function private.catalog_visible(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active() and exists(select 1 from public.services where id=p_id and active and visible_to_clients)
$$;
alter table public.services enable row level security;
alter table public.service_prices enable row level security;
revoke all on public.services,public.service_prices from anon,authenticated;
grant select on public.services,public.service_prices to authenticated;
grant insert(name,description,base_price,base_duration_minutes,requires_specialist,visible_to_clients,active),
 update(name,description,base_price,base_duration_minutes,requires_specialist,visible_to_clients,active) on public.services to authenticated;
grant insert(service_id,pet_size,pet_coat_type,price,duration_minutes),update(service_id,pet_size,pet_coat_type,price,duration_minutes),delete on public.service_prices to authenticated;
create policy services_read on public.services for select to authenticated using(public.has_permission('services.read') or private.catalog_visible(id));
create policy services_create on public.services for insert to authenticated with check(public.has_permission('services.manage'));
create policy services_edit on public.services for update to authenticated using(public.has_permission('services.manage')) with check(public.has_permission('services.manage'));
create policy prices_read on public.service_prices for select to authenticated using(public.has_permission('service_prices.read') or private.catalog_visible(service_id));
create policy prices_create on public.service_prices for insert to authenticated with check(public.has_permission('service_prices.manage'));
create policy prices_edit on public.service_prices for update to authenticated using(public.has_permission('service_prices.manage')) with check(public.has_permission('service_prices.manage'));
create policy prices_delete on public.service_prices for delete to authenticated using(public.has_permission('service_prices.manage'));
create trigger stamp_services before update on public.services for each row execute function private.stamp_domain();

-- Toda cotización es una única consulta/snapshot, sin mezclar campos de reglas distintas.
create function public.quote_service(p_service_id uuid,p_size public.pet_size default null,p_coat public.pet_coat_type default null)
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
   when sp.pet_size is not null and sp.pet_coat_type is not null then 'SIZE_COAT'
   when sp.pet_size is not null then 'SIZE'
   when sp.pet_coat_type is not null then 'COAT' else 'GENERAL' end as source
  from public.service_prices sp
  where sp.service_id=s.id and (sp.pet_size is null or sp.pet_size=p_size) and (sp.pet_coat_type is null or sp.pet_coat_type=p_coat)
  order by case when sp.pet_size is not null and sp.pet_coat_type is not null then 1 when sp.pet_size is not null then 2 when sp.pet_coat_type is not null then 3 else 4 end
  limit 1
 ) r on true
 where s.id=p_service_id and s.active
   and (public.has_permission('services.read') or private.catalog_visible(s.id));
 if result is null then raise exception 'Servicio no disponible para calcular' using errcode='42501'; end if;
 -- Invoker/RLS: si puede ver servicio pero no sus tarifas, no devolver una base engañosa.
 if public.has_permission('services.read') and not public.has_permission('service_prices.read') and not private.catalog_visible(p_service_id) then
  raise exception 'Sin permiso para consultar tarifas de este servicio' using errcode='42501';
 end if;
 return result;
end $$;
create function public.search_services(p_search text default '',p_page integer default 1,p_size integer default 10,p_active boolean default null)
returns jsonb language sql stable set search_path='' as $$
 with filtered as (select s.* from public.services s where (p_active is null or s.active=p_active)
  and position(lower(coalesce(p_search,'')) in lower(concat_ws(' ',s.name,s.description)))>0),
 page as (select * from filtered order by name,id limit greatest(1,least(p_size,100)) offset (greatest(1,p_page)-1)*greatest(1,least(p_size,100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(page)||jsonb_build_object('base_price',base_price::text)) from page),'[]'::jsonb),'total',(select count(*) from filtered))
$$;
create function public.search_service_prices(p_search text default '',p_page integer default 1,p_size integer default 10)
returns jsonb language sql stable set search_path='' as $$
 with filtered as (select sp.*,s.name as service_name from public.service_prices sp join public.services s on s.id=sp.service_id
  where position(lower(coalesce(p_search,'')) in lower(s.name))>0),
 page as (select * from filtered order by service_name,service_id,id limit greatest(1,least(p_size,100)) offset (greatest(1,p_page)-1)*greatest(1,least(p_size,100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(page)||jsonb_build_object('price',price::text)) from page),'[]'::jsonb),'total',(select count(*) from filtered))
$$;
revoke all on function private.catalog_visible(uuid) from public,anon;
grant execute on function private.catalog_visible(uuid) to authenticated;
revoke all on function public.quote_service(uuid,public.pet_size,public.pet_coat_type),public.search_services(text,integer,integer,boolean),public.search_service_prices(text,integer,integer) from public,anon;
grant execute on function public.quote_service(uuid,public.pet_size,public.pet_coat_type),public.search_services(text,integer,integer,boolean),public.search_service_prices(text,integer,integer) to authenticated;
