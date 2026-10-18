// Solo identity-dev local. Fixtures aislados y limpieza propia; nunca reset.
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const env=JSON.parse(execFileSync('supabase',['status','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
assert.equal(env.API_URL,'http://127.0.0.1:55321');
const opts={auth:{persistSession:false,autoRefreshToken:false}};
const root=createClient(env.API_URL,env.SERVICE_ROLE_KEY,opts),users=[],employees=[],blocks=[],businessPeriods=[],actors={};
let checks=0;const prefix='Work-'+randomUUID();
const ok=(condition,label)=>{assert.ok(condition,label);checks++;};
const value=async request=>{const r=await request;assert.ifError(r.error);return r.data;};
const sql=text=>execFileSync('psql',['postgresql://postgres:postgres@127.0.0.1:55322/postgres','-v','ON_ERROR_STOP=1','-c',text],{stdio:'pipe'});
try{
 for(const role of ['OWNER','ADMIN','STAFF','CLIENT']){
  const email=`work-${randomUUID()}@example.test`,password=randomUUID()+'Aa1!';
  const d=await value(root.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{first_name:prefix+' '+role}}));users.push(d.user.id);
  if(role!=='CLIENT')sql(`insert into public.user_roles select '${d.user.id}'::uuid,id from public.roles where code='${role}'`);
  const api=createClient(env.API_URL,env.ANON_KEY,opts);await value(api.auth.signInWithPassword({email,password}));actors[role]={api,id:d.user.id};
 }
 const owner=actors.OWNER.api,admin=actors.ADMIN.api,staff=actors.STAFF.api,client=actors.CLIENT.api;
 const anon=createClient(env.API_URL,env.ANON_KEY,opts);
 const saveEmployee=async(profile,skill='ALL_SERVICES')=>{const e=await value(admin.rpc('save_employee',{p_input:{profile_id:profile,skill_level:skill,phone:prefix}}));employees.push(e.id);return e;};
 const e=await saveEmployee(actors.CLIENT.id),assistant=await saveEmployee(actors.STAFF.id,'ASSISTANT');
 ok(e.active&&e.created_at&&e.updated_at,'Defaults UUID, actividad y timestamps de servidor');
 ok(!!(await owner.rpc('save_employee',{p_input:{profile_id:actors.CLIENT.id,skill_level:'ASSISTANT'}})).error,'Perfil único');
 ok(!!(await owner.rpc('save_employee',{p_input:{profile_id:randomUUID(),skill_level:'ASSISTANT'}})).error,'Perfil inexistente');
 ok(!!(await owner.rpc('save_employee',{p_input:{profile_id:actors.ADMIN.id,skill_level:null}})).error,'Habilidad obligatoria');
 ok(!!(await owner.rpc('save_employee',{p_id:e.id,p_input:{profile_id:actors.ADMIN.id}})).error,'Perfil inmutable');
 await value(owner.rpc('set_profile_active',{p_user_id:actors.ADMIN.id,p_active:false}));
 ok(!!(await owner.rpc('save_employee',{p_input:{profile_id:actors.ADMIN.id,skill_level:'ASSISTANT'}})).error,'Crear con perfil inactivo denegado');
 await value(owner.rpc('set_profile_active',{p_user_id:actors.ADMIN.id,p_active:true}));
 const page=await value(staff.rpc('search_employees',{p_search:prefix,p_page:2,p_size:1}));
 ok(page.total===2&&page.rows.length===1&&page.rows[0].employee_name.includes(prefix),'Búsqueda por nombre/teléfono paginada para STAFF');
 const profileRows=await value(staff.from('profiles').select('id').in('id',[actors.CLIENT.id,actors.OWNER.id]));
 ok(profileRows.length===0,'STAFF no recibe lectura global de profiles');
 const shift=async(emp,day,start,end)=>{const id=await value(owner.rpc('save_work_period',{p_kind:'employee',p_input:{employee_id:emp,weekday:day,start_time:start,end_time:end}}));return id;};
 const morning=await shift(e.id,2,'07:00','12:00');await shift(e.id,2,'12:00','19:00');await shift(assistant.id,2,'07:00','18:00');
 ok(true,'Turnos consecutivos admitidos');
 for(const input of [
  {weekday:0,start_time:'07:00',end_time:'18:00'}, {weekday:7,start_time:'07:00',end_time:'18:00'},
  {weekday:3,start_time:'18:00',end_time:'07:00'}, {weekday:3,start_time:'12:00',end_time:'12:00'},
  {weekday:3,start_time:'07:00',end_time:'24:00'}, {weekday:3,start_time:null,end_time:'18:00'},
  {weekday:3,start_time:'07:00',end_time:'18:00',employee_id:randomUUID()},
 ])ok(!!(await admin.rpc('save_work_period',{p_kind:'employee',p_input:{employee_id:e.id,...input}})).error,'Día/rango/FK inválido rechazado');
 ok(!!(await owner.rpc('save_work_period',{p_kind:'employee',p_input:{employee_id:e.id,weekday:2,start_time:'11:00',end_time:'13:00'}})).error,'Solapamiento de turno rechazado');
 ok(!!(await owner.rpc('save_work_period',{p_kind:'employee',p_id:morning,p_input:{employee_id:e.id,weekday:2,start_time:'07:00',end_time:'13:00'}})).error,'Editar no crea solapamiento');
 const concurrent=await Promise.all([owner.rpc('save_work_period',{p_kind:'employee',p_input:{employee_id:e.id,weekday:3,start_time:'09:00',end_time:'12:00'}}),admin.rpc('save_work_period',{p_kind:'employee',p_input:{employee_id:e.id,weekday:3,start_time:'10:00',end_time:'13:00'}})]);
 ok(concurrent.filter(r=>r.error).length===1,'Dos escrituras concurrentes: solo una gana');
 // Configuración comercial existente preservada: prueba de concurrencia en un hueco libre.
 const calendar=await value(owner.rpc('work_calendar',{p_employee_id:e.id}));
 let freeSlot;
 for(let day=1;day<=6&&!freeSlot;day++)for(let hour=0;hour<23&&!freeSlot;hour++){
  const start=`${String(hour).padStart(2,'0')}:00:00`,end=`${String(hour+1).padStart(2,'0')}:00:00`;
  if(!calendar.business.some(h=>h.weekday===day&&h.start_time<end&&h.end_time>start))freeSlot={weekday:day,start_time:start,end_time:end};
 }
 assert.ok(freeSlot,'Se requiere un hueco comercial sintético para prueba');
 const overlapping={...freeSlot,start_time:freeSlot.start_time.slice(0,3)+'15:00',end_time:freeSlot.start_time.slice(0,3)+'45:00'};
 const businesses=await Promise.all([owner.rpc('save_work_period',{p_kind:'business',p_input:freeSlot}),admin.rpc('save_work_period',{p_kind:'business',p_input:overlapping})]);
 businessPeriods.push(...businesses.filter(r=>!r.error).map(r=>r.data));
 for(const id of businessPeriods)await value(owner.rpc('remove_work_period',{p_kind:'business',p_id:id}));
 ok(businesses.filter(r=>r.error).length===1,'Concurrencia de horario comercial serializada');
 const availability=(api=owner,emp=e.id,start='17:00',end='19:00',date='2026-07-28',specialist=false)=>value(api.rpc('employee_availability',{p_employee_id:emp,p_date:date,p_start:start,p_end:end,p_requires_specialist:specialist}));
 let a=await availability();
 ok(a.can_start_service&&a.interval_covered&&a.occupancy_verified===false&&a.notice.includes('no verificada'),'Feriado, 17:00 y fin después de18 con turno extendido; sin promesa de reserva');
 ok(a.windows.length===1&&a.windows[0].starts_at.startsWith('2026-07-28T12:00:00')&&a.windows[0].ends_at.startsWith('2026-07-29T00:00:00'),'Ventana 07–19 Lima convertida a UTC, turnos adyacentes unidos');
 a=await availability(owner,e.id,'17:01','18:00');ok(a.interval_covered&&!a.can_start_service&&a.reasons.includes('LATE_START'),'Cobertura y permiso de inicio separados');
 a=await availability(owner,assistant.id);ok(!a.interval_covered,'Sin turno extendido no cubre después de18');
 a=await availability(staff,assistant.id,'08:00','09:00','2026-07-28',true);ok(!a.can_start_service&&a.reasons.includes('SKILL_REQUIRED')&&!a.windows.length,'Asistente no cubre corte');
 a=await availability(staff,assistant.id,'08:00','09:00');ok(a.can_start_service,'Asistente cubre baño y STAFF consulta');
 a=await availability(owner,e.id,'08:00','09:00','2026-08-02');ok(!a.can_start_service&&a.reasons.includes('CLOSED'),'Domingo cerrado');
 a=await availability(owner,e.id,'08:00','09:00','2026-07-30');ok(a.reasons.includes('NO_SHIFT')&&!a.windows.length,'Sin turno no habilitado');
 const block=async(payload)=>{const id=await value(admin.rpc('save_time_block',{p_input:{employee_id:e.id,starts_local:'2026-07-28T09:00',ends_local:'2026-07-28T11:00',reason:prefix,...payload}}));blocks.push(id);return id;};
 const one=await block({created_by:actors.CLIENT.id});const two=await block({employee_id:null,starts_local:'2026-07-28T10:00',ends_local:'2026-07-28T12:00'});
 const stored=await value(owner.from('time_blocks').select('*').eq('id',one).single());
 ok(stored.created_by===actors.ADMIN.id&&stored.starts_at.startsWith('2026-07-28T14:00:00'),'Autor servidor, no payload; hora local Lima');
 await value(owner.rpc('save_time_block',{p_id:one,p_input:{employee_id:e.id,starts_local:'2026-07-28T09:00',ends_local:'2026-07-28T11:00',reason:prefix+' editado',created_by:actors.OWNER.id}}));
 ok((await value(owner.from('time_blocks').select('created_by').eq('id',one).single())).created_by===actors.ADMIN.id,'Editar preserva autor original');
 a=await availability(owner,e.id,'08:00','13:00');ok(!a.can_start_service&&a.reasons.includes('BLOCKED'),'Bloqueo interior detectado');
 ok(a.windows.length===2&&a.windows[0].ends_at.startsWith('2026-07-28T14:00:00')&&a.windows[1].starts_at.startsWith('2026-07-28T17:00:00'),'Unión personal/global 09–12 sin doble descuento');
 a=await availability(owner,e.id,'12:00','13:00');ok(a.can_start_service,'Fin de bloqueo adyacente no bloquea');
 a=await availability(owner,e.id,'08:00','09:00');ok(a.can_start_service,'Inicio de bloqueo adyacente no bloquea');
 a=await availability(owner,assistant.id,'11:00','11:30');ok(a.reasons.includes('BLOCKED'),'Global afecta a otro empleado');
 await value(owner.rpc('remove_time_block',{p_id:two}));
 a=await availability(owner,e.id,'11:00','12:00');ok(a.can_start_service,'Eliminar global conserva personal y libera solo su tramo');
 const multi=await block({starts_local:'2026-07-27T22:00',ends_local:'2026-07-28T08:00'});
 a=await availability(owner,e.id,'07:00','07:30');ok(a.reasons.includes('BLOCKED'),'Bloqueo multidía que empieza antes de fecha');
 for(const payload of [{reason:' '},{starts_local:null},{ends_local:'2026-07-28T08:00'},{employee_id:randomUUID()},{starts_local:'2026-07-28T09:00Z'}])
  ok(!!(await owner.rpc('save_time_block',{p_input:{employee_id:e.id,starts_local:'2026-07-28T09:00',ends_local:'2026-07-28T11:00',reason:prefix,...payload}})).error,'Bloqueo inválido rechazado');
 for(const api of [staff,client]){
  ok(!!(await api.rpc('save_employee',{p_id:e.id,p_input:{skill_level:'ASSISTANT'}})).error,'STAFF/CLIENT no cambian habilidad');
  ok(!!(await api.rpc('save_work_period',{p_kind:'employee',p_input:{employee_id:e.id,weekday:5,start_time:'07:00',end_time:'09:00'}})).error,'STAFF/CLIENT no crean turnos');
  ok(!!(await api.rpc('remove_work_period',{p_kind:'employee',p_id:morning})).error,'STAFF/CLIENT no quitan turnos');
  ok(!!(await api.rpc('save_time_block',{p_input:{employee_id:e.id,starts_local:'2026-07-28T09:00',ends_local:'2026-07-28T11:00',reason:prefix}})).error,'STAFF/CLIENT no crean bloqueos');
  ok(!!(await api.rpc('remove_time_block',{p_id:one})).error,'STAFF/CLIENT no quitan bloqueos');
 }
 for(const table of ['employees','employee_schedules','business_hours','time_blocks']){
  ok((await value(client.from(table).select('*'))).length===0,'CLIENT sin lectura laboral por RLS');
  ok(!!(await staff.from(table).insert({})).error,'Sin escritura directa REST');
 }
 for(const api of [client,anon])for(const [name,args] of [['search_employees',{}],['work_calendar',{p_employee_id:e.id}],['employee_availability',{p_employee_id:e.id,p_date:'2026-07-28'}]])
  ok(!!(await api.rpc(name,args)).error,'CLIENT/anon sin acceso RPC laboral');
 await value(owner.rpc('save_employee',{p_id:e.id,p_input:{active:false}}));
 a=await availability();ok(!a.can_start_service&&a.reasons.includes('INACTIVE_EMPLOYEE'),'Desactivar empleado elimina ventanas');
 await value(owner.rpc('save_employee',{p_id:e.id,p_input:{active:true}}));
 await value(owner.rpc('set_profile_active',{p_user_id:actors.CLIENT.id,p_active:false}));
 a=await availability();ok(!a.can_start_service&&a.reasons.includes('INACTIVE_PROFILE'),'Perfil inactivo anula turno aunque empleado activo');
 await value(owner.rpc('set_profile_active',{p_user_id:actors.STAFF.id,p_active:false}));
 ok(!!(await staff.rpc('employee_availability',{p_employee_id:e.id,p_date:'2026-07-28'})).error,'Perfil actor inactivo pierde lectura RPC');
 ok((await value(staff.from('time_blocks').select('id').eq('id',one))).length===0,'Perfil inactivo sin lectura directa');
 // Paginación >1000 sin crear cuentas reales ni invocar mil correos.
 sql(`insert into auth.users(id,email,raw_user_meta_data) select gen_random_uuid(),'${prefix}-bulk-'||i||'@example.test',jsonb_build_object('first_name','${prefix}-bulk-'||i) from generate_series(1,1002) i;insert into public.employees(profile_id,skill_level) select id,'ASSISTANT' from auth.users where email like '${prefix}-bulk-%'`);
 const bulk=await value(owner.rpc('search_employees',{p_search:prefix+'-bulk-',p_page:101,p_size:10}));
 ok(bulk.total===1002&&bulk.rows.length===2,'Paginación empleados supera 1000');
 const after=await value(owner.rpc('work_calendar',{p_employee_id:e.id}));
 ok(JSON.stringify(after.business)===JSON.stringify(calendar.business),'Horario comercial existente preservado');
 console.log(`Fase 3 API: ${checks} comprobaciones correctas.`);
}finally{
 // Limpiar por IDs/prefijo propios; nunca borrar tablas ni cuentas ajenas.
 sql(`delete from public.business_hours where id in (${businessPeriods.map(id=>`'${id}'`).join(',')||'null'});delete from public.time_blocks where id in (${blocks.map(id=>`'${id}'`).join(',')||'null'});delete from public.employee_schedules where employee_id in (${employees.map(id=>`'${id}'`).join(',')||'null'});delete from public.employees where id in (${employees.map(id=>`'${id}'`).join(',')||'null'}) or profile_id in(select id from auth.users where email like '${prefix}-bulk-%');delete from auth.users where email like '${prefix}-bulk-%'`);
 for(const id of users)await root.auth.admin.deleteUser(id);
}
