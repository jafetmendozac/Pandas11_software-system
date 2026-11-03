begin;
select no_plan();

select set_config('test.kpi.owner', gen_random_uuid()::text, true);
select set_config('test.kpi.admin', gen_random_uuid()::text, true);
select set_config('test.kpi.staff', gen_random_uuid()::text, true);
select set_config('test.kpi.custom', gen_random_uuid()::text, true);
select set_config('test.kpi.client', gen_random_uuid()::text, true);
select set_config('test.kpi.customer', gen_random_uuid()::text, true);
select set_config('test.kpi.appointment', gen_random_uuid()::text, true);
select set_config('test.kpi.sale', gen_random_uuid()::text, true);
select set_config('test.kpi.payment', gen_random_uuid()::text, true);

insert into auth.users(id, email, raw_user_meta_data)
select current_setting('test.kpi.' || kind)::uuid,
       kind || '-' || current_setting('test.kpi.' || kind) || '@example.test', '{}'::jsonb
from unnest(array['owner', 'admin', 'staff', 'custom', 'client']) kind;

insert into public.user_roles(user_id, role_id)
select current_setting('test.kpi.' || lower(r.code))::uuid, r.id
from public.roles r where r.code in ('OWNER', 'ADMIN', 'STAFF');
insert into public.roles(code, name) values ('KPI_CUSTOM', 'Rol de indicadores sintético');
insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'KPI_CUSTOM' and p.code = 'analytics.read';
insert into public.user_roles(user_id, role_id)
select current_setting('test.kpi.custom')::uuid, id from public.roles where code = 'KPI_CUSTOM';

insert into public.clients(id, first_name)
values (current_setting('test.kpi.customer')::uuid, 'Elena');
insert into public.appointments(id, client_id, starts_at, ends_at, status, total_price, created_by)
values
 (current_setting('test.kpi.appointment')::uuid, current_setting('test.kpi.customer')::uuid,
  '2097-10-01 05:00:00+00', '2097-10-01 06:00:00+00', 'COMPLETED', 30.00, current_setting('test.kpi.owner')::uuid),
 (gen_random_uuid(), current_setting('test.kpi.customer')::uuid,
  '2097-11-01 04:59:59+00', '2097-11-01 05:59:59+00', 'COMPLETED', 0, current_setting('test.kpi.owner')::uuid),
 (gen_random_uuid(), current_setting('test.kpi.customer')::uuid,
  '2097-11-01 05:00:00+00', '2097-11-01 06:00:00+00', 'COMPLETED', 0, current_setting('test.kpi.owner')::uuid),
 (gen_random_uuid(), current_setting('test.kpi.customer')::uuid,
  '2097-10-15 15:00:00+00', '2097-10-15 16:00:00+00', 'NO_SHOW', 0, current_setting('test.kpi.owner')::uuid);

insert into public.payments(id, appointment_id, type, method, status, amount,
 verified_by, paid_at, created_by, request_id, rejection_reason)
values
 (current_setting('test.kpi.payment')::uuid, current_setting('test.kpi.appointment')::uuid,
  'BALANCE', 'YAPE', 'PAID', 10.20, current_setting('test.kpi.owner')::uuid,
  '2097-10-01 05:00:00+00', current_setting('test.kpi.owner')::uuid, gen_random_uuid(), null),
 (gen_random_uuid(), current_setting('test.kpi.appointment')::uuid,
  'BALANCE', 'CASH', 'PAID', 2.30, current_setting('test.kpi.owner')::uuid,
  '2097-11-01 04:59:59+00', current_setting('test.kpi.owner')::uuid, gen_random_uuid(), null),
 (gen_random_uuid(), current_setting('test.kpi.appointment')::uuid,
  'BALANCE', 'PLIN', 'PAID', 1.00, current_setting('test.kpi.owner')::uuid,
  '2097-11-01 05:00:00+00', current_setting('test.kpi.owner')::uuid, gen_random_uuid(), null),
 (gen_random_uuid(), current_setting('test.kpi.appointment')::uuid,
  'BALANCE', 'CARD', 'PENDING', 8.00, null, null,
  current_setting('test.kpi.owner')::uuid, gen_random_uuid(), null),
 (gen_random_uuid(), current_setting('test.kpi.appointment')::uuid,
  'BALANCE', 'TRANSFER', 'FAILED', 2.00, null, null,
  current_setting('test.kpi.owner')::uuid, gen_random_uuid(), 'Operación no acreditada'),
 (gen_random_uuid(), current_setting('test.kpi.appointment')::uuid,
  'REFUND', 'CASH', 'PAID', 1.00, current_setting('test.kpi.owner')::uuid,
  '2097-10-15 15:00:00+00', current_setting('test.kpi.owner')::uuid, gen_random_uuid(), null);

insert into public.sales(id, client_id, appointment_id, status, total, request_id,
 request_payload, created_by, cancelled_by, cancelled_at, cancel_reason)
