begin;
select no_plan();
select set_config('test.sale.owner',gen_random_uuid()::text,true);
select set_config('test.sale.admin',gen_random_uuid()::text,true);
select set_config('test.sale.staff',gen_random_uuid()::text,true);
select set_config('test.sale.client',gen_random_uuid()::text,true);
select set_config('test.sale.pet',gen_random_uuid()::text,true);
select set_config('test.sale.service',gen_random_uuid()::text,true);
select set_config('test.sale.appointment',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_user_meta_data) values
 (current_setting('test.sale.owner')::uuid,'s-'||current_setting('test.sale.owner')||'@example.test','{}'),
 (current_setting('test.sale.admin')::uuid,'s-'||current_setting('test.sale.admin')||'@example.test','{}'),
 (current_setting('test.sale.staff')::uuid,'s-'||current_setting('test.sale.staff')||'@example.test','{}');
insert into public.user_roles select current_setting('test.sale.owner')::uuid,id from public.roles where code='OWNER';
insert into public.user_roles select current_setting('test.sale.admin')::uuid,id from public.roles where code='ADMIN';
insert into public.user_roles select current_setting('test.sale.staff')::uuid,id from public.roles where code='STAFF';
insert into public.clients(id,first_name) values(current_setting('test.sale.client')::uuid,'Fixture ventas');
insert into public.pets(id,client_id,name) values(current_setting('test.sale.pet')::uuid,current_setting('test.sale.client')::uuid,'Fixture');
insert into public.services(id,name,base_price,base_duration_minutes) values(current_setting('test.sale.service')::uuid,'Baño fixture',30.25,60);
insert into public.appointments(id,client_id,starts_at,ends_at,status,total_price,created_by)
 values(current_setting('test.sale.appointment')::uuid,current_setting('test.sale.client')::uuid,
 '2020-01-06 12:00+00','2020-01-06 13:00+00','COMPLETED',30.25,current_setting('test.sale.owner')::uuid);
insert into public.appointment_items(appointment_id,pet_id,client_id,service_id,price,duration_minutes,requires_specialist_snapshot)
 values(current_setting('test.sale.appointment')::uuid,current_setting('test.sale.pet')::uuid,
 current_setting('test.sale.client')::uuid,current_setting('test.sale.service')::uuid,30.25,60,false);


create function pg_temp.input_movement(p_kind text,p_delta integer,p_product uuid default current_setting('test.inv.product')::uuid) returns jsonb language sql as $$
 select jsonb_build_object('request_id',gen_random_uuid(),'product_id',p_product,'kind',p_kind,'delta',p_delta,'reason','Fixture inventario',
 'expected_version',(select version from public.inventory_balances where product_id=p_product))
