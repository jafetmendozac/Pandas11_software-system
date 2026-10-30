-- Actividad 5.3: lista manual de contactos; no envía comunicaciones.
insert into public.permissions(code,description) values
 ('contacts.read','Consultar lista por contactar'),
 ('contacts.record','Registrar intentos de contacto'),
 ('contacts.consent','Registrar consentimiento de WhatsApp')
on conflict(code) do nothing;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where (r.code in ('OWNER','ADMIN') and p.code in ('contacts.read','contacts.record','contacts.consent'))
   or (r.code='STAFF' and p.code in ('contacts.read','contacts.record'))
on conflict do nothing;

create table public.client_contact_consents (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id),
 channel text not null default 'WHATSAPP' check(channel='WHATSAPP'),
 granted boolean not null,
 source text not null check(source in ('VERBAL','WRITTEN')),
 recorded_by uuid not null references public.profiles(id),
 recorded_at timestamptz not null default clock_timestamp()
);
create index client_contact_consents_latest on public.client_contact_consents(client_id,recorded_at desc,id desc);

create table public.contact_attempts (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id),
 kind text not null check(kind in ('APPOINTMENT_REMINDER','FOLLOW_UP')),
 appointment_id uuid not null references public.appointments(id),
 channel text not null check(channel in ('WHATSAPP','PHONE')),
 result text not null check(result in ('CONTACTED','NO_ANSWER','SKIPPED')),
 note text check(note is null or length(note)<=500),
 request_id uuid not null unique,
 recorded_by uuid not null references public.profiles(id),
 recorded_at timestamptz not null default clock_timestamp()
);
create index contact_attempts_opportunity on public.contact_attempts(kind,appointment_id,recorded_at desc);
create index contact_attempts_client on public.contact_attempts(client_id,recorded_at desc);

alter table public.client_contact_consents enable row level security;
alter table public.contact_attempts enable row level security;
revoke all on public.client_contact_consents,public.contact_attempts from anon,authenticated;
grant select on public.client_contact_consents,public.contact_attempts to authenticated;

create function private.contact_operator() returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active() and exists(
  select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id
  where ur.user_id=auth.uid() and r.active and r.code in ('OWNER','ADMIN','STAFF'))
$$;
create function private.contact_manager() returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active() and exists(
  select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id
  where ur.user_id=auth.uid() and r.active and r.code in ('OWNER','ADMIN'))
$$;
create policy contact_consents_read on public.client_contact_consents for select to authenticated
 using(private.contact_operator() and public.has_permission('contacts.read'));
create policy contact_attempts_read on public.contact_attempts for select to authenticated
 using(private.contact_operator() and public.has_permission('contacts.read'));

create function private.require_contact_permission(p_code text) returns void language plpgsql stable security definer set search_path='' as $$
begin
 if not private.contact_operator() or not public.has_permission(p_code) then
  raise exception 'Sin permiso para contactos' using errcode='42501';
 end if;
end $$;

create function private.whatsapp_consent(p_client uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.clients c where c.id=p_client and c.deleted_at is null and c.whatsapp_opt_in
   and nullif(btrim(c.whatsapp),'') is not null
   and (select cc.granted from public.client_contact_consents cc where cc.client_id=c.id
        order by cc.recorded_at desc,cc.id desc limit 1) is true)
$$;

