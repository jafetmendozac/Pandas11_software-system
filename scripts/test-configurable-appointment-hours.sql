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
insert into public.employee_schedules(employee_id,weekday,start_time,end_time) values(current_setting('test.employee')::uuid,3,'07:00','19:00');
insert into public.services(id,name,base_price,base_duration_minutes,requires_specialist) values(current_setting('test.service')::uuid,'Fixture baño/corte',100.10,120,true);
select set_config('test.payload',jsonb_build_object('client_id',current_setting('test.client'),'items',jsonb_build_array(jsonb_build_object('pet_id',current_setting('test.pet'),'service_id',current_setting('test.service'),'stages',jsonb_build_array(
 jsonb_build_object('employee_id',current_setting('test.employee'),'stage','BATH','starts_local','2030-07-31T17:00','ends_local','2030-07-31T18:00'),
 jsonb_build_object('employee_id',current_setting('test.employee'),'stage','CUT','starts_local','2030-07-31T18:00','ends_local','2030-07-31T19:00')))))::text,true);
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
set local role authenticated;
select set_config('test.appointment',(public.save_internal_appointment(current_setting('test.payload')::jsonb)->>'id'),true);

do $$
declare worker uuid:=current_setting('test.employee')::uuid; day date:='2030-07-31'; before_employee jsonb; before_appointment jsonb; after_employee jsonb; after_appointment jsonb; created jsonb;
begin
 if not exists(select 1 from public.business_hours where weekday=3 and open_time<=time '20:10' and close_time>time '20:10') then raise exception 'Fixture local no cubre 20:10'; end if;
 before_employee:=public.employee_availability(worker,day,'20:10','20:35',true);
 before_appointment:=public.appointment_availability(worker,day,'20:10','20:35',true,null,false);
 if (before_employee->>'can_start_service')::boolean is distinct from false or (before_appointment->>'can_start_service')::boolean is distinct from false then raise exception 'Un turno hasta las 19:00 no debe cubrir 20:10'; end if;
 perform public.save_work_period('employee',jsonb_build_object('employee_id',worker,'weekday',3,'start_time','07:00','end_time','22:00'),(select id from public.employee_schedules where employee_id=worker and weekday=3));
 after_employee:=public.employee_availability(worker,day,'20:10','20:35',true);
 after_appointment:=public.appointment_availability(worker,day,'20:10','20:35',true,null,false);
 if (after_employee->>'can_start_service')::boolean is distinct from true or (after_appointment->>'can_start_service')::boolean is distinct from true then raise exception 'Local y turno hasta las 22:00 deben cubrir 20:10'; end if;
 created:=public.create_internal_appointment_with_planned_end(jsonb_build_object('client_id',current_setting('test.client'),'items',jsonb_build_array(jsonb_build_object('pet_id',current_setting('test.pet2'),'service_id',current_setting('test.service'),'planned_duration_minutes',25,'stages',jsonb_build_array(jsonb_build_object('employee_id',current_setting('test.employee'),'stage','SERVICE','starts_local','2030-07-31T20:10','ends_local','2030-07-31T20:35'))))),'2030-07-31T20:35');
 if (created->>'starts_at')::timestamptz <> '2030-08-01 01:10+00'::timestamptz or (created->>'ends_at')::timestamptz <> '2030-08-01 01:35+00'::timestamptz then raise exception 'Cita nocturna no guardada en Lima'; end if;
 perform public.save_work_period('employee',jsonb_build_object('employee_id',worker,'weekday',3,'start_time','07:00','end_time','23:30'),(select id from public.employee_schedules where employee_id=worker and weekday=3));
 if exists(select 1 from public.business_hours where weekday=3 and open_time<=time '22:20' and close_time>time '22:20') then raise exception 'Fixture local aún abierto a las 22:20'; end if;
 if (public.employee_availability(worker,day,'22:20','22:45',true)->>'can_start_service')::boolean is distinct from false or (public.appointment_availability(worker,day,'22:20','22:45',true,null,false)->>'can_start_service')::boolean is distinct from false then raise exception 'Un turno extendido no abre el local'; end if;
end $$;
rollback;
