insert into public.user_roles(user_id, role_id)
select 'f90800f5-92bd-4dff-a36d-21e8123faef4'::uuid, id from public.roles where code = 'OWNER';