$$;
select set_config('request.jwt.claim.sub',current_setting('test.sale.owner'),true);
set local role authenticated;
select set_config('test.inv.product',public.save_product(null,'Inventario fixture',null,'2.35')->>'id',true);
select is((select quantity from public.inventory_balances where product_id=current_setting('test.inv.product')::uuid),0,'Alta inicia cero');
select set_config('test.inv.input',pg_temp.input_movement('INITIAL',10)::text,true);
select set_config('test.inv.first',public.record_inventory_movement(current_setting('test.inv.input')::jsonb)->>'id',true);
select is((select quantity from public.inventory_balances where product_id=current_setting('test.inv.product')::uuid),10,'Carga inicial');
select is(public.record_inventory_movement(current_setting('test.inv.input')::jsonb)->>'id',current_setting('test.inv.first'),'Reintento misma entrada');
select throws_ok($$select public.record_inventory_movement(current_setting('test.inv.input')::jsonb||'{"delta":11}')$$,'22023',null,'No reutiliza clave con otro contenido');
select throws_ok($$select public.record_inventory_movement(pg_temp.input_movement('INITIAL',1))$$,'22023',null,'Carga inicial unica');
select throws_ok($$select public.record_inventory_movement(pg_temp.input_movement('RECEIPT',1)||'{"expected_version":1}')$$,'40001',null,'Version obsoleta');
select throws_ok($$select public.record_inventory_movement(pg_temp.input_movement('RECEIPT',1)||'{"delta":1.5}')$$,'22023',null,'No fracciones');
select throws_ok($$select public.record_inventory_movement(pg_temp.input_movement('RECEIPT',1)||'{"reason":" "}')$$,'22023',null,'Motivo obligatorio');
select throws_ok($$select public.record_inventory_movement(pg_temp.input_movement('RECEIPT',1)||'{"created_by":"forged"}')$$,'22023',null,'Actor no falsificable');
select throws_ok($$select public.record_inventory_movement(pg_temp.input_movement('ADJUSTMENT',-11))$$,'22023',null,'No stock negativo');
select throws_ok($$select public.record_inventory_movement(pg_temp.input_movement('RECEIPT',2147483647))$$,'22023',null,'No desbordamiento de saldo');
select throws_ok($$select public.record_inventory_movement(pg_temp.input_movement('RECEIPT',0))$$,'22023',null,'No cero');
select throws_ok($$update public.inventory_balances set quantity=99$$,'42501',null,'Saldo no editable directamente');
select throws_ok($$delete from public.inventory_movements$$,'42501',null,'Historial no borrable');
select throws_ok($$update public.inventory_movements set delta=99$$,'42501',null,'Historial no editable');
select is(public.search_inventory('Inventario fixture')->>'can_adjust','true','OWNER ajusta');
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.sale.admin'),true);
set local role authenticated;
select is(public.search_inventory('Inventario fixture')->>'can_adjust','false','ADMIN sin ajuste');
select lives_ok($$select public.record_inventory_movement(pg_temp.input_movement('RECEIPT',2))$$,'ADMIN recibe');
select throws_ok($$select public.record_inventory_movement(pg_temp.input_movement('ADJUSTMENT',1))$$,'42501',null,'ADMIN no ajusta');
select set_config('test.inv.sale',public.create_sale_draft(jsonb_build_object('request_id',gen_random_uuid(),'client_id',current_setting('test.sale.client'),
 'products',jsonb_build_array(jsonb_build_object('product_id',current_setting('test.inv.product'),'quantity',3))))->>'id',true);
select is((select quantity from public.inventory_balances where product_id=current_setting('test.inv.product')::uuid),12,'Borrador no descuenta');
select is(public.confirm_sale(current_setting('test.inv.sale')::uuid,1)->>'status','CONFIRMED','Mostrador confirma con stock');
select is((select quantity from public.inventory_balances where product_id=current_setting('test.inv.product')::uuid),9,'Descuenta unidades');
select lives_ok($$select public.confirm_sale(current_setting('test.inv.sale')::uuid,1)$$,'Confirmar idempotente');
select is((select count(*)::integer from public.inventory_movements where sale_id=current_setting('test.inv.sale')::uuid),1,'Una sola salida');
select throws_ok($$select public.cancel_sale(current_setting('test.inv.sale')::uuid,2,'Fixture','RESTOCK')$$,'42501',null,'ADMIN no anula productos confirmados');
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.sale.owner'),true);
set local role authenticated;
select throws_ok($$select public.cancel_sale(current_setting('test.inv.sale')::uuid,2,'Fixture')$$,'22023',null,'No omitir disposicion con firma antigua');
select lives_ok($$select public.save_product(current_setting('test.inv.product')::uuid,'Inventario fixture',null,'99',false)$$,'Desactivar preserva historia');
select throws_ok($$select public.record_inventory_movement(pg_temp.input_movement('RECEIPT',1))$$,'22023',null,'No entrada manual en inactivo');
select is(public.cancel_sale(current_setting('test.inv.sale')::uuid,2,'Fixture','RESTOCK')->>'inventory_disposition','RESTOCK','OWNER repone aunque producto inactivo');
select is((select quantity from public.inventory_balances where product_id=current_setting('test.inv.product')::uuid),12,'Reposicion total');
select lives_ok($$select public.cancel_sale(current_setting('test.inv.sale')::uuid,2,'Fixture','RESTOCK')$$,'Anulacion idempotente');
select is((select count(*)::integer from public.inventory_movements where sale_id=current_setting('test.inv.sale')::uuid),2,'Sin reposicion duplicada');
select throws_ok($$select public.cancel_sale(current_setting('test.inv.sale')::uuid,2,'Fixture','NO_RESTOCK')$$,'40001',null,'No cambia disposicion ya registrada');
select lives_ok($$select public.save_product(current_setting('test.inv.product')::uuid,'Inventario fixture',null,'99',true)$$,'Reactiva');
select lives_ok($$select public.record_inventory_movement(pg_temp.input_movement('ADJUSTMENT',-2))$$,'OWNER ajusta con trazabilidad');
select set_config('test.inv.sale2',public.create_sale_draft(jsonb_build_object('request_id',gen_random_uuid(),'client_id',current_setting('test.sale.client'),
 'products',jsonb_build_array(jsonb_build_object('product_id',current_setting('test.inv.product'),'quantity',2))))->>'id',true);
