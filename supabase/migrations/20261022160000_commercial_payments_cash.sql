-- Cobros de productos y caja básica. Solo cambios incrementales sobre 4.4–4.5.
create table public.sale_payments (
 id uuid primary key default gen_random_uuid(),
 sale_id uuid not null references public.sales(id),
 method public.payment_method not null,
 status public.payment_status not null default 'PENDING',
 amount numeric not null check(amount>0 and amount<'Infinity'::numeric and amount=round(amount,2)),
 operation_code text check(operation_code is null or length(btrim(operation_code)) between 1 and 120),
 external_ref text check(external_ref is null or length(btrim(external_ref)) between 1 and 120),
 verified_by uuid references public.profiles(id),
 paid_at timestamptz,
 created_at timestamptz not null default clock_timestamp(),
 created_by uuid not null references public.profiles(id),
 version integer not null default 1 check(version>0),
 rejection_reason text check(rejection_reason is null or length(btrim(rejection_reason)) between 1 and 500),
 request_id uuid not null unique,
 constraint sale_payment_state check (
  (status='PAID' and verified_by is not null and paid_at is not null and rejection_reason is null)
  or (status='PENDING' and verified_by is null and paid_at is null and rejection_reason is null)
  or (status='FAILED' and verified_by is null and paid_at is null and rejection_reason is not null))
);
create index sale_payments_sale on public.sale_payments(sale_id,created_at desc,id desc);

create table public.cash_sessions (
 id uuid primary key default gen_random_uuid(),
 status text not null default 'OPEN' check(status in ('OPEN','CLOSED')),
 opening_cash numeric not null check(opening_cash>=0 and opening_cash<'Infinity'::numeric and opening_cash=round(opening_cash,2)),
 opened_at timestamptz not null default clock_timestamp(),
 opened_by uuid not null references public.profiles(id),
 request_id uuid not null unique,
 closed_at timestamptz,
 closed_by uuid references public.profiles(id),
 counted_cash numeric check(counted_cash>=0 and counted_cash<'Infinity'::numeric and counted_cash=round(counted_cash,2)),
 expected_cash numeric check(expected_cash>=0 and expected_cash<'Infinity'::numeric and expected_cash=round(expected_cash,2)),
 difference numeric,
 version integer not null default 1 check(version>0),
 constraint cash_session_state check(
  (status='OPEN' and closed_at is null and closed_by is null and counted_cash is null and expected_cash is null and difference is null)
  or (status='CLOSED' and closed_at is not null and closed_by is not null and counted_cash is not null and expected_cash is not null and difference=counted_cash-expected_cash))
);
create unique index cash_one_open on public.cash_sessions(status) where status='OPEN';

create table public.cash_movements (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.cash_sessions(id),
 source text not null check(source in ('APPOINTMENT_PAYMENT','SALE_PAYMENT','MANUAL_IN','MANUAL_OUT')),
 method public.payment_method not null,
 amount numeric not null check(amount<>0 and amount<'Infinity'::numeric and amount>'-Infinity'::numeric and amount=round(amount,2)),
 appointment_payment_id uuid unique references public.payments(id),
 sale_payment_id uuid unique references public.sale_payments(id),
 request_id uuid unique,
 request_payload jsonb,
 reason text not null check(length(btrim(reason)) between 1 and 500),
 created_at timestamptz not null default clock_timestamp(),
 created_by uuid not null references public.profiles(id),
 constraint cash_movement_source check(
  (source='APPOINTMENT_PAYMENT' and appointment_payment_id is not null and sale_payment_id is null and request_id is null and request_payload is null and amount>0)
  or (source='SALE_PAYMENT' and sale_payment_id is not null and appointment_payment_id is null and request_id is null and request_payload is null and amount>0)
  or (source='MANUAL_IN' and method='CASH' and amount>0 and appointment_payment_id is null and sale_payment_id is null and request_id is not null and request_payload is not null)
  or (source='MANUAL_OUT' and method='CASH' and amount<0 and appointment_payment_id is null and sale_payment_id is null and request_id is not null and request_payload is not null))
);
create index cash_movements_session on public.cash_movements(session_id,created_at desc,id desc);

