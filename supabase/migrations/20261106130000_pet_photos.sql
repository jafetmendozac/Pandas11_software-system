-- Fotos privadas de mascotas: el valor de pets.photo_url guarda la ruta del objeto, no una URL pública.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('pet-photos','pet-photos',false,5242880,array['image/jpeg','image/png','image/webp']);

grant update(photo_url) on public.pets to authenticated;

create policy pet_photo_read on storage.objects for select to authenticated
using (bucket_id='pet-photos' and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$' and (
  public.has_permission('pets.read') or private.owns_pet(split_part(name,'/',1)::uuid)
));

create policy pet_photo_upload on storage.objects for insert to authenticated
with check (bucket_id='pet-photos' and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
  and public.has_permission('pets.manage') and private.pet_open(split_part(name,'/',1)::uuid));

create policy pet_photo_remove on storage.objects for delete to authenticated
using (bucket_id='pet-photos' and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
  and public.has_permission('pets.manage') and private.pet_open(split_part(name,'/',1)::uuid));
