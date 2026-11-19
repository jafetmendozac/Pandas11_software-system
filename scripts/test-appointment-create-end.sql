begin;
select set_config('test.owner',gen_random_uuid()::text,true);
select set_config('test.staff',gen_random_uuid()::text,true);
select set_config('test.client',gen_random_uuid()::text,true);
select set_config('test.pet',gen_random_uuid()::text,true);
select set_config('test.pet2',gen_random_uuid()::text,true);
select set_config('test.employee',gen_random_uuid()::text,true);
select set_config('test.service',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_user_meta_data) values(current_setting('test.owner')::uuid,'test-'||current_setting('test.owner')||'@example.test','{}'),(current_setting('test.staff')::uuid,'test-'||current_setting('test.staff')||'@example.test','{}');
insert into public.user_roles select current_setting('test.owner')::uuid,id from public.roles where code='OWNER';
insert into public.user_roles select current_setting('test.staff')::uuid,id from public.roles where code='STAFF';
insert into public.clients(id,first_name) values(current_setting('test.client')::uuid,'Fixture agenda');
insert into public.pets(id,client_id,name) values
 (current_setting('test.pet')::uuid,current_setting('test.client')::uuid,'Fixture perro'),
 (current_setting('test.pet2')::uuid,current_setting('test.client')::uuid,'Fixture perro 2');
insert into public.employees(id,profile_id,skill_level) values(current_setting('test.employee')::uuid,current_setting('test.owner')::uuid,'ALL_SERVICES');
insert into public.employee_schedules(employee_id,weekday,start_time,end_time) values(current_setting('test.employee')::uuid,2,'07:00','19:00');
insert into public.services(id,name,base_price,base_duration_minutes,requires_specialist) values(current_setting('test.service')::uuid,'Fixture baño/corte',100.10,120,true);
select set_config('test.payload',jsonb_build_object('client_id',current_setting('test.client'),'items',jsonb_build_array(jsonb_build_object('pet_id',current_setting('test.pet'),'service_id',current_setting('test.service'),'stages',jsonb_build_array(
 jsonb_build_object('employee_id',current_setting('test.employee'),'stage','BATH','starts_local','2030-07-30T17:00','ends_local','2030-07-30T18:00'),
 jsonb_build_object('employee_id',current_setting('test.employee'),'stage','CUT','starts_local','2030-07-30T18:00','ends_local','2030-07-30T19:00')))))::text,true);
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
set local role authenticated;
select set_config('test.appointment',(public.save_internal_appointment(current_setting('test.payload')::jsonb)->>'id'),true);

do $$
declare created jsonb; count_before integer;
begin
 created:=public.create_internal_appointment_with_planned_end(jsonb_build_object('client_id',current_setting('test.client'),'items',jsonb_build_array(jsonb_build_object('pet_id',current_setting('test.pet2'),'service_id',current_setting('test.service'),'planned_duration_minutes',60,'stages',jsonb_build_array(jsonb_build_object('employee_id',current_setting('test.employee'),'stage','SERVICE','starts_local','2030-07-30T15:30','ends_local','2030-07-30T16:30'))))),'2030-07-30T16:30');
 if (created->>'ends_at')::timestamptz <> '2030-07-30 21:30+00'::timestamptz then raise exception 'Chosen end was not saved'; end if;
 if (created->'items'->0->>'duration_minutes')::integer <> 120 or (created->'items'->0->>'planned_duration_minutes')::integer <> 60 then raise exception 'Quote or planned duration changed incorrectly'; end if;
 select count(*) into count_before from public.appointments where client_id=current_setting('test.client')::uuid;
 begin
  perform public.create_internal_appointment_with_planned_end(jsonb_build_object('client_id',current_setting('test.client'),'items',jsonb_build_array(jsonb_build_object('pet_id',current_setting('test.pet2'),'service_id',current_setting('test.service'),'planned_duration_minutes',150,'stages',jsonb_build_array(jsonb_build_object('employee_id',current_setting('test.employee'),'stage','SERVICE','starts_local','2030-07-30T13:30','ends_local','2030-07-30T16:00'))))),'2030-07-30T16:00');
  raise exception 'Expected conflict';
 exception when exclusion_violation then null; end;
 if (select count(*) from public.appointments where client_id=current_setting('test.client')::uuid) <> count_before then raise exception 'Rejected create left a reservation'; end if;
end $$;
rollback;
