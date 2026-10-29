begin;
select no_plan();

select set_config('test.da.owner', gen_random_uuid()::text, true);
select set_config('test.da.admin', gen_random_uuid()::text, true);
select set_config('test.da.staff', gen_random_uuid()::text, true);
select set_config('test.da.client', gen_random_uuid()::text, true);
select set_config('test.da.custom', gen_random_uuid()::text, true);
select set_config('test.da.customer', gen_random_uuid()::text, true);
select set_config('test.da.pet1', gen_random_uuid()::text, true);
select set_config('test.da.pet2', gen_random_uuid()::text, true);
select set_config('test.da.appointment', gen_random_uuid()::text, true);
select set_config('test.da.no_show_appt', gen_random_uuid()::text, true);
select set_config('test.da.sale', gen_random_uuid()::text, true);
select set_config('test.da.restock_sale', gen_random_uuid()::text, true);
select set_config('test.da.no_restock_sale', gen_random_uuid()::text, true);

insert into auth.users(id, email, raw_user_meta_data)
select current_setting('test.da.' || kind)::uuid,
       kind || '-' || current_setting('test.da.' || kind) || '@example.test', '{}'::jsonb
from unnest(array['owner', 'admin', 'staff', 'client', 'custom']) kind;
insert into public.user_roles(user_id, role_id)
select current_setting('test.da.' || lower(r.code))::uuid, r.id
from public.roles r where r.code in ('OWNER', 'ADMIN', 'STAFF');
insert into public.roles(code, name) values ('DA_CUSTOM', 'Rol gráfico sintético');
insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'DA_CUSTOM' and p.code = 'analytics.read';
insert into public.user_roles(user_id, role_id)
select current_setting('test.da.custom')::uuid, id from public.roles where code = 'DA_CUSTOM';

insert into public.clients(id, first_name)
values (current_setting('test.da.customer')::uuid, 'Lucía');
insert into public.pets(id, client_id, name)
values (current_setting('test.da.pet1')::uuid, current_setting('test.da.customer')::uuid, 'Milo'),
       (current_setting('test.da.pet2')::uuid, current_setting('test.da.customer')::uuid, 'Luna');
insert into public.services(name, base_price, base_duration_minutes, active)
select 'Servicio gráfico ' || n, 10.00, 30, n <> 1 from generate_series(1, 6) n;
select set_config('test.da.service1', id::text, true)
from public.services where name = 'Servicio gráfico 1';
insert into public.appointments(id, client_id, starts_at, ends_at, status, total_price, created_by)
values (current_setting('test.da.appointment')::uuid, current_setting('test.da.customer')::uuid,
        '2098-01-01 05:00:00+00', '2098-01-01 09:00:00+00', 'COMPLETED', 70.00,
        current_setting('test.da.owner')::uuid),
       (current_setting('test.da.no_show_appt')::uuid, current_setting('test.da.customer')::uuid,
        '2098-01-15 15:00:00+00', '2098-01-15 16:00:00+00', 'NO_SHOW', 10.00,
        current_setting('test.da.owner')::uuid);
insert into public.appointment_items(appointment_id, pet_id, client_id, service_id,
 price, duration_minutes, requires_specialist_snapshot)
select current_setting('test.da.appointment')::uuid, current_setting('test.da.pet1')::uuid,
 current_setting('test.da.customer')::uuid, s.id, 10.00, 30, false
from public.services s where s.name like 'Servicio gráfico %';
insert into public.appointment_items(appointment_id, pet_id, client_id, service_id,
 price, duration_minutes, requires_specialist_snapshot)
values (current_setting('test.da.appointment')::uuid, current_setting('test.da.pet2')::uuid,
 current_setting('test.da.customer')::uuid, current_setting('test.da.service1')::uuid,
 10.00, 30, false);
insert into public.appointment_items(appointment_id, pet_id, client_id, service_id,
 price, duration_minutes, requires_specialist_snapshot)
select current_setting('test.da.no_show_appt')::uuid, current_setting('test.da.pet1')::uuid,
 current_setting('test.da.customer')::uuid, s.id, 10.00, 30, false
from public.services s where s.name = 'Servicio gráfico 2';
insert into public.employees(profile_id, skill_level)
values (current_setting('test.da.owner')::uuid, 'ALL_SERVICES');
insert into public.appointment_item_staff(item_id, employee_id, stage, starts_at, ends_at)
select i.id, e.id, st.stage, st.starts_at, st.ends_at
from public.appointment_items i
join public.employees e on e.profile_id = current_setting('test.da.owner')::uuid
cross join (values
 ('BATH', '2098-01-01 05:00:00+00'::timestamptz, '2098-01-01 05:15:00+00'::timestamptz),
 ('CUT', '2098-01-01 05:15:00+00'::timestamptz, '2098-01-01 05:30:00+00'::timestamptz)
) st(stage, starts_at, ends_at)
where i.appointment_id = current_setting('test.da.appointment')::uuid
 and i.pet_id = current_setting('test.da.pet1')::uuid
 and i.service_id = current_setting('test.da.service1')::uuid;

