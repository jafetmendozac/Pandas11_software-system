-- Antecedentes de desparasitación. El negocio no registra vacunas.
-- La migración se detiene si hay vacunas fuera de los dos fixtures DEMO conocidos.
do $$ begin
  if exists (
    select 1 from public.pet_vaccinations
    where not (
      (id = 'd0400000-0000-4000-8000-000000000251'::uuid and vaccine in ('Antirrábica', 'DEMO Antirrábica vigente'))
      or (id = 'd0400000-0000-4000-8000-000000000252'::uuid and vaccine in ('Séxtuple', 'DEMO Vacuna vencida'))
    )
  ) then
    raise exception 'Hay vacunas ajenas a los fixtures DEMO; revisar antes de eliminar pet_vaccinations';
  end if;
end $$;

create table public.pet_dewormings (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) deferrable initially immediate,
  treatment text not null check (length(btrim(treatment)) > 0),
  applied_on date not null,
  next_due_on date,
  created_at timestamptz not null default now(),
  constraint chk_deworming_dates check (next_due_on is null or next_due_on >= applied_on)
);
create index on public.pet_dewormings(pet_id);

insert into public.permissions(code,description) values
 ('dewormings.read','Consultar desparasitaciones'),
 ('dewormings.manage','Administrar desparasitaciones');
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where p.code in ('dewormings.read','dewormings.manage')
  and (r.code in ('OWNER','ADMIN') or (r.code='STAFF' and p.code='dewormings.read'));

alter table public.pet_dewormings enable row level security;
revoke all on public.pet_dewormings from anon,authenticated;
grant select on public.pet_dewormings to authenticated;
grant insert(pet_id,treatment,applied_on,next_due_on),
  update(treatment,applied_on,next_due_on) on public.pet_dewormings to authenticated;
create policy deworming_read on public.pet_dewormings for select to authenticated
  using (public.has_permission('dewormings.read') or private.owns_pet(pet_id));
create policy deworming_create on public.pet_dewormings for insert to authenticated
  with check (public.has_permission('dewormings.manage') and private.pet_open(pet_id));
create policy deworming_edit on public.pet_dewormings for update to authenticated
  using (public.has_permission('dewormings.manage') and private.pet_open(pet_id))
  with check (public.has_permission('dewormings.manage') and private.pet_open(pet_id));

drop table public.pet_vaccinations;
delete from public.permissions where code in ('vaccinations.read','vaccinations.manage');