select lives_ok($$select public.confirm_sale(current_setting('test.inv.sale2')::uuid,1)$$,'Confirma segunda');
select is(public.cancel_sale(current_setting('test.inv.sale2')::uuid,2,'No recuperado','NO_RESTOCK')->>'status','CANCELLED','Anula sin reposicion');
select is((select quantity from public.inventory_balances where product_id=current_setting('test.inv.product')::uuid),8,'Sin reposicion mantiene salida');
select is((select sum(delta)::integer from public.inventory_movements where product_id=current_setting('test.inv.product')::uuid),8,'Historial reconcilia saldo');
select is(jsonb_array_length(public.search_inventory_movements(current_setting('test.inv.product')::uuid,'SALE')->'rows'),2,'Filtro de tipo');
select is(jsonb_array_length(public.search_inventory_movements(current_setting('test.inv.product')::uuid,null,null,null,current_setting('test.inv.sale')::uuid)->'rows'),2,'Filtro por venta');
select throws_ok($$select public.search_inventory_movements(null,null,now(),now()-interval '1 day')$$,'22023',null,'Rango invalido');
select set_config('test.inv.product2',public.save_product(null,'Sin stock fixture',null,'1')->>'id',true);
select set_config('test.inv.insufficient',public.create_sale_draft(jsonb_build_object('request_id',gen_random_uuid(),'client_id',current_setting('test.sale.client'),
 'products',jsonb_build_array(jsonb_build_object('product_id',current_setting('test.inv.product'),'quantity',1),jsonb_build_object('product_id',current_setting('test.inv.product2'),'quantity',1))))->>'id',true);
select throws_ok($$select public.confirm_sale(current_setting('test.inv.insufficient')::uuid,1)$$,'22023',null,'Una linea insuficiente revierte todo');
select is((select quantity from public.inventory_balances where product_id=current_setting('test.inv.product')::uuid),8,'Sin descuento parcial');
select is((select count(*)::integer from public.inventory_movements where sale_id=current_setting('test.inv.insufficient')::uuid),0,'Sin movimientos parciales');
select is(public.cancel_sale(current_setting('test.inv.insufficient')::uuid,1,'Descartado')->>'status','CANCELLED','Anula borrador sin disposicion');
select is((select quantity from public.inventory_balances where product_id=current_setting('test.inv.product')::uuid),8,'Borrador anulado no repone');
reset role;

-- Venta mixta: subtotal de servicios y cobro de cita se conservan.
select set_config('request.jwt.claim.sub',current_setting('test.sale.owner'),true);
set local role authenticated;
select set_config('test.inv.mixed',public.create_sale_draft(jsonb_build_object('request_id',gen_random_uuid(),'client_id',current_setting('test.sale.client'),
 'appointment_id',current_setting('test.sale.appointment'),'products',jsonb_build_array(jsonb_build_object('product_id',current_setting('test.inv.product'),'quantity',1))))->>'id',true);
