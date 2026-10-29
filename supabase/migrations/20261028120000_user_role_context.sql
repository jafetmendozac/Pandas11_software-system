create or replace function public.my_roles()
returns table(role_id uuid, code text, name text, permissions text[])
language sql stable security definer
set search_path = '' as $$
  select r.id, r.code, r.name,
    coalesce(array_agg(p.code order by p.code) filter (where p.code is not null), '{}'::text[])
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id and r.active
  left join public.role_permissions rp on rp.role_id = r.id
  left join public.permissions p on p.id = rp.permission_id
  where ur.user_id = auth.uid()
    and exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.active)
  group by r.id, r.code, r.name
  order by r.name
$$;

revoke all on function public.my_roles() from public, anon;
grant execute on function public.my_roles() to authenticated;
