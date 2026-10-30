begin;
select no_plan();

select set_config('test.contact.owner',gen_random_uuid()::text,true);
select set_config('test.contact.staff',gen_random_uuid()::text,true);
select set_config('test.contact.client',gen_random_uuid()::text,true);
select set_config('test.contact.custom',gen_random_uuid()::text,true);
select set_config('test.contact.customer',gen_random_uuid()::text,true);
select set_config('test.contact.appointment',gen_random_uuid()::text,true);
select set_config('test.contact.request',gen_random_uuid()::text,true);
select set_config('test.contact.follow_client',gen_random_uuid()::text,true);
select set_config('test.contact.follow_appointment',gen_random_uuid()::text,true);

insert into auth.users(id,email,raw_user_meta_data)
select current_setting('test.contact.'||k)::uuid,k||'-contact@example.test','{}'::jsonb
from unnest(array['owner','staff','client','custom']) k;
insert into public.user_roles(user_id,role_id)
select current_setting('test.contact.'||lower(r.code))::uuid,r.id
from public.roles r where r.code in ('OWNER','STAFF');
insert into public.roles(code,name) values('CONTACT_CUSTOM','Rol sintético de contactos');
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.code='CONTACT_CUSTOM' and p.code='contacts.read';
insert into public.user_roles(user_id,role_id)
select current_setting('test.contact.custom')::uuid,id from public.roles where code='CONTACT_CUSTOM';
insert into public.clients(id,first_name,phone,whatsapp,whatsapp_opt_in)
values(current_setting('test.contact.customer')::uuid,'Contacto sintético','999888777','999888777',true);
insert into public.appointments(id,client_id,starts_at,ends_at,status,total_price,created_by)
values(current_setting('test.contact.appointment')::uuid,current_setting('test.contact.customer')::uuid,
 (((clock_timestamp() at time zone 'America/Lima')::date+1)+time '10:00') at time zone 'America/Lima',
 (((clock_timestamp() at time zone 'America/Lima')::date+1)+time '11:00') at time zone 'America/Lima',
 'CONFIRMED',10,current_setting('test.contact.owner')::uuid);
insert into public.clients(id,first_name,phone) values(current_setting('test.contact.follow_client')::uuid,'Seguimiento sintético','999111222');
insert into public.appointments(id,client_id,starts_at,ends_at,status,total_price,created_by)
values(current_setting('test.contact.follow_appointment')::uuid,current_setting('test.contact.follow_client')::uuid,
 '2097-10-01 15:00:00+00','2097-10-01 16:00:00+00','COMPLETED',10,current_setting('test.contact.owner')::uuid);

select set_config('request.jwt.claim.sub',current_setting('test.contact.staff'),true);
set local role authenticated;
select is((public.contact_queue()->>'total')::int,1,'STAFF ve una cita de mañana');
select is((public.contact_queue()->'rows'->0->>'whatsapp_allowed')::boolean,false,'Opt-in legado no prueba consentimiento');
select is((public.contact_queue('FOLLOW_UP','Seguimiento',1,10,'2097-10-30'::date)->>'total')::int,0,'A 29 días no hay seguimiento');
select is((public.contact_queue('FOLLOW_UP','Seguimiento',1,10,'2097-10-31'::date)->>'total')::int,1,'A 30 días hay seguimiento');
select is((public.contact_queue('FOLLOW_UP','Seguimiento',1,10,'2097-10-31'::date)->'rows'->0->>'appointment_id'),current_setting('test.contact.follow_appointment'),'Seguimiento usa última cita completada');
select throws_ok($$select public.record_contact_consent(current_setting('test.contact.customer')::uuid,true,'VERBAL')$$,
 '42501',null,'STAFF no registra consentimiento');
select throws_ok($$select public.record_contact_attempt(current_setting('test.contact.customer')::uuid,'APPOINTMENT_REMINDER',current_setting('test.contact.appointment')::uuid,'WHATSAPP','CONTACTED',null,gen_random_uuid())$$,
 '42501',null,'Servidor impide WhatsApp sin consentimiento');
reset role;

insert into public.appointments(client_id,starts_at,ends_at,status,total_price,created_by)
values(current_setting('test.contact.follow_client')::uuid,'2097-11-02 15:00:00+00','2097-11-02 16:00:00+00',
 'CONFIRMED',10,current_setting('test.contact.owner')::uuid);
