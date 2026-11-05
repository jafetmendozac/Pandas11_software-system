-- Expone el nombre de la raza en las fichas sin reemplazar su FK UUID.
create or replace function public.search_pets(
 p_search text default '',p_page integer default 1,p_size integer default 10,
 p_archived boolean default false,p_client uuid default null
) returns jsonb language sql stable set search_path='' as $$
 with filtered as (
  select p.*,concat_ws(' ',c.first_name,c.last_name) as client_name,
   b.name as breed_name
  from public.pets p
  join public.clients c on c.id=p.client_id
  left join public.pet_breeds b on b.id=p.breed_id
  where ((p.deleted_at is not null) or (c.deleted_at is not null))=p_archived
   and (p_client is null or p.client_id=p_client)
   and position(lower(coalesce(p_search,'')) in lower(concat_ws(' ',p.name,c.first_name,c.last_name)))>0
 ), page as (
  select * from filtered order by created_at desc,id
  limit greatest(1,least(p_size,100)) offset (greatest(1,p_page)-1)*greatest(1,least(p_size,100))
 )
 select jsonb_build_object(
  'rows',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb),
  'total',(select count(*) from filtered)
 )
$$;
