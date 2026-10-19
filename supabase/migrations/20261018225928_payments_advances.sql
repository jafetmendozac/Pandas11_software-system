-- Fase 5 aprobada: cobros internos finales, referencias sin archivos.
create type public.payment_type as enum ('DEPOSIT','BALANCE','REFUND');
create type public.payment_method as enum ('YAPE','PLIN','CASH','CARD','TRANSFER');
create type public.payment_status as enum ('PENDING','PAID','FAILED','REFUNDED');
create table public.payments (
 id uuid primary key default gen_random_uuid(),
 appointment_id uuid not null references public.appointments(id),
 type public.payment_type not null,
 method public.payment_method not null,
 status public.payment_status not null default 'PENDING',
 amount numeric not null,
 operation_code text check (operation_code is null or (length(operation_code)<=120 and length(btrim(operation_code))>0)),
 proof_url text check (proof_url is null),
 external_ref text check (external_ref is null or (length(external_ref)<=120 and length(btrim(external_ref))>0)),
 verified_by uuid references public.profiles(id),
 paid_at timestamptz,
 created_at timestamptz not null default clock_timestamp(),
 created_by uuid not null references public.profiles(id),
 updated_at timestamptz not null default clock_timestamp(),
 version integer not null default 1 check(version>0),
 rejection_reason text check(rejection_reason is null or (length(btrim(rejection_reason))>0 and length(rejection_reason)<=500)),
 request_id uuid not null unique,
 constraint chk_payment_amount check(amount>0 and amount<'Infinity'::numeric and amount=round(amount,2)),
 constraint chk_payment_verification check (
  (status='PAID' and verified_by is not null and paid_at is not null and isfinite(paid_at) and rejection_reason is null)
  or (status='PENDING' and verified_by is null and paid_at is null and rejection_reason is null)
  or (status='FAILED' and verified_by is null and paid_at is null and rejection_reason is not null)
  or status='REFUNDED')
);
create index on public.payments(appointment_id);
create index on public.payments(status,created_at);
create index on public.payments(operation_code);
create index on public.payments(created_at desc,id desc);
insert into public.permissions(code,description) values
 ('payments.read','Consultar pagos y saldos'),('payments.create','Registrar cobros pendientes'),('payments.verify','Verificar o rechazar pagos (OWNER)');
insert into public.role_permissions select r.id,p.id from public.roles r cross join public.permissions p
 where p.code in ('payments.read','payments.create','payments.verify') and
 (r.code='OWNER' or (r.code='ADMIN' and p.code<>'payments.verify'));
alter table public.payments enable row level security;
revoke all on public.payments from anon,authenticated;
grant select on public.payments to authenticated;
create policy payments_read on public.payments for select to authenticated using(public.has_permission('payments.read'));

create function private.require_payment_permission(p_code text) returns void language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_work_permission('payments.read');
 perform private.require_work_permission(p_code);
 if p_code='payments.verify' and not exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id where ur.user_id=auth.uid() and r.code='OWNER' and r.active) then
  raise exception 'Solo OWNER verifica o rechaza pagos' using errcode='42501';
 end if;
