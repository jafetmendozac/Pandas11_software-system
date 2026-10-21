begin;
select plan(34);
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

select set_config('request.jwt.claim.sub',current_setting('test.sale.owner'),true);
set local role authenticated;
select set_config('test.sale.product',public.save_product(null,' Champú fixture ','SKU-FIXTURE-'||left(current_setting('test.sale.client'),8),'12.50')->>'id',true);
select is((select name from public.products where id=current_setting('test.sale.product')::uuid),'Champú fixture','Producto normalizado');
select is((select price::text from public.products where id=current_setting('test.sale.product')::uuid),'12.50','Precio exacto');
select is(public.search_products('Champú fixture')->'rows'->0->>'price','12.50','Catalogo entrega precio como texto');
select throws_ok($$select public.save_product(null,'Mal',null,'1.234')$$,'22023',null,'No redondea precio');
reset role;

select set_config('request.jwt.claim.sub',current_setting('test.sale.admin'),true);
set local role authenticated;
select set_config('test.sale.input',jsonb_build_object('request_id',gen_random_uuid(),'client_id',current_setting('test.sale.client'),
 'appointment_id',current_setting('test.sale.appointment'),'products',jsonb_build_array(jsonb_build_object(
 'product_id',current_setting('test.sale.product'),'quantity',2)))::text,true);
select set_config('test.sale.id',public.create_sale_draft(current_setting('test.sale.input')::jsonb)->>'id',true);
select is(public.get_sale(current_setting('test.sale.id')::uuid)->>'total','55.25','Suma mixta exacta');
select is(jsonb_array_length(public.get_sale(current_setting('test.sale.id')::uuid)->'items'),2,'Servicio y producto en detalle');
select is(public.create_sale_draft(current_setting('test.sale.input')::jsonb)->>'id',current_setting('test.sale.id'),'Reintento idempotente');
select throws_ok($$select public.create_sale_draft(current_setting('test.sale.input')::jsonb||'{"status":"CONFIRMED"}')$$,'22023',null,'No acepta estado forjado');
select throws_ok($$select public.create_sale_draft(current_setting('test.sale.input')::jsonb||jsonb_build_object('request_id',gen_random_uuid()))$$,'23505',null,'Una venta activa por cita');
select throws_ok($$select public.confirm_sale(current_setting('test.sale.id')::uuid,1)$$,'22023',null,'Articulo impide confirmar antes de inventario');
select is((public.search_sales('Fixture ventas')->>'total')::integer,1,'Listado autorizado');
select throws_ok($$insert into public.sales(client_id,request_id,request_payload,created_by)
 values(current_setting('test.sale.client')::uuid,gen_random_uuid(),'{}',current_setting('test.sale.admin')::uuid)$$,'42501',null,'Escritura directa revocada');
select throws_ok($$update public.sale_items set unit_price=1 where sale_id=current_setting('test.sale.id')::uuid$$,'42501',null,'Detalle inmutable desde cliente');
reset role;

select set_config('test.sale.custom_role',gen_random_uuid()::text,true);
insert into public.roles(id,code,name) values(current_setting('test.sale.custom_role')::uuid,
 'SALES_TEST_'||left(current_setting('test.sale.custom_role'),8),'Rol delegado de prueba');
insert into public.role_permissions select current_setting('test.sale.custom_role')::uuid,id
 from public.permissions where code in ('sales.read','sales.manage','products.read','products.manage');