insert into public.payments(appointment_id, type, method, status, amount,
 verified_by, paid_at, created_by, request_id)
values
 (current_setting('test.da.appointment')::uuid, 'BALANCE', 'YAPE', 'PAID', 10.20,
  current_setting('test.da.owner')::uuid, '2098-01-01 05:00:00+00',
  current_setting('test.da.owner')::uuid, gen_random_uuid()),
 (current_setting('test.da.appointment')::uuid, 'BALANCE', 'CASH', 'PAID', 2.30,
  current_setting('test.da.owner')::uuid, '2098-02-01 04:59:59+00',
  current_setting('test.da.owner')::uuid, gen_random_uuid()),
 (current_setting('test.da.appointment')::uuid, 'BALANCE', 'PLIN', 'PAID', 3.45,
  current_setting('test.da.owner')::uuid, '2097-02-01 05:00:00+00',
  current_setting('test.da.owner')::uuid, gen_random_uuid()),
 (current_setting('test.da.appointment')::uuid, 'BALANCE', 'CARD', 'PAID', 0.99,
  current_setting('test.da.owner')::uuid, '2097-02-01 04:59:59+00',
  current_setting('test.da.owner')::uuid, gen_random_uuid()),
 (current_setting('test.da.appointment')::uuid, 'REFUND', 'CASH', 'PAID', 5.00,
  current_setting('test.da.owner')::uuid, '2098-01-15 05:00:00+00',
  current_setting('test.da.owner')::uuid, gen_random_uuid());

insert into public.products(name, price)
select 'Producto gráfico ' || n, 1.00 from generate_series(1, 6) n;
insert into public.sales(id, client_id, status, total, request_id, request_payload, created_by,
 cancelled_by, cancelled_at, cancel_reason, inventory_disposition)
values
 (current_setting('test.da.sale')::uuid, current_setting('test.da.customer')::uuid,
  'CONFIRMED', 21.00, gen_random_uuid(), '{}'::jsonb, current_setting('test.da.owner')::uuid,
  null, null, null, null),
 (current_setting('test.da.restock_sale')::uuid, current_setting('test.da.customer')::uuid,
  'CANCELLED', 4.00, gen_random_uuid(), '{}'::jsonb, current_setting('test.da.owner')::uuid,
  current_setting('test.da.owner')::uuid, now(), 'Anulada y repuesta', 'RESTOCK'),
 (current_setting('test.da.no_restock_sale')::uuid, current_setting('test.da.customer')::uuid,
  'CANCELLED', 5.00, gen_random_uuid(), '{}'::jsonb, current_setting('test.da.owner')::uuid,
  current_setting('test.da.owner')::uuid, now(), 'Anulada sin reposición', 'NO_RESTOCK');
insert into public.sale_items(sale_id, kind, product_id, description, unit, quantity, unit_price)
select current_setting('test.da.sale')::uuid, 'PRODUCT', p.id, p.name, 'UNIT',
 (right(p.name, 1))::integer, 1.00
from public.products p where p.name like 'Producto gráfico %';
insert into public.sale_items(sale_id, kind, product_id, description, unit, quantity, unit_price)
select current_setting('test.da.restock_sale')::uuid, 'PRODUCT', p.id, p.name, 'UNIT', 4, 1.00
from public.products p where p.name = 'Producto gráfico 6';
insert into public.sale_items(sale_id, kind, product_id, description, unit, quantity, unit_price)
select current_setting('test.da.no_restock_sale')::uuid, 'PRODUCT', p.id, p.name, 'UNIT', 5, 1.00
from public.products p where p.name = 'Producto gráfico 5';
insert into public.inventory_movements(product_id, kind, delta, balance_before,
 balance_after, reason, created_by, created_at, sale_id, sale_item_id)
select i.product_id, 'SALE', -i.quantity, i.quantity, 0, 'Venta sintética',
 current_setting('test.da.owner')::uuid, '2098-01-15 15:00:00+00', i.sale_id, i.id
from public.sale_items i
where i.sale_id in (current_setting('test.da.sale')::uuid,
 current_setting('test.da.restock_sale')::uuid,
 current_setting('test.da.no_restock_sale')::uuid);
insert into public.inventory_movements(product_id, kind, delta, balance_before,
 balance_after, reason, created_by, created_at, sale_id, sale_item_id)
select i.product_id, 'CANCELLATION', 4, 0, 4, 'Reposición sintética',
 current_setting('test.da.owner')::uuid, '2098-01-16 15:00:00+00', i.sale_id, i.id
from public.sale_items i where i.sale_id = current_setting('test.da.restock_sale')::uuid;
insert into public.sale_payments(sale_id, method, status, amount, verified_by,
 paid_at, created_by, request_id)
values
 (current_setting('test.da.sale')::uuid, 'CASH', 'PAID', 7.05,
  current_setting('test.da.owner')::uuid, '2098-01-15 15:00:00+00',
  current_setting('test.da.owner')::uuid, gen_random_uuid()),
 (current_setting('test.da.restock_sale')::uuid, 'YAPE', 'PAID', 1.25,
  current_setting('test.da.owner')::uuid, '2098-01-20 15:00:00+00',
  current_setting('test.da.owner')::uuid, gen_random_uuid());

