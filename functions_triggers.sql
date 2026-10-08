-- 1. Asegura la extensión
create extension if not exists moddatetime schema extensions;

-- 2. Aplica el trigger a todas las tablas base de public con updated_at
do $$
declare
  r record;
begin
  for r in
    select c.table_schema, c.table_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema
     and t.table_name = c.table_name
    where c.column_name = 'updated_at'
      and c.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
  loop
    execute format(
      'drop trigger if exists set_updated_at on %I.%I;
       create trigger set_updated_at
       before update on %I.%I
       for each row
       execute function extensions.moddatetime(updated_at);',
      r.table_schema, r.table_name,
      r.table_schema, r.table_name
    );
    raise notice 'Trigger aplicado en %.%', r.table_schema, r.table_name;
  end loop;
end;
$$;


-----------------------------



-- función corregida
create or replace function public.has_permission(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles ro
      on ro.id = ur.role_id
     and ro.active = true
    join public.role_permissions rp
      on rp.role_id = ur.role_id
    join public.permissions p
      on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.code = p_code
  );
$$;

grant execute on function public.has_permission(text) to authenticated;
revoke execute on function public.has_permission(text) from public, anon;

-- RLS
alter table public.roles enable row level security;
alter table public.permissions enable row level security;


--------


-- 1. Función
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, first_name, last_name)
    values (
        new.id,
        new.raw_user_meta_data ->> 'first_name',
        new.raw_user_meta_data ->> 'last_name'
    );

    return new;
end;
$$;

-- 2. Trigger
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();