insert into public.user_roles values(current_setting('test.sale.staff')::uuid,current_setting('test.sale.custom_role')::uuid);
select set_config('request.jwt.claim.sub',current_setting('test.sale.staff'),true);
set local role authenticated;
select is(public.has_permission('sales.read'),true,'Rol delegado tiene permiso nominal');
select is((select count(*)::integer from public.sales where id=current_setting('test.sale.id')::uuid),0,'RLS oculta ventas a STAFF');
select is((select count(*)::integer from public.products where id=current_setting('test.sale.product')::uuid),0,'RLS oculta catalogo a STAFF');
select throws_ok($$select public.get_sale(current_setting('test.sale.id')::uuid)$$,'42501',null,'STAFF no consulta venta');
select throws_ok($$select public.search_products()$$,'42501',null,'STAFF no lista catalogo comercial');
select throws_ok($$select public.create_sale_draft(current_setting('test.sale.input')::jsonb)$$,'42501',null,'STAFF no crea venta');
select throws_ok($$select public.save_product(null,'Forjado',null,'1.00')$$,'42501',null,'STAFF con rol delegado no escribe articulos');
reset role;

select set_config('request.jwt.claim.sub',current_setting('test.sale.owner'),true);
set local role authenticated;
select set_config('test.sale.payment',public.register_payment(jsonb_build_object('appointment_id',current_setting('test.sale.appointment'),
 'type','BALANCE','method','CASH','amount','10.10','request_id',gen_random_uuid()))->>'id',true);
select is(public.get_sale(current_setting('test.sale.id')::uuid)->>'confirmed_appointment_payments','0','Pendiente no figura recibido');
select lives_ok($$select public.verify_payment(current_setting('test.sale.payment')::uuid,1)$$,'OWNER verifica cobro de cita');
select is(public.get_sale(current_setting('test.sale.id')::uuid)->>'confirmed_appointment_payments','10.10','Cobro existente visible una vez');
reset role;

select set_config('request.jwt.claim.sub',current_setting('test.sale.admin'),true);
set local role authenticated;
select throws_ok($$select public.cancel_sale(current_setting('test.sale.id')::uuid,1,'Error')$$,'42501',null,'ADMIN no anula con cobro confirmado');
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.sale.owner'),true);
set local role authenticated;
select is(public.cancel_sale(current_setting('test.sale.id')::uuid,1,' Corrección ')->>'status','CANCELLED','OWNER anula con motivo');
select is(public.get_sale(current_setting('test.sale.id')::uuid)->>'requires_resolution','true','Anulación conserva cobro y pide resolución');
select throws_ok($$select public.cancel_sale(current_setting('test.sale.id')::uuid,1,'Otra')$$,'40001',null,'Versión obsoleta no anula');
select set_config('test.sale.service_only',public.create_sale_draft(jsonb_build_object('request_id',gen_random_uuid(),
 'client_id',current_setting('test.sale.client'),'appointment_id',current_setting('test.sale.appointment')))->>'id',true);
select is(public.get_sale(current_setting('test.sale.service_only')::uuid)->>'total','30.25','Venta de cita sin productos usa snapshot');
select is(public.confirm_sale(current_setting('test.sale.service_only')::uuid,1)->>'status','CONFIRMED','Servicio de cita se confirma');
select is(public.get_sale(current_setting('test.sale.service_only')::uuid)->>'confirmed_appointment_payments','10.10','Venta confirmada referencia cobro existente');
select throws_ok($$select public.confirm_sale(current_setting('test.sale.service_only')::uuid,1)$$,'40001',null,'Confirmacion con version vieja rechazada');
select set_config('test.sale.counter',public.create_sale_draft(jsonb_build_object('request_id',gen_random_uuid(),
 'client_id',current_setting('test.sale.client'),'products',jsonb_build_array(jsonb_build_object(
 'product_id',current_setting('test.sale.product'),'quantity',1))))->>'id',true);
select is(public.get_sale(current_setting('test.sale.counter')::uuid)->>'status','DRAFT','Mostrador sin cita queda borrador');
select throws_ok($$select public.confirm_sale(current_setting('test.sale.counter')::uuid,1)$$,'22023',null,'Mostrador no confirma sin inventario/cobro');
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.sale.admin'),true);
set local role authenticated;
select is(public.cancel_sale(current_setting('test.sale.counter')::uuid,1,'Borrador descartado')->>'status','CANCELLED','ADMIN anula venta sin cobro');
reset role;
select * from finish();
rollback;