create function public.contact_queue(p_kind text default null,p_search text default '',p_page integer default 1,p_size integer default 10,p_today date default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_today date:=coalesce(p_today,(clock_timestamp() at time zone 'America/Lima')::date); v_result jsonb;
begin
 perform private.require_contact_permission('contacts.read');
 if p_kind is not null and p_kind not in ('APPOINTMENT_REMINDER','FOLLOW_UP') then
  raise exception 'Tipo de lista inválido' using errcode='22023';
 end if;
 if p_page is null or p_page<1 or p_size is null or p_size not between 1 and 100 then
  raise exception 'Paginación inválida' using errcode='22023';
 end if;
 with last_completed as (
  select distinct on (a.client_id) a.client_id,a.id,a.starts_at
  from public.appointments a join public.clients c on c.id=a.client_id and c.deleted_at is null
  where a.status='COMPLETED' and (a.starts_at at time zone 'America/Lima')::date<=v_today
  order by a.client_id,a.starts_at desc,a.id desc
 ), candidates as (
  select c.id client_id,a.id appointment_id,'APPOINTMENT_REMINDER'::text kind,a.starts_at due_at,
   concat_ws(' ',c.first_name,c.last_name) client_name,c.phone,c.whatsapp,
   coalesce((select string_agg(distinct p.name,', ' order by p.name) from public.appointment_items ai
     join public.pets p on p.id=ai.pet_id where ai.appointment_id=a.id),'') pet_names
  from public.appointments a join public.clients c on c.id=a.client_id and c.deleted_at is null
  where a.status='CONFIRMED' and (a.starts_at at time zone 'America/Lima')::date=v_today+1
  union all
  select c.id,l.id,'FOLLOW_UP'::text,l.starts_at+interval '30 days',
   concat_ws(' ',c.first_name,c.last_name),c.phone,c.whatsapp,
   coalesce((select string_agg(distinct p.name,', ' order by p.name) from public.appointment_items ai
     join public.pets p on p.id=ai.pet_id where ai.appointment_id=l.id),'')
  from last_completed l join public.clients c on c.id=l.client_id
  where (l.starts_at at time zone 'America/Lima')::date<=v_today-30
    and not exists(select 1 from public.appointments upcoming where upcoming.client_id=c.id
      and upcoming.status in ('CONFIRMED','IN_PROGRESS') and upcoming.starts_at>=v_today::timestamp at time zone 'America/Lima')
 ), filtered as (
  select x.*,
   private.whatsapp_consent(x.client_id) whatsapp_allowed,
   exists(select 1 from public.contact_attempts ca where ca.kind=x.kind and ca.appointment_id=x.appointment_id and ca.result='NO_ANSWER') attempted
  from candidates x
  where (p_kind is null or x.kind=p_kind)
    and position(lower(coalesce(p_search,'')) in lower(concat_ws(' ',x.client_name,x.pet_names,x.phone)))>0
    and not exists(select 1 from public.contact_attempts ca where ca.kind=x.kind and ca.appointment_id=x.appointment_id
      and ca.result in ('CONTACTED','SKIPPED'))
 ), page as (
  select * from filtered order by due_at,client_name,kind,appointment_id
  limit p_size offset (p_page-1)*p_size
 )
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(page) order by due_at,client_name,kind,appointment_id) from page),'[]'::jsonb),
   'total',(select count(*) from filtered),'today',v_today::text)
 into v_result;
 return v_result;
end $$;

create function public.record_contact_consent(p_client uuid,p_granted boolean,p_source text)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_id uuid;
begin
 if not private.contact_manager() or not public.has_permission('contacts.consent') then
  raise exception 'Sin permiso para consentimiento' using errcode='42501';
 end if;
 if p_granted is null or p_source not in ('VERBAL','WRITTEN') then
  raise exception 'Consentimiento inválido' using errcode='22023';
 end if;
 perform 1 from public.clients where id=p_client and deleted_at is null for update;
 if not found then raise exception 'Cliente no disponible' using errcode='22023'; end if;
 if not private.contact_manager() or not public.has_permission('contacts.consent') then
  raise exception 'Sin permiso para consentimiento' using errcode='42501';
 end if;
 if p_granted and not exists(select 1 from public.clients where id=p_client and nullif(btrim(whatsapp),'') is not null) then
  raise exception 'Falta número WhatsApp' using errcode='22023';
 end if;
 insert into public.client_contact_consents(client_id,granted,source,recorded_by)
 values(p_client,p_granted,p_source,auth.uid()) returning id into v_id;
 update public.clients set whatsapp_opt_in=p_granted where id=p_client;
 return jsonb_build_object('id',v_id,'granted',p_granted);
end $$;

