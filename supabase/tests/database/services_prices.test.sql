begin;
select plan(21);
select ok(to_regtype('public.pet_coat_type') is null,'Enum de pelaje retirado');
select ok(not exists(select 1 from information_schema.columns where table_schema='public' and table_name='service_prices' and column_name='pet_coat_type'),'Tarifas sin pelaje');
select ok(not exists(select 1 from information_schema.columns where table_schema='public' and table_name='pets' and column_name='pet_coat_type'),'Mascotas sin pelaje antiguo');
select ok(not exists(select 1 from information_schema.columns where table_schema='public' and table_name='service_prices' and column_name='pet_breed_id'),'Tarifas sin raza');
select ok((select is_nullable='NO' from information_schema.columns where table_schema='public' and table_name='service_prices' and column_name='pet_size'),'Tamaño obligatorio en tarifa');

select set_config('test.owner',gen_random_uuid()::text,true);
select set_config('test.client',gen_random_uuid()::text,true);
select set_config('test.service',gen_random_uuid()::text,true);
select set_config('test.hidden',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_user_meta_data) values
 (current_setting('test.owner')::uuid,'test-'||current_setting('test.owner')||'@example.test','{}'),
 (current_setting('test.client')::uuid,'test-'||current_setting('test.client')||'@example.test','{}');
insert into public.user_roles select current_setting('test.owner')::uuid,id from public.roles where code='OWNER';
insert into public.services(id,name,base_price,base_duration_minutes) values(current_setting('test.service')::uuid,'Baño ficticio',100.10,120);
insert into public.services(id,name,base_price,base_duration_minutes,visible_to_clients) values(current_setting('test.hidden')::uuid,'Oculto ficticio',5,10,false);

select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
set local role authenticated;
select is(public.quote_service(current_setting('test.service')::uuid)->>'price','100.10','Decimal base exacto');
select is(public.quote_service(current_setting('test.service')::uuid)->>'source','BASE','Sin tamaño usa base');
insert into public.service_prices(service_id,pet_size,price,duration_minutes) values(current_setting('test.service')::uuid,'TOY',0,45);
select is(public.quote_service(current_setting('test.service')::uuid,'TOY')->>'source','SIZE','Tamaño exacto gana');
select is(public.quote_service(current_setting('test.service')::uuid,'TOY')->>'price','0','Precio cero no usa fallback');
select is(public.quote_service(current_setting('test.service')::uuid)->>'source','BASE','Tamaño desconocido usa base');
select throws_ok(
  $$select public.quote_service(current_setting('test.service')::uuid,'TOY',gen_random_uuid())$$,
  '42501',null,'Firma histórica con raza no está expuesta a authenticated'
);
select throws_ok($$insert into public.service_prices(service_id,pet_size,price,duration_minutes) values(current_setting('test.service')::uuid,'TOY',1,10)$$,'23505',null,'Una tarifa por servicio y tamaño');
select throws_ok($$insert into public.service_prices(service_id,price,duration_minutes) values(current_setting('test.service')::uuid,1,10)$$,'23502',null,'Tarifa exige tamaño');
select throws_ok($$insert into public.services(name,base_price,base_duration_minutes) values('Error',1.234,10)$$,'23514',null,'Sin redondear exceso de decimales');
select throws_ok($$insert into public.services(name,base_price,base_duration_minutes) values('Error',1,0)$$,'23514',null,'Duración positiva');
select throws_ok($$insert into public.service_prices(service_id,pet_size,price,duration_minutes) values(current_setting('test.service')::uuid,'LARGE',null,10)$$,'23502',null,'Tarifa completa obligatoria');
update public.services set active=false where id=current_setting('test.service')::uuid;
select throws_ok($$select public.quote_service(current_setting('test.service')::uuid)$$,'42501',null,'Inactivo no calcula');
select is((select count(*)::integer from public.service_prices where service_id=current_setting('test.service')::uuid),1,'Desactivar conserva tarifas');
reset role;

select set_config('request.jwt.claim.sub',current_setting('test.client'),true);
set local role authenticated;
select is((select count(*)::integer from public.services where id=current_setting('test.hidden')::uuid),0,'Cliente no ve oculto');
select throws_ok($$select public.quote_service(current_setting('test.hidden')::uuid)$$,'42501',null,'Cliente no calcula oculto');
reset role;
set local role anon;
select throws_ok($$select public.quote_service(current_setting('test.hidden')::uuid)$$,'42501',null,'Anon no calcula');
reset role;
select * from finish();
rollback;