values (current_setting('test.kpi.sale')::uuid, current_setting('test.kpi.customer')::uuid,
 current_setting('test.kpi.appointment')::uuid, 'CANCELLED', 10.00, gen_random_uuid(),
 '{}'::jsonb, current_setting('test.kpi.owner')::uuid, current_setting('test.kpi.owner')::uuid,
 now(), 'Venta anulada; cobro conservado');
insert into public.sale_payments(sale_id, method, status, amount, verified_by,
 paid_at, created_by, request_id)
values
 (current_setting('test.kpi.sale')::uuid, 'CASH', 'PAID', 7.05,
  current_setting('test.kpi.owner')::uuid, '2097-10-15 15:00:00+00',
  current_setting('test.kpi.owner')::uuid, gen_random_uuid()),
 (current_setting('test.kpi.sale')::uuid, 'CASH', 'PAID', 1.25,
  current_setting('test.kpi.owner')::uuid, '2097-11-01 05:00:00+00',
  current_setting('test.kpi.owner')::uuid, gen_random_uuid());

with session as (
 insert into public.cash_sessions(status, opening_cash, opened_by, request_id,
  closed_at, closed_by, counted_cash, expected_cash, difference)
 values ('CLOSED', 0, current_setting('test.kpi.owner')::uuid, gen_random_uuid(),
  now(), current_setting('test.kpi.owner')::uuid, 0, 0, 0)
 returning id
)
select set_config('test.kpi.cash', id::text, true) from session;
insert into public.cash_movements(session_id, source, method, amount,
 appointment_payment_id, reason, created_by)
values (current_setting('test.kpi.cash')::uuid, 'APPOINTMENT_PAYMENT', 'YAPE', 10.20,
 current_setting('test.kpi.payment')::uuid, 'Cobro verificado', current_setting('test.kpi.owner')::uuid);

select set_config('request.jwt.claim.sub', current_setting('test.kpi.owner'), true);
set local role authenticated;
select is(public.dashboard_kpis('2097-10-01'::date)->>'month', '2097-10', 'Devuelve el mes solicitado');
select is(public.dashboard_kpis('2097-10-01'::date)->>'timezone', 'America/Lima', 'Periodo en Lima');
select is(public.dashboard_kpis('2097-10-01'::date)->>'service_collections', '12.50', 'Suma cobros parciales PAID, excluye REFUND');
select is(public.dashboard_kpis('2097-10-01'::date)->>'product_collections', '7.05', 'Conserva cobro PAID de venta anulada');
select is(public.dashboard_kpis('2097-10-01'::date)->>'total_collections', '19.55', 'No duplica venta mixta ni asiento de caja');
select is((public.dashboard_kpis('2097-10-01'::date)->>'completed_appointments')::integer, 2, 'Cuenta citas completadas por inicio programado');
select is(public.dashboard_kpis('2097-08-01'::date)->>'total_collections', '0.00', 'Mes vacío devuelve importe cero');
select is((public.dashboard_kpis('2097-08-01'::date)->>'completed_appointments')::integer, 0, 'Mes vacío devuelve cero citas');
select is((public.dashboard_kpis('2097-10-01'::date) ? 'client_name')::text, 'false', 'No entrega datos de clientes');
select throws_ok($$select public.dashboard_kpis('2097-10-02'::date)$$, '22023', null, 'Rechaza día distinto al primero');
select throws_ok($$select public.dashboard_kpis(null::date)$$, '22023', null, 'Rechaza mes nulo');
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.kpi.admin'), true);
set local role authenticated;
select is(public.dashboard_kpis('2097-10-01'::date)->>'total_collections', '19.55', 'ADMIN activo consulta cifras');
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.kpi.staff'), true);
set local role authenticated;
select throws_ok($$select public.dashboard_kpis('2097-10-01'::date)$$, '42501', null, 'STAFF no consulta cifras');
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.kpi.client'), true);
set local role authenticated;
select throws_ok($$select public.dashboard_kpis('2097-10-01'::date)$$, '42501', null, 'CLIENT no consulta cifras');
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.kpi.custom'), true);
set local role authenticated;
select throws_ok($$select public.dashboard_kpis('2097-10-01'::date)$$, '42501', null, 'Permiso delegado sin OWNER/ADMIN no basta');
reset role;

select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select throws_ok($$select public.dashboard_kpis('2097-10-01'::date)$$, '42501', null, 'Anónimo no ejecuta la RPC');
reset role;

update public.profiles set active = false where id = current_setting('test.kpi.owner')::uuid;
select set_config('request.jwt.claim.sub', current_setting('test.kpi.owner'), true);
set local role authenticated;
select throws_ok($$select public.dashboard_kpis('2097-10-01'::date)$$, '42501', null, 'OWNER inactivo no consulta cifras');
reset role;

select * from finish();
rollback;
