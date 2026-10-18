-- Modelo de identidad extraído de Pandas11.sql. Solo instalación local nueva.
CREATE TABLE "profiles" (
    id uuid PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    first_name text,
    last_name text,

    active boolean NOT NULL DEFAULT true,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "roles" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  code text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE,
  description text,

  is_system boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "permissions" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  code text NOT NULL UNIQUE,
  description text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "role_permissions" (
  "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permission_id" uuid NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  PRIMARY KEY ("role_id", "permission_id")
);

CREATE TABLE "user_roles" (
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  PRIMARY KEY ("user_id", "role_id")
);

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

insert into public.roles(code,name,is_system) values
 ('OWNER','Propietario',true),('ADMIN','Administrador',true),
 ('STAFF','Personal',true),('CLIENT','Cliente',true);
insert into public.permissions(code,description) values
 ('panel.access','Acceder al panel'),('profiles.read','Consultar perfiles'),
 ('profiles.manage','Administrar perfiles'),('security.read','Consultar seguridad'),
 ('roles.manage','Administrar roles'),('role_permissions.manage','Asignar permisos'),
 ('user_roles.manage','Asignar roles');
insert into public.role_permissions
select r.id,p.id from public.roles r cross join public.permissions p
where r.code='OWNER' or (r.code in ('ADMIN','STAFF') and p.code='panel.access')
 or (r.code='ADMIN' and p.code='profiles.read');

create function private.is_active() returns boolean language sql stable security definer
set search_path='' as $$ select exists(select 1 from public.profiles where id=auth.uid() and active) $$;
create function public.has_permission(p_code text) returns boolean language sql stable security definer
set search_path='' as $$
 select exists(select 1 from public.profiles pr
 join public.user_roles ur on ur.user_id=pr.id
 join public.roles r on r.id=ur.role_id and r.active
 join public.role_permissions rp on rp.role_id=r.id
 join public.permissions p on p.id=rp.permission_id
 where pr.id=auth.uid() and pr.active and p.code=p_code)
$$;
create function public.my_permissions() returns setof text language sql stable security definer
set search_path='' as $$
 select distinct p.code from public.profiles pr
 join public.user_roles ur on ur.user_id=pr.id
 join public.roles r on r.id=ur.role_id and r.active
 join public.role_permissions rp on rp.role_id=r.id
 join public.permissions p on p.id=rp.permission_id
 where pr.id=auth.uid() and pr.active
$$;
create function private.new_user() returns trigger language plpgsql security definer
set search_path='' as $$ begin
 insert into public.profiles(id,first_name,last_name)
 values(new.id,new.raw_user_meta_data->>'first_name',new.raw_user_meta_data->>'last_name');
 insert into public.user_roles select new.id,id from public.roles where code='CLIENT';
 return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.new_user();

-- Invariantes: los roles de sistema y el owner no se alteran mediante la API.
-- La rotación de owners requiere procedimiento privilegiado fuera del frontend.
create function private.protect_identity() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if current_setting('role',true) in ('none','postgres','supabase_admin') then
   if TG_OP='DELETE' then return old; else return new; end if;
 end if;
 if TG_TABLE_NAME='roles' then
   if TG_OP<>'DELETE' then
     if new.is_system then raise exception 'Rol de sistema protegido' using errcode='42501'; end if;
   end if;
   if TG_OP<>'INSERT' then
     if old.is_system then raise exception 'Rol de sistema protegido' using errcode='42501'; end if;
   end if;
 elsif TG_TABLE_NAME='role_permissions' then
   if TG_OP<>'DELETE' then
     if exists(select 1 from public.roles where id=new.role_id and is_system) then
       raise exception 'Permisos de sistema protegidos' using errcode='42501'; end if;
   end if;
   if TG_OP<>'INSERT' then
     if exists(select 1 from public.roles where id=old.role_id and is_system) then
       raise exception 'Permisos de sistema protegidos' using errcode='42501'; end if;
   end if;
 elsif TG_TABLE_NAME='user_roles' then
   if TG_OP<>'DELETE' then
     if exists(select 1 from public.roles where id=new.role_id and code='OWNER') then
       raise exception 'Asignación owner protegida' using errcode='42501'; end if;
   end if;
   if TG_OP<>'INSERT' then
     if exists(select 1 from public.roles where id=old.role_id and code='OWNER') then
       raise exception 'Asignación owner protegida' using errcode='42501'; end if;
   end if;
 end if;
 if TG_OP='DELETE' then return old; else return new; end if;
end $$;
create trigger protect_roles before insert or update or delete on public.roles for each row execute function private.protect_identity();
create trigger protect_permissions before insert or update or delete on public.role_permissions for each row execute function private.protect_identity();
create trigger protect_owners before insert or delete on public.user_roles for each row execute function private.protect_identity();

create function private.touch_profile() returns trigger language plpgsql set search_path='' as $$ begin
 new.updated_at=now(); return new; end $$;
create trigger touch_profile before update on public.profiles for each row execute function private.touch_profile();

create function public.set_profile_active(p_user_id uuid,p_active boolean) returns void
language plpgsql security definer set search_path='' as $$ begin
 if not public.has_permission('profiles.manage') then raise exception 'Sin permiso' using errcode='42501'; end if;
 if exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id where ur.user_id=p_user_id and r.code='OWNER') then
 raise exception 'Owner protegido: requiere administración privilegiada' using errcode='42501'; end if;
 update public.profiles set active=p_active where id=p_user_id;
 if not found then raise exception 'Perfil inexistente'; end if;