select set_config('request.jwt.claim.sub',current_setting('test.contact.staff'),true);
set local role authenticated;
select is((public.contact_queue('FOLLOW_UP','Seguimiento',1,10,'2097-10-31'::date)->>'total')::int,0,'Cita futura confirmada excluye seguimiento');
reset role;
update public.appointments set status='NO_SHOW' where client_id=current_setting('test.contact.follow_client')::uuid and status='CONFIRMED';
select set_config('request.jwt.claim.sub',current_setting('test.contact.staff'),true);
set local role authenticated;
select is((public.contact_queue('FOLLOW_UP','Seguimiento',1,10,'2097-10-31'::date)->>'total')::int,1,'Cita futura no asistida libera seguimiento');
reset role;

select set_config('request.jwt.claim.sub',current_setting('test.contact.owner'),true);
set local role authenticated;
select lives_ok($$select public.record_contact_consent(current_setting('test.contact.customer')::uuid,true,'VERBAL')$$,'OWNER registra consentimiento');
select is((public.contact_queue()->'rows'->0->>'whatsapp_allowed')::boolean,true,'Consentimiento vigente habilita WhatsApp');
select lives_ok($$select public.record_contact_attempt(current_setting('test.contact.customer')::uuid,'APPOINTMENT_REMINDER',current_setting('test.contact.appointment')::uuid,'WHATSAPP','CONTACTED',null,current_setting('test.contact.request')::uuid)$$,
 'Registra contacto una vez');
select lives_ok($$select public.record_contact_attempt(current_setting('test.contact.customer')::uuid,'APPOINTMENT_REMINDER',current_setting('test.contact.appointment')::uuid,'WHATSAPP','CONTACTED',null,current_setting('test.contact.request')::uuid)$$,
 'Reintento idéntico es idempotente');
select is((select count(*)::int from public.contact_attempts where request_id=current_setting('test.contact.request')::uuid),1,'Sin duplicado de intento');
select is((public.contact_queue()->>'total')::int,0,'Contacto cerrado sale de la lista');
select lives_ok($$select public.record_contact_consent(current_setting('test.contact.customer')::uuid,false,'VERBAL')$$,'Revoca consentimiento');
select is((select public.contact_queue()->'rows'), '[]'::jsonb,'La lista cerrada sigue vacía');
select is((select whatsapp_opt_in from public.clients where id=current_setting('test.contact.customer')::uuid),false,'Revocación sincroniza la ficha');
reset role;
select is(private.whatsapp_consent(current_setting('test.contact.customer')::uuid),false,'Revocación deshabilita comprobación de WhatsApp');
update public.profiles set active=false where id=current_setting('test.contact.owner')::uuid;
select set_config('request.jwt.claim.sub',current_setting('test.contact.owner'),true);
set local role authenticated;
select throws_ok($$select public.contact_queue()$$,'42501',null,'OWNER inactivo no lee contactos');
reset role;

select set_config('request.jwt.claim.sub',current_setting('test.contact.client'),true);
set local role authenticated;
select throws_ok($$select public.contact_queue()$$,'42501',null,'CLIENT no lee contactos');
select throws_ok($$select public.record_contact_attempt(current_setting('test.contact.customer')::uuid,'APPOINTMENT_REMINDER',current_setting('test.contact.appointment')::uuid,'PHONE','CONTACTED',null,gen_random_uuid())$$,
 '42501',null,'CLIENT no registra intentos');
select is((select count(*)::int from public.contact_attempts),0,'RLS oculta historial a CLIENT');
select throws_ok($$insert into public.contact_attempts(client_id,kind,appointment_id,channel,result,request_id,recorded_by)
 values(current_setting('test.contact.customer')::uuid,'APPOINTMENT_REMINDER',current_setting('test.contact.appointment')::uuid,'PHONE','CONTACTED',gen_random_uuid(),current_setting('test.contact.client')::uuid)$$,
 '42501',null,'CLIENT no escribe historial directamente');
reset role;

select set_config('request.jwt.claim.sub',current_setting('test.contact.custom'),true);
set local role authenticated;
select throws_ok($$select public.contact_queue()$$,'42501',null,'Permiso delegado a rol ajeno no expone contactos');
reset role;

select set_config('request.jwt.claim.sub','',true);
set local role anon;
select throws_ok($$select public.contact_queue()$$,'42501',null,'Anon no ejecuta lista');
reset role;

select * from finish();
rollback;
