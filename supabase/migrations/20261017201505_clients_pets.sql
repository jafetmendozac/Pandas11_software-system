-- Fase 1: modelo aprobado de Pandas11.sql, instalación incremental.
CREATE TYPE "tax_doc_type" AS ENUM (
  'DNI',
  'RUC',
  'CE',
  'PASSPORT'
);

CREATE TYPE "pet_sex" AS ENUM (
  'MALE',
  'FEMALE',
  'UNKNOWN'
);

CREATE TYPE "pet_size" AS ENUM (
  'TOY',
  'SMALL',
  'MEDIUM',
  'LARGE',
  'EXTRA_LARGE'
);

CREATE TYPE "pet_coat_type" AS ENUM (
  'SHORT',
  'MEDIUM',
  'LONG',
  'WIRE',
  'CURLY',
  'HAIRLESS'
);

CREATE TABLE "clients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" uuid UNIQUE,
  "first_name" text NOT NULL CHECK (length(btrim(first_name)) > 0),
  "last_name" text,
  "phone" text,
  "whatsapp" text,
  "email" text,
  "address" text,
  "tax_doc_type" tax_doc_type,
  "tax_doc_number" text,
  "business_name" text,
  "whatsapp_opt_in" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "pets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL,
  "name" text NOT NULL CHECK (length(btrim(name)) > 0),
  "breed" text,
  "pet_sex" pet_sex,
  "pet_size" pet_size,
  "pet_coat_type" pet_coat_type,
  "photo_url" text,
  "weight_kg" numeric CHECK (weight_kg > 0),
  "allergies" boolean NOT NULL DEFAULT false,
  "bites" boolean NOT NULL DEFAULT false,
  "client_notes" text,
  "birth_date" date,
  "death_date" date,
  "active" boolean NOT NULL DEFAULT true,
  "deleted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_pet_life CHECK (death_date IS NULL OR birth_date IS NULL OR death_date >= birth_date)
);

CREATE TABLE "pet_vaccinations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pet_id" uuid NOT NULL,
  "vaccine" text NOT NULL CHECK (length(btrim(vaccine)) > 0),
  "applied_on" date NOT NULL,
  "valid_until" date,
  "document_url" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_vaccination_dates CHECK (valid_until IS NULL OR valid_until >= applied_on)
);