end $$;

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
revoke all on public.profiles,public.roles,public.permissions,public.user_roles,public.role_permissions from anon,authenticated;
grant select on public.profiles,public.roles,public.permissions,public.user_roles,public.role_permissions to authenticated;
grant update(first_name,last_name) on public.profiles to authenticated;
grant insert(code,name,description,active),update(code,name,description,active,updated_at) on public.roles to authenticated;
grant insert,delete on public.user_roles to authenticated;
grant insert,update,delete on public.role_permissions to authenticated;
create policy profiles_read on public.profiles for select to authenticated
 using (private.is_active() and (id=auth.uid() or public.has_permission('profiles.read')));
create policy profiles_edit on public.profiles for update to authenticated
 using(id=auth.uid() and private.is_active()) with check(id=auth.uid() and private.is_active());
create policy roles_read on public.roles for select to authenticated using(public.has_permission('security.read'));
create policy roles_create on public.roles for insert to authenticated with check(public.has_permission('roles.manage') and not is_system);
create policy roles_edit on public.roles for update to authenticated using(public.has_permission('roles.manage') and not is_system)
 with check(public.has_permission('roles.manage') and not is_system);
create policy permissions_read on public.permissions for select to authenticated using(public.has_permission('security.read'));
create policy user_roles_read on public.user_roles for select to authenticated using(public.has_permission('security.read'));
create policy user_roles_insert on public.user_roles for insert to authenticated with check(public.has_permission('user_roles.manage'));
create policy user_roles_delete on public.user_roles for delete to authenticated using(public.has_permission('user_roles.manage'));
create policy role_permissions_read on public.role_permissions for select to authenticated using(public.has_permission('security.read'));
create policy role_permissions_write on public.role_permissions for all to authenticated
 using(public.has_permission('role_permissions.manage')) with check(public.has_permission('role_permissions.manage'));

revoke all on function private.is_active(),public.has_permission(text),public.my_permissions(),public.set_profile_active(uuid,boolean) from public,anon;
grant execute on function private.is_active(),public.has_permission(text),public.my_permissions(),public.set_profile_active(uuid,boolean) to authenticated;
revoke all on function private.new_user(),private.protect_identity(),private.touch_profile() from public,anon,authenticated;