end $$;
create function private.payment_json(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select to_jsonb(p)||jsonb_build_object('amount',p.amount::text,'client_name',concat_ws(' ',c.first_name,c.last_name),
 'client_id',c.id,'appointment_status',a.status,'appointment_starts_at',a.starts_at)
 from public.payments p join public.appointments a on a.id=p.appointment_id join public.clients c on c.id=a.client_id where p.id=p_id
$$;
create function public.appointment_payment_summary(p_appointment_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_payment_permission('payments.read');
 select jsonb_build_object('appointment_id',a.id,'client_name',concat_ws(' ',c.first_name,c.last_name),'status',a.status,'source',a.source,
 'total',a.total_price::text,'confirmed',s.paid::text,'pending',s.pending::text,'outstanding',(a.total_price-s.paid)::text,
 'requires_resolution',a.status in ('CANCELLED','NO_SHOW') and s.paid>0)
 into result from public.appointments a join public.clients c on c.id=a.client_id cross join lateral (
 select coalesce(sum(amount) filter(where status='PAID' and type in ('BALANCE','DEPOSIT')),0) paid,
 coalesce(sum(amount) filter(where status='PENDING' and type in ('BALANCE','DEPOSIT')),0) pending from public.payments where appointment_id=a.id) s where a.id=p_appointment_id;
 if result is null then raise exception 'Cita no encontrada' using errcode='22023'; end if;
 return result;
end $$;
create function public.search_payments(p_search text default '',p_appointment_id uuid default null,p_status public.payment_status default null,p_method public.payment_method default null,p_from date default null,p_until date default null,p_page integer default 1,p_size integer default 10)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_payment_permission('payments.read');
 if p_from is not null and p_until is not null and p_until<p_from then raise exception 'Rango de fechas inválido' using errcode='22023'; end if;
 with filtered as (
 select p.id,p.created_at from public.payments p join public.appointments a on a.id=p.appointment_id join public.clients c on c.id=a.client_id
 where (p_appointment_id is null or p.appointment_id=p_appointment_id) and (p_status is null or p.status=p_status) and (p_method is null or p.method=p_method)
 and (p_from is null or p.created_at >= (p_from::timestamp at time zone 'America/Lima'))
 and (p_until is null or p.created_at < ((p_until+1)::timestamp at time zone 'America/Lima'))
 and position(lower(coalesce(p_search,'')) in lower(concat_ws(' ',c.first_name,c.last_name,p.appointment_id::text,p.operation_code,p.external_ref)))>0),
 page as (select * from filtered order by created_at desc,id desc limit greatest(1,least(coalesce(p_size,10),100)) offset (greatest(1,coalesce(p_page,1))-1)*greatest(1,least(coalesce(p_size,10),100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(private.payment_json(id) order by created_at desc,id desc) from page),'[]'::jsonb),'total',(select count(*) from filtered)) into result;
 return result;
end $$;
create function public.register_payment(p_input jsonb) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare a public.appointments; existing public.payments; v_amount numeric; v_method public.payment_method; v_type public.payment_type; v_request uuid; v_appointment uuid; v_operation text; v_ref text; payment_id uuid; received numeric;
begin
 perform private.require_payment_permission('payments.create'); perform private.appointment_lock(); perform private.require_payment_permission('payments.create');
 if p_input is null or jsonb_typeof(p_input)<>'object' or p_input-array['appointment_id','type','method','amount','operation_code','external_ref','request_id']<>'{}'::jsonb then raise exception 'Campos de pago no admitidos' using errcode='22023'; end if;
 if coalesce(p_input->>'amount','') !~ '^[0-9]+([.][0-9]{1,2})?$' then raise exception 'Importe positivo con máximo dos decimales' using errcode='22023'; end if;
 v_amount:=(p_input->>'amount')::numeric; v_method:=(p_input->>'method')::public.payment_method; v_type:=(p_input->>'type')::public.payment_type;
 v_request:=(p_input->>'request_id')::uuid; v_appointment:=(p_input->>'appointment_id')::uuid;
 v_operation:=nullif(btrim(p_input->>'operation_code'),''); v_ref:=nullif(btrim(p_input->>'external_ref'),'');
 if v_amount<=0 or v_amount>='Infinity'::numeric or v_method is null or v_type is distinct from 'BALANCE'::public.payment_type or v_request is null or v_appointment is null or length(v_operation)>120 or length(v_ref)>120 then raise exception 'Datos de cobro inválidos; solo saldo final interno' using errcode='22023'; end if;
 select * into existing from public.payments where request_id=v_request;
 if found then
  if existing.created_by<>auth.uid() or existing.appointment_id<>v_appointment or existing.type<>v_type or existing.method<>v_method or existing.amount<>v_amount or existing.operation_code is distinct from v_operation or existing.external_ref is distinct from v_ref then raise exception 'La clave de reintento ya tiene otro contenido o autor' using errcode='22023'; end if;
  return private.payment_json(existing.id);
 end if;
 select * into a from public.appointments where id=v_appointment;
 if not found or a.source<>'INTERNAL' or a.status<>'COMPLETED' then raise exception 'Solo se cobra una cita interna completada' using errcode='22023'; end if;
 select coalesce(sum(amount),0) into received from public.payments where appointment_id=a.id and status='PAID' and type in ('DEPOSIT','BALANCE');
 if v_amount>a.total_price-received then raise exception 'El importe supera el saldo disponible' using errcode='22023'; end if;
 insert into public.payments(appointment_id,type,method,amount,operation_code,external_ref,created_by,request_id) values(a.id,v_type,v_method,v_amount,v_operation,v_ref,auth.uid(),v_request) returning id into payment_id;
 return private.payment_json(payment_id);
end $$;
create function public.verify_payment(p_id uuid,p_expected_version integer) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare p public.payments; a public.appointments; received numeric;
begin
 perform private.require_payment_permission('payments.verify'); perform private.appointment_lock(); perform private.require_payment_permission('payments.verify');
 select * into p from public.payments where id=p_id;
 if not found then raise exception 'Pago no encontrado' using errcode='22023'; end if;
 if p.version is distinct from p_expected_version then raise exception 'El pago cambió; recarga y revisa' using errcode='40001'; end if;
 if p.status<>'PENDING' or p.type<>'BALANCE' then raise exception 'Solo se verifica un cobro pendiente' using errcode='22023'; end if;
 select * into a from public.appointments where id=p.appointment_id;
 if a.source<>'INTERNAL' or a.status<>'COMPLETED' then raise exception 'La cita no admite cobros' using errcode='22023'; end if;
 select coalesce(sum(amount),0) into received from public.payments where appointment_id=a.id and status='PAID' and type in ('DEPOSIT','BALANCE');
 if p.amount>a.total_price-received then raise exception 'Saldo cambiado; el pago supera el saldo disponible' using errcode='22023'; end if;
 update public.payments set status='PAID',verified_by=auth.uid(),paid_at=clock_timestamp(),updated_at=clock_timestamp(),version=version+1 where id=p.id;
 return private.payment_json(p.id);
end $$;
create function public.reject_payment(p_id uuid,p_expected_version integer,p_reason text) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare p public.payments;
begin
 perform private.require_payment_permission('payments.verify'); perform private.appointment_lock(); perform private.require_payment_permission('payments.verify');
 select * into p from public.payments where id=p_id;
 if not found then raise exception 'Pago no encontrado' using errcode='22023'; end if;
 if p.version is distinct from p_expected_version then raise exception 'El pago cambió; recarga y revisa' using errcode='40001'; end if;
 if p.status<>'PENDING' or nullif(btrim(p_reason),'') is null or length(btrim(p_reason))>500 then raise exception 'Pago no pendiente o motivo inválido (máximo500 caracteres)' using errcode='22023'; end if;
 update public.payments set status='FAILED',rejection_reason=btrim(p_reason),updated_at=clock_timestamp(),version=version+1 where id=p.id;
 return private.payment_json(p.id);
end $$;
-- Participa también ante escrituras administrativas privilegiadas; las RPC de agenda ya toman el mismo mutex.
create function private.protect_paid_total() returns trigger language plpgsql volatile security definer set search_path='' as $$
declare received numeric;
begin
 perform private.appointment_lock();
 select coalesce(sum(amount),0) into received from public.payments where appointment_id=new.id and status='PAID' and type in ('DEPOSIT','BALANCE');
 if new.total_price<received then raise exception 'No se puede reducir el total por debajo de lo cobrado' using errcode='22023'; end if;
 return new;
end $$;
create trigger protect_paid_total before update of total_price on public.appointments for each row execute function private.protect_paid_total();
revoke all on function private.require_payment_permission(text),private.payment_json(uuid),private.protect_paid_total() from public,anon,authenticated;
revoke all on function public.appointment_payment_summary(uuid),public.search_payments(text,uuid,public.payment_status,public.payment_method,date,date,integer,integer),public.register_payment(jsonb),public.verify_payment(uuid,integer),public.reject_payment(uuid,integer,text) from public,anon;
grant execute on function public.appointment_payment_summary(uuid),public.search_payments(text,uuid,public.payment_status,public.payment_method,date,date,integer,integer),public.register_payment(jsonb),public.verify_payment(uuid,integer),public.reject_payment(uuid,integer,text) to authenticated;