insert into public.permissions(code,description) values
 ('sale_payments.read','Consultar cobros de productos'),
 ('sale_payments.create','Registrar cobros de productos'),
 ('sale_payments.verify','Verificar cobros de productos'),
 ('cash.read','Consultar caja'),('cash.open','Abrir caja'),('cash.close','Cerrar caja'),('cash.move','Registrar movimiento manual de caja');
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where (r.code in ('OWNER','ADMIN') and p.code in ('sale_payments.read','sale_payments.create','cash.read','cash.open','cash.close'))
or (r.code='OWNER' and p.code in ('sale_payments.verify','cash.move'));

alter table public.sale_payments enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.cash_movements enable row level security;
revoke all on public.sale_payments,public.cash_sessions,public.cash_movements from anon,authenticated;
grant select on public.sale_payments,public.cash_sessions,public.cash_movements to authenticated;
create policy sale_payments_read on public.sale_payments for select to authenticated
 using(private.sales_operator() and public.has_permission('sale_payments.read'));
create policy cash_sessions_read on public.cash_sessions for select to authenticated
 using(private.sales_operator() and public.has_permission('cash.read'));
create policy cash_movements_read on public.cash_movements for select to authenticated
 using(private.sales_operator() and public.has_permission('cash.read'));

create function private.require_commercial_permission(p_code text) returns void
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_sales_permission(p_code);
 if p_code in ('sale_payments.verify','cash.move') and not private.inventory_owner() then
  raise exception 'Solo OWNER realiza esta operación' using errcode='42501';
 end if;
end $$;

create function private.sale_product_total(p_sale uuid) returns numeric
language sql stable security definer set search_path='' as $$
 select coalesce(sum(i.line_total),0) from public.sale_items i where i.sale_id=p_sale and i.kind='PRODUCT'
$$;