select set_config('test.inv.payment',public.register_payment(jsonb_build_object('appointment_id',current_setting('test.sale.appointment'),
 'type','BALANCE','method','CASH','amount','10.10','request_id',gen_random_uuid()))->>'id',true);
select public.open_cash('0',gen_random_uuid());
select lives_ok($$select public.verify_payment(current_setting('test.inv.payment')::uuid,1)$$,'Pago de cita verificado');
select is(public.confirm_sale(current_setting('test.inv.mixed')::uuid,1)->>'total','129.25','Confirma total mixto mayor que subtotal de servicios');
select is(public.get_sale(current_setting('test.inv.mixed')::uuid)->>'confirmed_appointment_payments','10.10','Referencia cobro de cita');
select is(public.sale_payment_summary(current_setting('test.inv.mixed')::uuid)->>'service_total','30.25','Subtotal de servicios separado');
select is(public.sale_payment_summary(current_setting('test.inv.mixed')::uuid)->>'product_total','99','Subtotal de productos separado');
select set_config('test.inv.product_payment',public.register_sale_payment(jsonb_build_object('sale_id',current_setting('test.inv.mixed'),
 'method','YAPE','amount','20.00','request_id',gen_random_uuid()))->>'id',true);
select is(public.verify_sale_payment(current_setting('test.inv.product_payment')::uuid,1)->>'status','PAID','Cobro de producto mixto verificado');
select is(public.sale_payment_summary(current_setting('test.inv.mixed')::uuid)->>'product_outstanding','79.00','Pago de cita no reduce saldo de productos');
select is(public.get_sale(current_setting('test.inv.mixed')::uuid)->>'confirmed_appointment_payments','10.10','Cobro de productos no duplica dinero de cita');
select is((select count(*)::integer from public.payments where appointment_id=current_setting('test.sale.appointment')::uuid),1,'No crea otro pago');
select is((select unit_price::text from public.sale_items where sale_id=current_setting('test.inv.mixed')::uuid and kind='SERVICE'),'30.25','Precio de servicio preservado');
select is(public.cancel_sale(current_setting('test.inv.mixed')::uuid,2,'Mercaderia recuperada','RESTOCK')->>'requires_resolution','true','Anulacion mixta exige resolver dinero separado');
select is((select status::text from public.payments where id=current_setting('test.inv.payment')::uuid),'PAID','Dinero intacto tras reponer');
reset role;
-- Incluso un permiso de ajuste concedido a ADMIN no equivale a OWNER.
insert into public.role_permissions select r.id,p.id from public.roles r cross join public.permissions p where r.code='ADMIN' and p.code='inventory.adjust' on conflict do nothing;
select set_config('request.jwt.claim.sub',current_setting('test.sale.admin'),true);
set local role authenticated;
select throws_ok($$select public.record_inventory_movement(pg_temp.input_movement('ADJUSTMENT',1))$$,'42501',null,'ADMIN con permiso delegado no ajusta');
reset role;
-- Permisos delegados a STAFF no conceden rol comercial ni privilegio OWNER.
select set_config('test.inv.role',gen_random_uuid()::text,true);
insert into public.roles(id,code,name) values(current_setting('test.inv.role')::uuid,'INV_'||left(current_setting('test.inv.role'),8),'Fixture delegado');
insert into public.role_permissions select current_setting('test.inv.role')::uuid,id from public.permissions where code in ('sales.read','inventory.read','inventory.receive','inventory.adjust');
insert into public.user_roles values(current_setting('test.sale.staff')::uuid,current_setting('test.inv.role')::uuid);
select set_config('request.jwt.claim.sub',current_setting('test.sale.staff'),true);
set local role authenticated;
select is((select count(*)::integer from public.inventory_balances),0,'RLS STAFF aun con permiso delegado');
select throws_ok($$select public.search_inventory()$$,'42501',null,'RPC STAFF denegada');
select throws_ok($$select public.search_inventory_movements()$$,'42501',null,'Historial STAFF denegado');
reset role;
set local role anon;
select throws_ok($$select public.search_inventory()$$,'42501',null,'Anon denegado');
reset role;
select * from finish();
rollback;
