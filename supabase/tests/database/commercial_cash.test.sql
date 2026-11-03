begin;
select no_plan();
select set_config('test.com.owner',gen_random_uuid()::text,true);
select set_config('test.com.admin',gen_random_uuid()::text,true);
select set_config('test.com.staff',gen_random_uuid()::text,true);
select set_config('test.com.client',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_user_meta_data) values
 (current_setting('test.com.owner')::uuid,'c-'||current_setting('test.com.owner')||'@example.test','{}'),
 (current_setting('test.com.admin')::uuid,'c-'||current_setting('test.com.admin')||'@example.test','{}'),
 (current_setting('test.com.staff')::uuid,'c-'||current_setting('test.com.staff')||'@example.test','{}');
insert into public.user_roles select current_setting('test.com.owner')::uuid,id from public.roles where code='OWNER';
insert into public.user_roles select current_setting('test.com.admin')::uuid,id from public.roles where code='ADMIN';
insert into public.user_roles select current_setting('test.com.staff')::uuid,id from public.roles where code='STAFF';
insert into public.clients(id,first_name) values(current_setting('test.com.client')::uuid,'Fixture comercial');

select set_config('request.jwt.claim.sub',current_setting('test.com.owner'),true);
set local role authenticated;
select set_config('test.com.product',public.save_product(null,'Champú caja',null,'5.00')->>'id',true);
select is((public.set_product_minimum(current_setting('test.com.product')::uuid,2)->>'minimum_stock')::integer,2,'Mínimo configurado');
select is((public.search_low_stock('Champú caja')->>'total')::integer,1,'Stock cero activa alerta');
select set_config('test.com.input',jsonb_build_object('product_id',current_setting('test.com.product'),'kind','INITIAL','delta',3,'reason','Fixture','expected_version',1,'request_id',gen_random_uuid())::text,true);
select lives_ok($$select public.record_inventory_movement(current_setting('test.com.input')::jsonb)$$,'Carga inicial');
select is((public.search_low_stock('Champú caja')->>'total')::integer,0,'Stock mayor que mínimo elimina alerta');
select throws_ok($$select public.set_product_minimum(current_setting('test.com.product')::uuid,-1)$$,'22023',null,'Mínimo negativo rechazado');
reset role;

select set_config('request.jwt.claim.sub',current_setting('test.com.admin'),true);
set local role authenticated;
select set_config('test.com.sale',public.create_sale_draft(jsonb_build_object('request_id',gen_random_uuid(),
 'client_id',current_setting('test.com.client'),'products',jsonb_build_array(jsonb_build_object('product_id',current_setting('test.com.product'),'quantity',2))))->>'id',true);
select is(public.confirm_sale(current_setting('test.com.sale')::uuid,1)->>'status','CONFIRMED','Venta de productos confirmada');
select is((public.search_low_stock('Champú caja')->>'total')::integer,1,'Venta activa alerta al cruzar umbral');
select is((public.search_low_stock('Champú caja')->'rows'->0->>'balance_version')::integer,3,'Listado entrega versión real');
select is(public.sale_payment_summary(current_setting('test.com.sale')::uuid)->>'product_total','10.00','Subtotal de productos');
select is(public.sale_payment_summary(current_setting('test.com.sale')::uuid)->>'service_total','0.00','Mostrador sin servicios');
select set_config('test.com.pay_input',jsonb_build_object('sale_id',current_setting('test.com.sale'),'amount','4.25','method','CASH',
 'operation_code',null,'external_ref',null,'request_id',gen_random_uuid())::text,true);
select set_config('test.com.payment',public.register_sale_payment(current_setting('test.com.pay_input')::jsonb)->>'id',true);
select is(public.sale_payment_summary(current_setting('test.com.sale')::uuid)->>'product_paid','0','PENDING no reduce saldo');
select is(public.register_sale_payment(current_setting('test.com.pay_input')::jsonb)->>'id',current_setting('test.com.payment'),'Registro idempotente');
select throws_ok($$select public.register_sale_payment(current_setting('test.com.pay_input')::jsonb||'{"amount":"4.26"}')$$,'22023',null,'Reintento cambiado rechazado');
select throws_ok($$select public.verify_sale_payment(current_setting('test.com.payment')::uuid,1)$$,'42501',null,'ADMIN no verifica');
select throws_ok($$insert into public.sale_payments(sale_id,method,amount,created_by,request_id) values(current_setting('test.com.sale')::uuid,'CASH',1,current_setting('test.com.admin')::uuid,gen_random_uuid())$$,'42501',null,'DML directo denegado');
reset role;

