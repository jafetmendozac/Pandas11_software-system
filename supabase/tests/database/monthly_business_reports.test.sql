begin;
select no_plan();

select set_config('test.reports.owner', gen_random_uuid()::text, true);
select set_config('test.reports.admin', gen_random_uuid()::text, true);
select set_config('test.reports.staff', gen_random_uuid()::text, true);
select set_config('test.reports.client', gen_random_uuid()::text, true);
select set_config('test.reports.custom', gen_random_uuid()::text, true);
select set_config('test.reports.customer1', gen_random_uuid()::text, true);
select set_config('test.reports.customer2', gen_random_uuid()::text, true);
select set_config('test.reports.appointment1', gen_random_uuid()::text, true);

insert into auth.users(id, email, raw_user_meta_data)
select current_setting('test.reports.' || kind)::uuid,
       kind || '-' || current_setting('test.reports.' || kind) || '@example.test', '{}'::jsonb
from unnest(array['owner', 'admin', 'staff', 'client', 'custom']) kind;
insert into public.user_roles(user_id, role_id)
select current_setting('test.reports.' || lower(r.code))::uuid, r.id
from public.roles r where r.code in ('OWNER', 'ADMIN', 'STAFF');
insert into public.roles(code, name) values ('REPORT_CUSTOM', 'Rol de reporte sintético');
insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'REPORT_CUSTOM' and p.code = 'analytics.read';
insert into public.user_roles(user_id, role_id)
select current_setting('test.reports.custom')::uuid, id from public.roles where code = 'REPORT_CUSTOM';

insert into public.clients(id, first_name) values
 (current_setting('test.reports.customer1')::uuid, 'Cliente Uno'),
 (current_setting('test.reports.customer2')::uuid, 'Cliente Dos');
insert into public.appointments(id, client_id, starts_at, ends_at, status, total_price, created_by, cancelled_at, cancelled_by, cancel_reason)
values
 (current_setting('test.reports.appointment1')::uuid, current_setting('test.reports.customer1')::uuid,
  '2025-12-01 05:00:00+00', '2025-12-01 06:00:00+00', 'COMPLETED', 10, current_setting('test.reports.owner')::uuid, null, null, null),
 (gen_random_uuid(), current_setting('test.reports.customer1')::uuid,
  '2025-12-15 14:00:00+00', '2025-12-15 15:00:00+00', 'COMPLETED', 10, current_setting('test.reports.owner')::uuid, null, null, null),
 (gen_random_uuid(), current_setting('test.reports.customer2')::uuid,
  '2026-01-01 04:59:59+00', '2026-01-01 05:59:59+00', 'COMPLETED', 10, current_setting('test.reports.owner')::uuid, null, null, null),
 (gen_random_uuid(), current_setting('test.reports.customer1')::uuid,
  '2026-01-01 05:00:00+00', '2026-01-01 06:00:00+00', 'COMPLETED', 10, current_setting('test.reports.owner')::uuid, null, null, null),
 (gen_random_uuid(), current_setting('test.reports.customer1')::uuid,
  '2026-01-15 14:00:00+00', '2026-01-15 15:00:00+00', 'COMPLETED', 10, current_setting('test.reports.owner')::uuid, null, null, null),
 (gen_random_uuid(), current_setting('test.reports.customer2')::uuid,
  '2026-01-16 14:00:00+00', '2026-01-16 15:00:00+00', 'CANCELLED', 10, current_setting('test.reports.owner')::uuid,
  now(), current_setting('test.reports.owner')::uuid, 'Cancelada');
update public.clients set deleted_at = now() where id = current_setting('test.reports.customer1')::uuid;

insert into public.payments(appointment_id, type, method, status, amount,
 verified_by, paid_at, created_by, request_id)
values (current_setting('test.reports.appointment1')::uuid, 'BALANCE', 'YAPE', 'PAID', 10.25,
 current_setting('test.reports.owner')::uuid, '2026-01-01 05:00:00+00',
 current_setting('test.reports.owner')::uuid, gen_random_uuid());

