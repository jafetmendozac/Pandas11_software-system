-- Un panfleto recurrente por día de la semana para la portada pública.
-- Archivos privados: anon solo puede firmar la imagen publicada del día de Lima.
create table public.home_flyers (
  weekday smallint primary key check (weekday between 1 and 7),
  object_path text unique,
  alt_text text,
  published boolean not null default false,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz,
  updated_by uuid references public.profiles(id),
  constraint home_flyer_content check (
    (object_path is null and alt_text is null and not published)
    or (object_path is not null and length(btrim(alt_text)) between 5 and 200)
  ),
  constraint home_flyer_path check (
    object_path is null or object_path ~ '^[1-7]/[0-9a-f-]{36}\.(jpg|png|webp)$'
  )
);
insert into public.home_flyers(weekday) select generate_series(1,7);

insert into public.permissions(code,description)
values ('home_flyers.manage','Administrar panfletos semanales de la portada');
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.code in ('OWNER','ADMIN') and p.code='home_flyers.manage';

create function private.can_manage_home_flyers() returns boolean
language sql stable security definer set search_path='' as $$
 select public.has_permission('home_flyers.manage') and exists (
  select 1 from public.profiles pr
  join public.user_roles ur on ur.user_id=pr.id
  join public.roles r on r.id=ur.role_id
  where pr.id=auth.uid() and pr.active and r.active and r.code in ('OWNER','ADMIN')
 )
$$;
revoke all on function private.can_manage_home_flyers() from public,anon,authenticated;
grant execute on function private.can_manage_home_flyers() to authenticated;

alter table public.home_flyers enable row level security;
revoke all on public.home_flyers from anon,authenticated;
grant select(weekday,object_path,alt_text,published,version,updated_at) on public.home_flyers to anon;
grant select on public.home_flyers to authenticated;
create policy home_flyers_today on public.home_flyers for select to anon,authenticated
 using (published and weekday=extract(isodow from now() at time zone 'America/Lima')::smallint);
create policy home_flyers_manager on public.home_flyers for select to authenticated
 using (private.can_manage_home_flyers());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('home-flyers','home-flyers',false,5242880,array['image/jpeg','image/png','image/webp']);

create policy home_flyer_object_today on storage.objects for select to anon,authenticated
 using (bucket_id='home-flyers' and exists (
   select 1 from public.home_flyers f
   where f.object_path=name and f.published
   and f.weekday=extract(isodow from now() at time zone 'America/Lima')::smallint
 ));
create policy home_flyer_object_manager on storage.objects for select to authenticated
 using (bucket_id='home-flyers' and private.can_manage_home_flyers());
create policy home_flyer_object_upload on storage.objects for insert to authenticated
 with check (bucket_id='home-flyers' and private.can_manage_home_flyers()
   and name ~ '^[1-7]/[0-9a-f-]{36}\.(jpg|png|webp)$');
create policy home_flyer_object_remove_orphan on storage.objects for delete to authenticated
 using (bucket_id='home-flyers' and private.can_manage_home_flyers()
   and not exists (select 1 from public.home_flyers f where f.object_path=name));

create function public.save_home_flyer(
 p_weekday smallint, p_object_path text, p_alt_text text,
 p_published boolean, p_expected_version integer
) returns jsonb language plpgsql security definer set search_path='' as $$
declare current_row public.home_flyers; saved public.home_flyers; clean_alt text;
begin
 if not private.can_manage_home_flyers() then
  raise exception 'Sin permiso para administrar panfletos' using errcode='42501';
 end if;
 if p_weekday is null or p_weekday not between 1 and 7 or p_published is null then
  raise exception 'Día o estado inválido' using errcode='22023';
 end if;
 select * into current_row from public.home_flyers where weekday=p_weekday for update;
 if not found then raise exception 'Día inexistente' using errcode='22023'; end if;
 if current_row.version is distinct from p_expected_version then
  raise exception 'El panfleto cambió; recarga antes de guardar' using errcode='40001';
 end if;
 clean_alt:=nullif(btrim(p_alt_text),'');
 if p_object_path is null then
  if p_published or clean_alt is not null then
   raise exception 'Carga una imagen antes de publicar' using errcode='22023';
  end if;
 else
  if p_object_path !~ ('^'||p_weekday::text||'/[0-9a-f-]{36}\.(jpg|png|webp)$')
    or clean_alt is null or length(clean_alt) not between 5 and 200 then
   raise exception 'Imagen o texto alternativo inválido' using errcode='22023';
  end if;
  if not exists (select 1 from storage.objects o
    where o.bucket_id='home-flyers' and o.name=p_object_path) then
   raise exception 'La imagen cargada no existe' using errcode='22023';
  end if;
 end if;
 update public.home_flyers set object_path=p_object_path, alt_text=clean_alt,
   published=p_published, version=version+1, updated_at=clock_timestamp(),
   updated_by=auth.uid() where weekday=p_weekday returning * into saved;
 return to_jsonb(saved);
end $$;
revoke all on function public.save_home_flyer(smallint,text,text,boolean,integer)
 from public,anon,authenticated;
grant execute on function public.save_home_flyer(smallint,text,text,boolean,integer)
 to authenticated;