select set_config('request.jwt.claim.sub', current_setting('test.da.owner'), true);
set local role authenticated;
select is(public.dashboard_analytics('2098-01-01'::date)->>'month', '2098-01', 'Mes seleccionado');
select is(jsonb_array_length(public.dashboard_analytics('2098-01-01'::date)->'trend'), 12, 'Doce meses de tendencia');
select is(public.dashboard_analytics('2098-01-01'::date)->'trend'->0->>'month', '2097-02', 'La serie cruza de año');
select is(public.dashboard_analytics('2098-01-01'::date)->'trend'->0->>'service_collections', '3.45', 'Primera frontera Lima incluida');
select is(public.dashboard_analytics('2098-01-01'::date)->'trend'->11->>'month', '2098-01', 'Último mes seleccionado');
select is(public.dashboard_analytics('2098-01-01'::date)->'trend'->11->>'service_collections', '12.50', 'Cobros de servicio exactos');
select is(public.dashboard_analytics('2098-01-01'::date)->'trend'->11->>'product_collections', '8.30', 'Cobro de venta anulada permanece');
select is(public.dashboard_analytics('2098-01-01'::date)->'kpis'->>'total_collections', '20.80', 'Tarjeta coincide con serie sin duplicar');
select is(public.dashboard_analytics('2098-01-01'::date)->'trend'->10->>'product_collections', '0.00', 'Mes vacío de tendencia en cero');
select is(jsonb_array_length(public.dashboard_analytics('2098-01-01'::date)->'services'), 5, 'Cinco servicios más frecuentes');
select is((public.dashboard_analytics('2098-01-01'::date)->'services'->0->>'quantity')::integer, 2, 'Dos mascotas; las etapas no duplican el servicio');
select is(public.dashboard_analytics('2098-01-01'::date)->'services'->0->>'name', 'Servicio gráfico 1', 'Servicio inactivo conserva conteo');
select ok((public.dashboard_analytics('2098-01-01'::date)->'services'->1->>'service_id')::uuid
 < (public.dashboard_analytics('2098-01-01'::date)->'services'->2->>'service_id')::uuid,
 'Empates de servicios se ordenan por ID; NO_SHOW no altera conteos');
select is(jsonb_array_length(public.dashboard_analytics('2098-01-01'::date)->'products'), 5, 'Cinco productos más vendidos');
select is((public.dashboard_analytics('2098-01-01'::date)->'products'->0->>'quantity')::integer, 6, 'Venta confirmada cuenta seis unidades; anulada no suma');
select is(public.dashboard_analytics('2098-01-01'::date)->'products'->0->>'name', 'Producto gráfico 6', 'Ranking ordenado por unidades');
select is(jsonb_array_length(public.dashboard_analytics('2096-01-01'::date)->'services'), 0, 'Mes vacío sin servicios');
select is(jsonb_array_length(public.dashboard_analytics('2096-01-01'::date)->'products'), 0, 'Mes vacío sin productos');
select is((public.dashboard_analytics('2098-01-01'::date) ? 'client_name')::text, 'false', 'Sin datos personales');
select throws_ok($$select public.dashboard_analytics('2098-01-02'::date)$$, '22023', null, 'Rechaza día distinto al primero');
select throws_ok($$select public.dashboard_analytics(null::date)$$, '22023', null, 'Rechaza mes nulo');
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.da.admin'), true);
set local role authenticated;
select is(public.dashboard_analytics('2098-01-01'::date)->'kpis'->>'total_collections', '20.80', 'ADMIN consulta');
reset role;
select set_config('request.jwt.claim.sub', current_setting('test.da.staff'), true);
set local role authenticated;
select throws_ok($$select public.dashboard_analytics('2098-01-01'::date)$$, '42501', null, 'STAFF denegado');
reset role;
select set_config('request.jwt.claim.sub', current_setting('test.da.client'), true);
set local role authenticated;
select throws_ok($$select public.dashboard_analytics('2098-01-01'::date)$$, '42501', null, 'CLIENT denegado');
reset role;
select set_config('request.jwt.claim.sub', current_setting('test.da.custom'), true);
set local role authenticated;
select throws_ok($$select public.dashboard_analytics('2098-01-01'::date)$$, '42501', null, 'Permiso delegado sin OWNER/ADMIN denegado');
reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select throws_ok($$select public.dashboard_analytics('2098-01-01'::date)$$, '42501', null, 'Anónimo denegado');
reset role;
update public.profiles set active = false where id = current_setting('test.da.owner')::uuid;
select set_config('request.jwt.claim.sub', current_setting('test.da.owner'), true);
set local role authenticated;
select throws_ok($$select public.dashboard_analytics('2098-01-01'::date)$$, '42501', null, 'Perfil inactivo denegado');
reset role;

select * from finish();
rollback;