create function public.record_contact_attempt(p_client uuid,p_kind text,p_appointment uuid,p_channel text,p_result text,p_note text,p_request uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_id uuid; v_existing public.contact_attempts; v_today date:=(clock_timestamp() at time zone 'America/Lima')::date;
begin
 perform private.require_contact_permission('contacts.record');
 if p_kind not in ('APPOINTMENT_REMINDER','FOLLOW_UP') or p_channel not in ('WHATSAPP','PHONE')
   or p_result not in ('CONTACTED','NO_ANSWER','SKIPPED') or p_request is null
   or length(coalesce(p_note,''))>500 then
  raise exception 'Intento inválido' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(930053);
 perform private.require_contact_permission('contacts.record');
 select * into v_existing from public.contact_attempts where request_id=p_request;
 if found then
  if v_existing.client_id=p_client and v_existing.kind=p_kind and v_existing.appointment_id=p_appointment
   and v_existing.channel=p_channel and v_existing.result=p_result and v_existing.note is not distinct from nullif(btrim(p_note),'') then
   return jsonb_build_object('id',v_existing.id,'result',v_existing.result);
  end if;
  raise exception 'Identificador de envío reutilizado' using errcode='23505';
 end if;
 perform 1 from public.clients where id=p_client and deleted_at is null for update;
 if not found then raise exception 'Cliente no disponible' using errcode='22023'; end if;
 if not exists(select 1 from public.appointments a where a.id=p_appointment and a.client_id=p_client and
   ((p_kind='APPOINTMENT_REMINDER' and a.status='CONFIRMED' and (a.starts_at at time zone 'America/Lima')::date=v_today+1)
    or (p_kind='FOLLOW_UP' and a.status='COMPLETED' and (a.starts_at at time zone 'America/Lima')::date<=v_today-30
      and a.id=(select x.id from public.appointments x where x.client_id=p_client and x.status='COMPLETED'
        and (x.starts_at at time zone 'America/Lima')::date<=v_today order by x.starts_at desc,x.id desc limit 1)
      and not exists(select 1 from public.appointments u where u.client_id=p_client and u.status in ('CONFIRMED','IN_PROGRESS')
        and u.starts_at>=v_today::timestamp at time zone 'America/Lima')))) then
  raise exception 'Oportunidad no vigente' using errcode='22023';
 end if;
 if exists(select 1 from public.contact_attempts ca where ca.kind=p_kind and ca.appointment_id=p_appointment
   and ca.result in ('CONTACTED','SKIPPED')) then
  raise exception 'Contacto ya cerrado' using errcode='23505';
 end if;
 if p_result<>'SKIPPED' and p_channel='WHATSAPP' and not private.whatsapp_consent(p_client) then
  raise exception 'Sin consentimiento WhatsApp' using errcode='42501';
 end if;
 if p_result<>'SKIPPED' and p_channel='PHONE' and not exists(select 1 from public.clients where id=p_client and nullif(btrim(phone),'') is not null) then
  raise exception 'Falta teléfono' using errcode='22023';
 end if;
 insert into public.contact_attempts(client_id,kind,appointment_id,channel,result,note,request_id,recorded_by)
 values(p_client,p_kind,p_appointment,p_channel,p_result,nullif(btrim(p_note),''),p_request,auth.uid()) returning id into v_id;
 return jsonb_build_object('id',v_id,'result',p_result);
end $$;

revoke all on function private.contact_operator(),private.contact_manager(),private.require_contact_permission(text),private.whatsapp_consent(uuid) from public,anon,authenticated;
-- La política RLS invoca este predicado como authenticated.
grant execute on function private.contact_operator() to authenticated;
revoke all on function public.contact_queue(text,text,integer,integer,date),public.record_contact_consent(uuid,boolean,text),public.record_contact_attempt(uuid,text,uuid,text,text,text,uuid) from public,anon;
grant execute on function public.contact_queue(text,text,integer,integer,date),public.record_contact_consent(uuid,boolean,text),public.record_contact_attempt(uuid,text,uuid,text,text,text,uuid) to authenticated;
