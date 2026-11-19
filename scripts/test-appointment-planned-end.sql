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

-- Synthetic fixture; every change is rolled back.
do $$
declare a jsonb; shortened jsonb; restored jsonb; other jsonb;
begin
 a:=public.get_appointment(current_setting('test.appointment')::uuid);
 shortened:=public.adjust_appointment_planned_end((a->>'id')::uuid,(a->>'version')::integer,'2030-07-30T18:30');
 if shortened->>'ends_at' <> '2030-07-30T23:30:00+00:00' and (shortened->>'ends_at')::timestamptz <> '2030-07-30 23:30+00'::timestamptz then raise exception 'Shortening failed'; end if;
 if shortened->>'total_price' <> a->>'total_price' or shortened->'items'->0->>'duration_minutes' <> a->'items'->0->>'duration_minutes' then raise exception 'Quote changed'; end if;
 other:=public.save_internal_appointment(jsonb_build_object('client_id',current_setting('test.client'),'items',jsonb_build_array(jsonb_build_object('pet_id',current_setting('test.pet2'),'service_id',current_setting('test.service'),'stages',jsonb_build_array(jsonb_build_object('employee_id',current_setting('test.employee'),'stage','SERVICE','starts_local','2030-07-30T15:00','ends_local','2030-07-30T17:00'))))));
 begin
  perform public.adjust_appointment_planned_end((other->>'id')::uuid,(other->>'version')::integer,'2030-07-30T17:30');
  raise exception 'Expected reservation conflict';
 exception when exclusion_violation then null; end;
 if (public.get_appointment((other->>'id')::uuid)->>'version')::integer <> (other->>'version')::integer then raise exception 'Conflicting change was persisted'; end if;
 restored:=public.adjust_appointment_planned_end((a->>'id')::uuid,(shortened->>'version')::integer,'2030-07-30T19:00');
 if (restored->>'ends_at')::timestamptz <> (a->>'ends_at')::timestamptz then raise exception 'Lengthening failed'; end if;
 begin
  perform public.adjust_appointment_planned_end((a->>'id')::uuid,(restored->>'version')::integer,'2030-07-30T19:30');
  raise exception 'Expected shift rejection';
 exception when exclusion_violation then null; end;
 if (public.get_appointment((a->>'id')::uuid)->>'version')::integer <> (restored->>'version')::integer then raise exception 'Rejected change was persisted'; end if;
 begin
  perform public.adjust_appointment_planned_end((a->>'id')::uuid,1,'2030-07-30T18:30');
  raise exception 'Expected version rejection';
 exception when serialization_failure then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.staff'),true);
set local role authenticated;
do $$ begin
 begin
  perform public.adjust_appointment_planned_end(current_setting('test.appointment')::uuid,3,'2030-07-30T18:30');
  raise exception 'Expected permission rejection';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