select set_config('request.jwt.claim.sub', current_setting('test.reports.owner'), true);
set local role authenticated;
select is(public.monthly_business_reports('2025-12-01','2026-01-01')->>'timezone', 'America/Lima', 'Periodo Lima');
select is(jsonb_array_length(public.monthly_business_reports('2025-12-01','2026-01-01')->'rows'), 2, 'Rango inclusivo de dos meses');
select is(public.monthly_business_reports('2025-12-01','2026-01-01')->'rows'->0->>'month', '2025-12', 'Cruza el año en orden');
select is((public.monthly_business_reports('2025-12-01','2026-01-01')->'rows'->0->>'completed_appointments')::integer, 3, 'Diciembre incluye frontera Lima');
select is((public.monthly_business_reports('2025-12-01','2026-01-01')->'rows'->1->>'completed_appointments')::integer, 2, 'Enero excluye citas canceladas');
select is((public.monthly_business_reports('2025-12-01','2026-01-01')->'rows'->1->>'previous_clients')::integer, 2, 'Base de clientes distintos, incluso dados de baja');
select is((public.monthly_business_reports('2025-12-01','2026-01-01')->'rows'->1->>'returning_clients')::integer, 1, 'Repetición de cliente sin multiplicar citas');
select is(public.monthly_business_reports('2025-12-01','2026-01-01')->'rows'->1->>'retention_rate', '50.00', 'Porcentaje exacto');
select is(public.monthly_business_reports('2025-10-01','2025-10-01')->'rows'->0->>'retention_rate', null, 'Sin base se devuelve tasa nula');
select is(public.monthly_business_reports('2026-01-01','2026-01-01')->'rows'->0->>'total_collections', public.dashboard_kpis('2026-01-01')->>'total_collections', 'Cobros coinciden con KPI');
select is(public.monthly_business_reports('2026-01-01','2026-01-01')->'rows'->0->>'total_collections', '10.25', 'Cobro exacto en borde Lima');
select ok(not (public.monthly_business_reports('2026-01-01','2026-01-01')::text ~ 'Cliente Uno|customer1|client_id'), 'No expone datos personales');
select throws_ok($$select public.monthly_business_reports(null, '2026-01-01')$$, '22023', null, 'Rechaza nulo');
select throws_ok($$select public.monthly_business_reports('2026-01-02','2026-01-01')$$, '22023', null, 'Rechaza día no inicial');
select throws_ok($$select public.monthly_business_reports('2026-02-01','2026-01-01')$$, '22023', null, 'Rechaza rango invertido');
select throws_ok($$select public.monthly_business_reports('2025-01-01','2026-01-01')$$, '22023', null, 'Rechaza más de doce meses');
select throws_ok($$select public.monthly_business_reports('2097-01-01','2097-01-01')$$, '22023', null, 'Rechaza mes futuro');
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.reports.admin'), true);
set local role authenticated;
select is(jsonb_array_length(public.monthly_business_reports('2026-01-01','2026-01-01')->'rows'), 1, 'ADMIN consulta');
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.reports.staff'), true);
set local role authenticated;
select throws_ok($$select public.monthly_business_reports('2026-01-01','2026-01-01')$$, '42501', null, 'STAFF denegado');
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.reports.client'), true);
set local role authenticated;
select throws_ok($$select public.monthly_business_reports('2026-01-01','2026-01-01')$$, '42501', null, 'CLIENT denegado');
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.reports.custom'), true);
set local role authenticated;
select throws_ok($$select public.monthly_business_reports('2026-01-01','2026-01-01')$$, '42501', null, 'Permiso delegado insuficiente');
reset role;

select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select throws_ok($$select public.monthly_business_reports('2026-01-01','2026-01-01')$$, '42501', null, 'Anon sin EXECUTE');
reset role;

select * from finish();
rollback;