create function private.sale_payment_json(p_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select to_jsonb(p)||jsonb_build_object('amount',p.amount::text,'client_name',concat_ws(' ',c.first_name,c.last_name))
 from public.sale_payments p join public.sales s on s.id=p.sale_id join public.clients c on c.id=s.client_id where p.id=p_id
$$;

create function public.sale_payment_summary(p_sale_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_commercial_permission('sale_payments.read');
 select jsonb_build_object('sale_id',s.id,'status',s.status,'sale_total',s.total::text,
  'service_total',(s.total-private.sale_product_total(s.id))::text,
  'product_total',private.sale_product_total(s.id)::text,
  'product_paid',coalesce(sum(p.amount) filter(where p.status='PAID'),0)::text,
  'product_pending',coalesce(sum(p.amount) filter(where p.status='PENDING'),0)::text,
  'product_outstanding',(private.sale_product_total(s.id)-coalesce(sum(p.amount) filter(where p.status='PAID'),0))::text,
  'appointment_paid',coalesce((select sum(ap.amount) from public.payments ap where ap.appointment_id=s.appointment_id and ap.status='PAID' and ap.type in ('DEPOSIT','BALANCE')),0)::text)
 into result from public.sales s left join public.sale_payments p on p.sale_id=s.id where s.id=p_sale_id group by s.id;
 if result is null then raise exception 'Venta no encontrada' using errcode='22023'; end if;
 return result;
end $$;

create function public.search_sale_payments(p_sale_id uuid,p_page integer default 1,p_size integer default 10) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_commercial_permission('sale_payments.read');
 with filtered as(select id,created_at from public.sale_payments where sale_id=p_sale_id),
 page as(select * from filtered order by created_at desc,id desc limit greatest(1,least(coalesce(p_size,10),100))
 offset (greatest(1,coalesce(p_page,1))-1)*greatest(1,least(coalesce(p_size,10),100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(private.sale_payment_json(id) order by created_at desc,id desc) from page),'[]'::jsonb),
 'total',(select count(*) from filtered)) into result;
 return result;
end $$;

create function public.register_sale_payment(p_input jsonb) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare s public.sales; old public.sale_payments; v_sale uuid; v_request uuid; v_amount numeric; v_method public.payment_method;
 v_operation text; v_ref text; v_paid numeric; v_id uuid;
begin
 perform private.require_commercial_permission('sale_payments.create');
 perform private.appointment_lock();
 perform private.require_commercial_permission('sale_payments.create');
 if p_input is null or jsonb_typeof(p_input)<>'object' or
 p_input-array['sale_id','amount','method','operation_code','external_ref','request_id']<>'{}'::jsonb or
 coalesce(p_input->>'amount','') !~ '^[0-9]+([.][0-9]{1,2})?$' then
  raise exception 'Datos de cobro inválidos' using errcode='22023'; end if;
 v_sale:=(p_input->>'sale_id')::uuid; v_request:=(p_input->>'request_id')::uuid;
 v_amount:=(p_input->>'amount')::numeric; v_method:=(p_input->>'method')::public.payment_method;
 v_operation:=nullif(btrim(p_input->>'operation_code'),''); v_ref:=nullif(btrim(p_input->>'external_ref'),'');
 if v_sale is null or v_request is null or v_method is null or v_amount<=0 or v_amount>='Infinity'::numeric
 or length(v_operation)>120 or length(v_ref)>120 then raise exception 'Datos de cobro inválidos' using errcode='22023'; end if;
 select * into old from public.sale_payments where request_id=v_request;
 if found then
  if old.created_by<>auth.uid() or old.sale_id<>v_sale or old.amount<>v_amount or old.method<>v_method
   or old.operation_code is distinct from v_operation or old.external_ref is distinct from v_ref then
   raise exception 'Reintento con otro contenido o autor' using errcode='22023'; end if;
  return private.sale_payment_json(old.id);
 end if;
 select * into s from public.sales where id=v_sale;
 if not found or s.status<>'CONFIRMED' or private.sale_product_total(v_sale)<=0 then
  raise exception 'Solo se cobran productos de una venta confirmada' using errcode='22023'; end if;
 select coalesce(sum(amount),0) into v_paid from public.sale_payments where sale_id=v_sale and status='PAID';
 if v_amount>private.sale_product_total(v_sale)-v_paid then raise exception 'Importe superior al saldo de productos' using errcode='22023'; end if;
 insert into public.sale_payments(sale_id,method,amount,operation_code,external_ref,created_by,request_id)
 values(v_sale,v_method,v_amount,v_operation,v_ref,auth.uid(),v_request) returning id into v_id;
 return private.sale_payment_json(v_id);
end $$;

create function public.verify_sale_payment(p_id uuid,p_expected_version integer) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare p public.sale_payments; s public.sales; v_paid numeric;
begin
 perform private.require_commercial_permission('sale_payments.verify');
 perform private.appointment_lock();
 perform private.require_commercial_permission('sale_payments.verify');
 select * into p from public.sale_payments where id=p_id;
 if not found then raise exception 'Cobro no encontrado' using errcode='22023'; end if;
 if p.version is distinct from p_expected_version then raise exception 'El cobro cambió; recarga' using errcode='40001'; end if;
 if p.status<>'PENDING' then raise exception 'Solo se verifica un cobro pendiente' using errcode='22023'; end if;
 select * into s from public.sales where id=p.sale_id;
 if s.status<>'CONFIRMED' then raise exception 'Venta no confirmada' using errcode='22023'; end if;
 select coalesce(sum(amount),0) into v_paid from public.sale_payments where sale_id=p.sale_id and status='PAID';
 if p.amount>private.sale_product_total(p.sale_id)-v_paid then raise exception 'Saldo cambiado; recarga' using errcode='22023'; end if;
 update public.sale_payments set status='PAID',verified_by=auth.uid(),paid_at=clock_timestamp(),version=version+1 where id=p.id;
 return private.sale_payment_json(p.id);
end $$;

create function public.reject_sale_payment(p_id uuid,p_expected_version integer,p_reason text) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare p public.sale_payments;
begin
 perform private.require_commercial_permission('sale_payments.verify');
 perform private.appointment_lock();
 perform private.require_commercial_permission('sale_payments.verify');
 select * into p from public.sale_payments where id=p_id;
 if not found then raise exception 'Cobro no encontrado' using errcode='22023'; end if;
 if p.version is distinct from p_expected_version then raise exception 'El cobro cambió; recarga' using errcode='40001'; end if;
 if p.status<>'PENDING' or p_reason is null or length(btrim(p_reason)) not between 1 and 500 then
  raise exception 'Cobro no pendiente o motivo inválido' using errcode='22023'; end if;
 update public.sale_payments set status='FAILED',rejection_reason=btrim(p_reason),version=version+1 where id=p.id;
 return private.sale_payment_json(p.id);
end $$;

create function private.cash_session_json(p_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select to_jsonb(s)||jsonb_build_object(
  'opening_cash',s.opening_cash::text,'counted_cash',s.counted_cash::text,
  'expected_cash',coalesce(s.expected_cash,s.opening_cash+coalesce((select sum(m.amount) from public.cash_movements m where m.session_id=s.id and m.method='CASH'),0))::text,
  'difference',s.difference::text,
  'totals',coalesce((select jsonb_object_agg(method,total::text) from
   (select method,sum(amount) total from public.cash_movements where session_id=s.id group by method) t),'{}'::jsonb))
 from public.cash_sessions s where s.id=p_id
$$;

create function public.cash_overview(p_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v_id uuid;
begin
 perform private.require_commercial_permission('cash.read');
 if p_id is null then select id into v_id from public.cash_sessions order by (status='OPEN') desc,opened_at desc,id desc limit 1;
 else v_id:=p_id; end if;
 if v_id is null then return null; end if;
 if not exists(select 1 from public.cash_sessions where id=v_id) then raise exception 'Caja no encontrada' using errcode='22023'; end if;
 return private.cash_session_json(v_id);
end $$;

create function public.search_cash_sessions(p_page integer default 1,p_size integer default 10) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_commercial_permission('cash.read');
 with page as(select id,opened_at from public.cash_sessions order by opened_at desc,id desc
 limit greatest(1,least(coalesce(p_size,10),100)) offset (greatest(1,coalesce(p_page,1))-1)*greatest(1,least(coalesce(p_size,10),100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(private.cash_session_json(id) order by opened_at desc,id desc) from page),'[]'::jsonb),
 'total',(select count(*) from public.cash_sessions)) into result;
 return result;
end $$;

create function public.search_cash_movements(p_session_id uuid,p_page integer default 1,p_size integer default 10) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_commercial_permission('cash.read');
 with filtered as(select * from public.cash_movements where session_id=p_session_id),
 page as(select * from filtered order by created_at desc,id desc limit greatest(1,least(coalesce(p_size,10),100))
 offset (greatest(1,coalesce(p_page,1))-1)*greatest(1,least(coalesce(p_size,10),100)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(page)||jsonb_build_object('amount',page.amount::text) order by created_at desc,id desc) from page),'[]'::jsonb),
 'total',(select count(*) from filtered)) into result;
 return result;
end $$;

create function public.open_cash(p_opening text,p_request_id uuid) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare v_id uuid; v_opening numeric; s public.cash_sessions;
begin
 perform private.require_commercial_permission('cash.open');
 perform private.appointment_lock();
 perform private.require_commercial_permission('cash.open');
 if p_request_id is null or p_opening is null or p_opening !~ '^[0-9]+([.][0-9]{1,2})?$' then
  raise exception 'Fondo inicial inválido' using errcode='22023'; end if;
 v_opening:=p_opening::numeric;
 if v_opening>='Infinity'::numeric then raise exception 'Fondo inicial inválido' using errcode='22023'; end if;
 select * into s from public.cash_sessions where request_id=p_request_id;
 if found then
  if s.opened_by<>auth.uid() or s.opening_cash<>v_opening then raise exception 'Reintento con otro contenido o autor' using errcode='22023'; end if;
  return private.cash_session_json(s.id);
 end if;
 if exists(select 1 from public.cash_sessions where status='OPEN') then raise exception 'Ya hay una caja abierta' using errcode='22023'; end if;
 insert into public.cash_sessions(opening_cash,opened_by,request_id) values(v_opening,auth.uid(),p_request_id) returning id into v_id;
 return private.cash_session_json(v_id);
end $$;

create function public.record_cash_movement(p_input jsonb) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare v_request uuid; v_session uuid; v_amount numeric; v_source text; v_reason text;
 v_old public.cash_movements; v_id uuid; v_expected numeric;
begin
 perform private.require_commercial_permission('cash.move');
 perform private.appointment_lock();
 perform private.require_commercial_permission('cash.move');
 if p_input is null or jsonb_typeof(p_input)<>'object' or
 p_input-array['session_id','source','amount','reason','request_id']<>'{}'::jsonb or
 coalesce(p_input->>'amount','') !~ '^[0-9]+([.][0-9]{1,2})?$' then
  raise exception 'Movimiento de caja inválido' using errcode='22023'; end if;
 v_request:=(p_input->>'request_id')::uuid; v_session:=(p_input->>'session_id')::uuid;
 v_source:=p_input->>'source'; v_amount:=(p_input->>'amount')::numeric; v_reason:=btrim(p_input->>'reason');
 if v_request is null or v_session is null or v_source not in ('MANUAL_IN','MANUAL_OUT') or
 v_amount<=0 or v_amount>='Infinity'::numeric or v_reason is null or length(v_reason) not between 1 and 500 then
  raise exception 'Movimiento de caja inválido' using errcode='22023'; end if;
 select * into v_old from public.cash_movements where request_id=v_request;
 if found then
  if v_old.created_by<>auth.uid() or v_old.request_payload<>p_input then raise exception 'Reintento con otro contenido o autor' using errcode='22023'; end if;
  return to_jsonb(v_old)||jsonb_build_object('amount',v_old.amount::text);
 end if;
 perform 1 from public.cash_sessions where id=v_session and status='OPEN' for update;
 if not found then raise exception 'Caja cerrada o inexistente' using errcode='22023'; end if;
 perform private.require_commercial_permission('cash.move');
 select s.opening_cash+coalesce(sum(m.amount),0) into v_expected from public.cash_sessions s
 left join public.cash_movements m on m.session_id=s.id and m.method='CASH' where s.id=v_session group by s.id;
 if v_source='MANUAL_OUT' and v_amount>v_expected then raise exception 'Retiro mayor que efectivo esperado' using errcode='22023'; end if;
 insert into public.cash_movements(session_id,source,method,amount,request_id,request_payload,reason,created_by)
 values(v_session,v_source,'CASH',case when v_source='MANUAL_OUT' then -v_amount else v_amount end,v_request,p_input,v_reason,auth.uid()) returning id into v_id;
 return (select to_jsonb(m)||jsonb_build_object('amount',m.amount::text) from public.cash_movements m where m.id=v_id);
end $$;

create function public.close_cash(p_id uuid,p_expected_version integer,p_counted text) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare s public.cash_sessions; v_counted numeric; v_expected numeric;
begin
 perform private.require_commercial_permission('cash.close');
 perform private.appointment_lock();
 perform private.require_commercial_permission('cash.close');
 if p_counted is null or p_counted !~ '^[0-9]+([.][0-9]{1,2})?$' then raise exception 'Efectivo contado inválido' using errcode='22023'; end if;
 v_counted:=p_counted::numeric;
 if v_counted>='Infinity'::numeric then raise exception 'Efectivo contado inválido' using errcode='22023'; end if;
 select * into s from public.cash_sessions where id=p_id for update;
 if not found then raise exception 'Caja no encontrada' using errcode='22023'; end if;
 perform private.require_commercial_permission('cash.close');
 if s.status='CLOSED' and s.version=p_expected_version+1 and s.closed_by=auth.uid() and s.counted_cash=v_counted then
  return private.cash_session_json(s.id); end if;
 if s.version is distinct from p_expected_version then raise exception 'La caja cambió; recarga' using errcode='40001'; end if;
 if s.status<>'OPEN' then raise exception 'Caja ya cerrada' using errcode='22023'; end if;
 select s.opening_cash+coalesce(sum(m.amount),0) into v_expected from public.cash_sessions s
 left join public.cash_movements m on m.session_id=s.id and m.method='CASH' where s.id=p_id group by s.id;
 update public.cash_sessions set status='CLOSED',closed_at=clock_timestamp(),closed_by=auth.uid(),
 counted_cash=v_counted,expected_cash=v_expected,difference=v_counted-v_expected,version=version+1 where id=p_id;
 return private.cash_session_json(p_id);
end $$;

create function private.post_verified_payment() returns trigger
language plpgsql volatile security definer set search_path='' as $$
declare v_session uuid;
begin
 if old.status='PENDING' and new.status='PAID' then
  select id into v_session from public.cash_sessions where status='OPEN' for update;
  if v_session is null then raise exception 'Abre caja antes de verificar el cobro' using errcode='22023'; end if;
  if tg_table_name='payments' then
   insert into public.cash_movements(session_id,source,method,amount,appointment_payment_id,reason,created_by)
   values(v_session,'APPOINTMENT_PAYMENT',new.method,new.amount,new.id,'Cobro de cita verificado',auth.uid());
  else
   insert into public.cash_movements(session_id,source,method,amount,sale_payment_id,reason,created_by)
   values(v_session,'SALE_PAYMENT',new.method,new.amount,new.id,'Cobro de productos verificado',auth.uid());
  end if;
 end if;
 return new;
end $$;
create trigger post_appointment_cash after update of status on public.payments
 for each row execute function private.post_verified_payment();
create trigger post_sale_cash after update of status on public.sale_payments
 for each row execute function private.post_verified_payment();

revoke all on function private.require_commercial_permission(text),private.sale_product_total(uuid),
 private.sale_payment_json(uuid),private.cash_session_json(uuid),private.post_verified_payment() from public,anon,authenticated;
revoke all on function public.sale_payment_summary(uuid),public.search_sale_payments(uuid,integer,integer),
 public.register_sale_payment(jsonb),public.verify_sale_payment(uuid,integer),public.reject_sale_payment(uuid,integer,text),
 public.cash_overview(uuid),public.search_cash_sessions(integer,integer),public.search_cash_movements(uuid,integer,integer),
 public.open_cash(text,uuid),public.record_cash_movement(jsonb),public.close_cash(uuid,integer,text) from public,anon;
grant execute on function public.sale_payment_summary(uuid),public.search_sale_payments(uuid,integer,integer),
 public.register_sale_payment(jsonb),public.verify_sale_payment(uuid,integer),public.reject_sale_payment(uuid,integer,text),
 public.cash_overview(uuid),public.search_cash_sessions(integer,integer),public.search_cash_movements(uuid,integer,integer),
 public.open_cash(text,uuid),public.record_cash_movement(jsonb),public.close_cash(uuid,integer,text) to authenticated;

create or replace function private.sale_json(p_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select to_jsonb(s)||jsonb_build_object(
  'total',s.total::text,
  'can_cancel_products',private.inventory_owner() and public.has_permission('sales.manage'),
  'client_name',concat_ws(' ',c.first_name,c.last_name),
  'service_total',(s.total-private.sale_product_total(s.id))::text,
  'product_total',private.sale_product_total(s.id)::text,
  'confirmed_product_payments',coalesce((select sum(p.amount) from public.sale_payments p where p.sale_id=s.id and p.status='PAID'),0)::text,
  'confirmed_appointment_payments',coalesce((select sum(p.amount) from public.payments p
   where p.appointment_id=s.appointment_id and p.status='PAID' and p.type in ('DEPOSIT','BALANCE')),0)::text,
  'requires_resolution',s.status='CANCELLED' and (
   exists(select 1 from public.payments p where p.appointment_id=s.appointment_id and p.status='PAID' and p.type in ('DEPOSIT','BALANCE'))
   or exists(select 1 from public.sale_payments p where p.sale_id=s.id and p.status='PAID')),
  'items',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('unit_price',i.unit_price::text,
   'line_total',i.line_total::text) order by i.created_at,i.id) from public.sale_items i where i.sale_id=s.id),'[]'::jsonb))
 from public.sales s join public.clients c on c.id=s.client_id where s.id=p_id
$$;