CREATE TABLE "client_internal" (
  "client_id" uuid PRIMARY KEY,
  "notes" text,
  "updated_by" uuid,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "pet_internal" (
  "pet_id" uuid PRIMARY KEY,
  "notes" text,
  "updated_by" uuid,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON "clients" ("whatsapp");

CREATE INDEX ON "clients" ("tax_doc_type", "tax_doc_number");

CREATE INDEX ON "pets" ("client_id");

CREATE UNIQUE INDEX ON "pets" ("id", "client_id");

CREATE INDEX ON "pet_vaccinations" ("pet_id");

ALTER TABLE "clients" ADD FOREIGN KEY ("profile_id") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pets" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pet_vaccinations" ADD FOREIGN KEY ("pet_id") REFERENCES "pets" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "client_internal" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "client_internal" ADD FOREIGN KEY ("updated_by") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pet_internal" ADD FOREIGN KEY ("pet_id") REFERENCES "pets" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pet_internal" ADD FOREIGN KEY ("updated_by") REFERENCES "profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

insert into public.permissions(code,description) values
 ('clients.read','Consultar clientes'),('clients.manage','Administrar clientes'),
 ('pets.read','Consultar mascotas'),('pets.manage','Administrar mascotas'),
 ('vaccinations.read','Consultar vacunas'),('vaccinations.manage','Administrar vacunas'),
 ('internal.read','Consultar notas internas'),('internal.manage','Administrar notas internas');
insert into public.role_permissions
select r.id,p.id from public.roles r cross join public.permissions p
where p.code in ('clients.read','clients.manage','pets.read','pets.manage','vaccinations.read','vaccinations.manage','internal.read','internal.manage')
and (r.code in ('OWNER','ADMIN') or (r.code='STAFF' and p.code in ('clients.read','pets.read','vaccinations.read','internal.read')));

create function private.client_open(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.clients where id=p_id and deleted_at is null)
$$;
create function private.pet_open(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.pets p join public.clients c on c.id=p.client_id where p.id=p_id and p.deleted_at is null and c.deleted_at is null)
$$;
create function private.owns_client(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active() and exists(select 1 from public.clients where id=p_id and profile_id=auth.uid() and deleted_at is null)
$$;
create function private.owns_pet(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active() and exists(select 1 from public.pets p join public.clients c on c.id=p.client_id where p.id=p_id and p.deleted_at is null and c.deleted_at is null and c.profile_id=auth.uid())
$$;

create function private.stamp_domain() returns trigger language plpgsql set search_path='' as $$ begin
 if TG_TABLE_NAME in ('client_internal','pet_internal') then new.updated_by=auth.uid(); end if;
 new.updated_at=now(); return new;
end $$;
create trigger stamp_clients before update on public.clients for each row execute function private.stamp_domain();
create trigger stamp_pets before update on public.pets for each row execute function private.stamp_domain();
create trigger stamp_client_internal before insert or update on public.client_internal for each row execute function private.stamp_domain();
create trigger stamp_pet_internal before insert or update on public.pet_internal for each row execute function private.stamp_domain();

alter table public.clients enable row level security;
alter table public.pets enable row level security;
alter table public.pet_vaccinations enable row level security;
alter table public.client_internal enable row level security;
alter table public.pet_internal enable row level security;
revoke all on public.clients,public.pets,public.pet_vaccinations,public.client_internal,public.pet_internal from anon,authenticated;
grant select on public.clients,public.pets,public.pet_vaccinations,public.client_internal,public.pet_internal to authenticated;
-- Clientes se escriben mediante RPC con whitelist; profile_id no se modifica por UPDATE directo.
grant insert(client_id,name,breed,pet_sex,pet_size,pet_coat_type,weight_kg,allergies,bites,client_notes,birth_date,death_date,active) on public.pets to authenticated;
grant update(name,breed,pet_sex,pet_size,pet_coat_type,weight_kg,allergies,bites,client_notes,birth_date,death_date,active) on public.pets to authenticated;
grant insert(pet_id,vaccine,applied_on,valid_until),update(vaccine,applied_on,valid_until) on public.pet_vaccinations to authenticated;
grant insert(client_id,notes),update(notes) on public.client_internal to authenticated;
grant insert(pet_id,notes),update(notes) on public.pet_internal to authenticated;

create policy clients_read on public.clients for select to authenticated using(public.has_permission('clients.read') or private.owns_client(id));
create policy pets_read on public.pets for select to authenticated using(public.has_permission('pets.read') or private.owns_pet(id));
create policy pets_create on public.pets for insert to authenticated with check(public.has_permission('pets.manage') and private.client_open(client_id));
create policy pets_edit on public.pets for update to authenticated using(public.has_permission('pets.manage') and private.pet_open(id)) with check(public.has_permission('pets.manage') and private.pet_open(id));
create policy vaccination_read on public.pet_vaccinations for select to authenticated using(public.has_permission('vaccinations.read') or private.owns_pet(pet_id));
create policy vaccination_create on public.pet_vaccinations for insert to authenticated with check(public.has_permission('vaccinations.manage') and private.pet_open(pet_id));
create policy vaccination_edit on public.pet_vaccinations for update to authenticated using(public.has_permission('vaccinations.manage') and private.pet_open(pet_id)) with check(public.has_permission('vaccinations.manage') and private.pet_open(pet_id));
create policy client_notes_read on public.client_internal for select to authenticated using(public.has_permission('internal.read'));
create policy client_notes_create on public.client_internal for insert to authenticated with check(public.has_permission('internal.manage') and private.client_open(client_id));
create policy client_notes_edit on public.client_internal for update to authenticated using(public.has_permission('internal.manage') and private.client_open(client_id)) with check(public.has_permission('internal.manage') and private.client_open(client_id));
create policy pet_notes_read on public.pet_internal for select to authenticated using(public.has_permission('internal.read'));
create policy pet_notes_create on public.pet_internal for insert to authenticated with check(public.has_permission('internal.manage') and private.pet_open(pet_id));
create policy pet_notes_edit on public.pet_internal for update to authenticated using(public.has_permission('internal.manage') and private.pet_open(pet_id)) with check(public.has_permission('internal.manage') and private.pet_open(pet_id));

create function public.save_client(p_input jsonb,p_id uuid default null) returns public.clients language plpgsql security definer set search_path='' as $$
declare result public.clients; linked uuid=nullif(p_input->>'profile_id','')::uuid;
begin
 if not public.has_permission('clients.manage') then raise exception 'Sin permiso' using errcode='42501'; end if;
 if linked is not null and not exists(select 1 from public.profiles where id=linked and active) then raise exception 'Perfil no disponible'; end if;
 if p_id is null then
  insert into public.clients(profile_id,first_name,last_name,phone,whatsapp,email,address,tax_doc_type,tax_doc_number,business_name,whatsapp_opt_in)
  values(linked,btrim(p_input->>'first_name'),nullif(btrim(p_input->>'last_name'),''),nullif(p_input->>'phone',''),nullif(p_input->>'whatsapp',''),nullif(p_input->>'email',''),nullif(p_input->>'address',''),nullif(p_input->>'tax_doc_type','')::public.tax_doc_type,nullif(p_input->>'tax_doc_number',''),nullif(p_input->>'business_name',''),coalesce((p_input->>'whatsapp_opt_in')::boolean,false)) returning * into result;
 else
  perform 1 from public.clients where id=p_id and deleted_at is null for update;
  if not found then raise exception 'Cliente no disponible'; end if;
  update public.clients set profile_id=linked,first_name=btrim(p_input->>'first_name'),last_name=nullif(btrim(p_input->>'last_name'),''),phone=nullif(p_input->>'phone',''),whatsapp=nullif(p_input->>'whatsapp',''),email=nullif(p_input->>'email',''),address=nullif(p_input->>'address',''),tax_doc_type=nullif(p_input->>'tax_doc_type','')::public.tax_doc_type,tax_doc_number=nullif(p_input->>'tax_doc_number',''),business_name=nullif(p_input->>'business_name',''),whatsapp_opt_in=coalesce((p_input->>'whatsapp_opt_in')::boolean,false)
  where id=p_id returning * into result;
 end if;
 return result;
end $$;
create function public.retire_client(p_id uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 if not public.has_permission('clients.manage') then raise exception 'Sin permiso' using errcode='42501'; end if;
 update public.clients set deleted_at=now() where id=p_id and deleted_at is null;
 if not found then raise exception 'Cliente no disponible'; end if;
end $$;
create function public.retire_pet(p_id uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 if not public.has_permission('pets.manage') then raise exception 'Sin permiso' using errcode='42501'; end if;
 update public.pets set deleted_at=now(),active=false where id=p_id and private.pet_open(id);
 if not found then raise exception 'Mascota no disponible'; end if;
end $$;

-- Invoker: también las búsquedas y sus totales respetan RLS.
create function public.search_clients(p_search text default '',p_page integer default 1,p_size integer default 10,p_archived boolean default false) returns jsonb language sql stable set search_path='' as $$
 with filtered as (
  select c.* from public.clients c where (c.deleted_at is not null)=p_archived
   and position(lower(coalesce(p_search,'')) in lower(concat_ws(' ',first_name,last_name,phone,whatsapp,tax_doc_number)))>0
 ), page as (select * from filtered order by created_at desc,id limit greatest(1,least(p_size,100)) offset (greatest(1,p_page)-1)*greatest(1,least(p_size,100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb),'total',(select count(*) from filtered))
$$;
create function public.search_pets(p_search text default '',p_page integer default 1,p_size integer default 10,p_archived boolean default false,p_client uuid default null) returns jsonb language sql stable set search_path='' as $$
 with filtered as (
  select p.*,concat_ws(' ',c.first_name,c.last_name) as client_name from public.pets p join public.clients c on c.id=p.client_id
  where ((p.deleted_at is not null) or (c.deleted_at is not null))=p_archived
   and (p_client is null or p.client_id=p_client)
   and position(lower(coalesce(p_search,'')) in lower(concat_ws(' ',p.name,c.first_name,c.last_name)))>0
 ), page as (select * from filtered order by created_at desc,id limit greatest(1,least(p_size,100)) offset (greatest(1,p_page)-1)*greatest(1,least(p_size,100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb),'total',(select count(*) from filtered))
$$;

revoke all on function private.client_open(uuid),private.pet_open(uuid),private.owns_client(uuid),private.owns_pet(uuid) from public,anon;
grant execute on function private.client_open(uuid),private.pet_open(uuid),private.owns_client(uuid),private.owns_pet(uuid) to authenticated;
revoke all on function private.stamp_domain() from public,anon,authenticated;
revoke all on function public.save_client(jsonb,uuid),public.retire_client(uuid),public.retire_pet(uuid),public.search_clients(text,integer,integer,boolean),public.search_pets(text,integer,integer,boolean,uuid) from public,anon;
grant execute on function public.save_client(jsonb,uuid),public.retire_client(uuid),public.retire_pet(uuid),public.search_clients(text,integer,integer,boolean),public.search_pets(text,integer,integer,boolean,uuid) to authenticated;