select set_config('request.jwt.claim.sub',current_setting('test.com.staff'),true);
set local role authenticated;
select is((select count(*)::integer from public.sale_payments),0,'RLS oculta cobros a STAFF');
select throws_ok($$select public.cash_overview()$$,'42501',null,'STAFF no consulta caja');
reset role;

select set_config('request.jwt.claim.sub',current_setting('test.com.owner'),true);
set local role authenticated;
select throws_ok($$select public.verify_sale_payment(current_setting('test.com.payment')::uuid,1)$$,'22023',null,'Sin caja abierta no verifica');
select set_config('test.com.cash',public.open_cash('10.00',gen_random_uuid())->>'id',true);
select throws_ok($$select public.open_cash('0',gen_random_uuid())$$,'22023',null,'Una sola caja abierta');
select is(public.verify_sale_payment(current_setting('test.com.payment')::uuid,1)->>'status','PAID','OWNER verifica con caja');
select is(public.sale_payment_summary(current_setting('test.com.sale')::uuid)->>'product_outstanding','5.75','Saldo exacto de productos');
select is(public.cash_overview()->'totals'->>'CASH','4.25','Ingreso automático en caja');
select is((public.search_cash_movements(current_setting('test.com.cash')::uuid)->>'total')::integer,1,'Movimiento automático único');
select throws_ok($$select public.verify_sale_payment(current_setting('test.com.payment')::uuid,1)$$,'40001',null,'Versión evita doble verificación');
select throws_ok($$select public.register_sale_payment(jsonb_build_object('sale_id',current_setting('test.com.sale'),'amount','5.76','method','YAPE','request_id',gen_random_uuid()))$$,'22023',null,'No sobrecobra productos');
select set_config('test.com.move',jsonb_build_object('session_id',current_setting('test.com.cash'),'source','MANUAL_OUT','amount','3.00','reason','Cambio',
 'request_id',gen_random_uuid())::text,true);
select lives_ok($$select public.record_cash_movement(current_setting('test.com.move')::jsonb)$$,'Retiro manual OWNER');
select is(public.record_cash_movement(current_setting('test.com.move')::jsonb)->>'amount','-3.00','Retiro idempotente');
select throws_ok($$select public.record_cash_movement(current_setting('test.com.move')::jsonb||'{"amount":"4.00"}')$$,'22023',null,'Reintento manual cambiado rechazado');
select throws_ok($$select public.record_cash_movement(jsonb_build_object('session_id',current_setting('test.com.cash'),'source','MANUAL_OUT','amount','20.00','reason','Exceso','request_id',gen_random_uuid()))$$,'22023',null,'Retiro no deja efectivo negativo');
select is(public.cash_overview()->>'expected_cash','11.25','Esperado incluye fondo, cobro y retiro');
select is(public.close_cash(current_setting('test.com.cash')::uuid,1,'11.00')->>'difference','-0.25','Cierre conserva diferencia');
select is(public.close_cash(current_setting('test.com.cash')::uuid,1,'11.00')->>'status','CLOSED','Cierre idempotente');
select throws_ok($$select public.close_cash(current_setting('test.com.cash')::uuid,1,'11.01')$$,'40001',null,'Cierre no cambia contado');
select is(public.cancel_sale(current_setting('test.com.sale')::uuid,2,'Anulada con dinero','RESTOCK')->>'requires_resolution','true','Anulación conserva cobro');
select is((public.search_low_stock('Champú caja')->>'total')::integer,0,'Reposición elimina alerta');
select is((select status::text from public.sale_payments where id=current_setting('test.com.payment')::uuid),'PAID','Anulación no devuelve dinero');
select is((public.set_product_minimum(current_setting('test.com.product')::uuid,null)->>'minimum_stock'),null,'NULL desactiva alerta');
select * from finish();
rollback;
