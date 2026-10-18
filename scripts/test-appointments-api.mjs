// Solo identity-dev. Fixtures propios; sin reset, secretos solo en Node.
import {execFileSync,spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const env=JSON.parse(execFileSync('supabase',['status','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
assert.equal(env.API_URL,'http://127.0.0.1:55321');
const opts={auth:{persistSession:false,autoRefreshToken:false}},root=createClient(env.API_URL,env.SERVICE_ROLE_KEY,opts),users=[],actors={};
const prefix='Agenda-'+randomUUID(),clients=[],pets=[],services=[],employees=[],blocks=[],appointments=[];let checks=0;
const ok=(condition,label)=>{assert.ok(condition,label);checks++;};
const value=async request=>{const r=await request;assert.ifError(r.error);return r.data;};
const sql=text=>execFileSync('psql',['postgresql://postgres:postgres@127.0.0.1:55322/postgres','-v','ON_ERROR_STOP=1','-c',text],{stdio:'pipe'});
const ids=a=>a.map(id=>`'${id}'`).join(',')||'null';
try{
 for(const role of ['OWNER','ADMIN','STAFF','CLIENT']){
  const email=`agenda-${randomUUID()}@example.test`,password=randomUUID()+'Aa1!';
  const d=await value(root.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{first_name:prefix+' '+role}}));users.push(d.user.id);
  if(role!=='CLIENT')sql(`insert into public.user_roles select '${d.user.id}'::uuid,id from public.roles where code='${role}'`);
  const api=createClient(env.API_URL,env.ANON_KEY,opts);await value(api.auth.signInWithPassword({email,password}));actors[role]={id:d.user.id,api};
 }
 const owner=actors.OWNER.api,admin=actors.ADMIN.api,staff=actors.STAFF.api,clientApi=actors.CLIENT.api,anon=createClient(env.API_URL,env.ANON_KEY,opts);
 for(let i=0;i<2;i++){const c=await value(owner.rpc('save_client',{p_input:{first_name:prefix+i}}));clients.push(c.id);}
 for(let i=0;i<3;i++){const p=await value(owner.from('pets').insert({client_id:clients[i===2?1:0],name:prefix+' perro'+i,pet_size:'TOY',pet_coat_type:'LONG'}).select().single());pets.push(p.id);}
 for(const [i,minutes,specialist] of [[0,120,true],[1,60,false]]){
  const s=await value(owner.from('services').insert({name:prefix+' servicio'+i,base_price:i===0?'100.10':'50.25',base_duration_minutes:minutes,requires_specialist:specialist}).select().single());services.push(s.id);
 }
 for(const [profile,level] of [[actors.CLIENT.id,'ALL_SERVICES'],[actors.STAFF.id,'ASSISTANT']]){
  const e=await value(owner.rpc('save_employee',{p_input:{profile_id:profile,skill_level:level}}));employees.push(e.id);
  for(const d of [1,2])await value(owner.rpc('save_work_period',{p_kind:'employee',p_input:{employee_id:e.id,weekday:d,start_time:'07:00',end_time:'20:00'}}));
 }
 const stage=(employee,kind,start,end,date='2030-07-29')=>({employee_id:employee,stage:kind,starts_local:date+'T'+start,ends_local:date+'T'+end});
 const item=(pet,service,stages)=>({pet_id:pet,service_id:service,notes:'',weight_kg_at_visit:null,stages});
 const input=items=>({client_id:clients[0],client_notes:'Nota comunicable',items});
 const simple=(pet=pets[0],emp=employees[0],start='10:00',end='11:00',date='2030-07-29')=>input([item(pet,services[1],[stage(emp,'SERVICE',start,end,date)])]);
 const save=async(payload,api=owner,current=null)=>{const a=await value(api.rpc('save_internal_appointment',{p_input:payload,...(current?{p_id:current.id,p_expected_version:current.version}:{})}));if(!appointments.includes(a.id))appointments.push(a.id);return a;};
 const cancel=async a=>value(owner.rpc('change_appointment_status',{p_id:a.id,p_expected_version:a.version,p_target:'CANCELLED',p_reason:'Prueba sintética'}));
 const split=input([item(pets[0],services[0],[stage(employees[1],'BATH','08:00','09:00'),stage(employees[0],'CUT','09:00','10:00')]),item(pets[1],services[1],[stage(employees[0],'SERVICE','08:00','09:00')])]);
 let a=await save(split,admin);
 ok(a.items.length===2&&a.items.flatMap(i=>i.stages).length===3,'Dos perros y relevo en reserva atómica');
 ok(a.total_price==='150.35'&&a.deposit_required==='0'&&a.source==='INTERNAL'&&a.status==='CONFIRMED'&&a.version===1,'Total una vez por servicio, sin adelanto de autorreserva');
 ok(a.starts_at.startsWith('2030-07-29T13:00:00')&&a.ends_at.startsWith('2030-07-29T15:00:00'),'Hora Lima en cabecera derivada de etapas');
 ok(a.created_by===actors.ADMIN.id,'Autor real del servidor');
 execFileSync('supabase',['test','db'],{stdio:'pipe'});
 ok((await value(owner.rpc('get_appointment',{p_id:a.id}))).version===a.version,'Regresión SQL completa con una reserva vigente ajena a sus fixtures; la conserva');
 ok((await value(staff.rpc('get_appointment',{p_id:a.id}))).items.length===2,'STAFF consulta ficha completa');
 await value(owner.rpc('save_appointment_internal',{p_id:a.id,p_expected_version:a.version,p_notes:'Privado '+prefix}));a=await value(owner.rpc('get_appointment',{p_id:a.id}));
 ok(!JSON.stringify(a).includes('Privado'),'Observación interna fuera de ficha ordinaria');
 const note=await value(staff.from('appointment_internal').select('*').eq('appointment_id',a.id).single());ok(note.updated_by===actors.OWNER.id&&note.notes.startsWith('Privado'),'STAFF consulta interna con permiso propio');
 ok(!!(await staff.rpc('save_appointment_internal',{p_id:a.id,p_expected_version:a.version,p_notes:'No permitido'})).error,'STAFF no edita interna');
 const quoteBefore=a.items.map(i=>[i.id,i.price,i.duration_minutes]);
 await value(owner.from('services').update({base_price:'777.77',base_duration_minutes:180,requires_specialist:false}).eq('id',services[0]));
 const snapshotInput=input(a.items.map(i=>({id:i.id,pet_id:i.pet_id,service_id:i.service_id,notes:i.notes??'',weight_kg_at_visit:null,stages:i.stages.map(s=>({employee_id:s.employee_id,stage:s.stage,starts_local:s.starts_at.slice(0,10)+'T'+String(Number(s.starts_at.slice(11,13))-5).padStart(2,'0')+s.starts_at.slice(13,19),ends_local:s.ends_at.slice(0,10)+'T'+String(Number(s.ends_at.slice(11,13))-5).padStart(2,'0')+s.ends_at.slice(13,19)}))})));
 a=await save(snapshotInput,owner,a);ok(JSON.stringify(a.items.map(i=>[i.id,i.price,i.duration_minutes]))===JSON.stringify(quoteBefore),'Reprogramar conserva snapshots e IDs aunque cambie catálogo');
 ok(a.items.some(i=>i.requires_specialist_snapshot),'Habilidad histórica conservada');
 await value(owner.from('services').update({base_price:'100.10',base_duration_minutes:120,requires_specialist:true}).eq('id',services[0]));
 for(const bad of [
  input([item(pets[2],services[1],[stage(employees[0],'SERVICE','10:00','11:00')])]),
  input([item(pets[0],services[0],[stage(employees[1],'SERVICE','10:00','12:00')])]),
  input([item(pets[0],services[0],[stage(employees[1],'BATH','10:00','12:00')])]),
  input([item(pets[0],services[0],[stage(employees[1],'BATH','10:00','10:30'),stage(employees[0],'CUT','11:00','12:30')])]),
  input([item(pets[0],services[1],[stage(employees[0],'SERVICE','10:00','10:30')])]),
  input([item(pets[0],services[0],[stage(employees[0],'BATH','10:00:00','10:00:30'),stage(employees[0],'CUT','10:00:30','12:00:00')])]),
  {...simple(),source:'ONLINE'}, {...simple(),total_price:'0'}, {...simple(),created_by:actors.CLIENT.id},
  input([{...simple().items[0],price:'0'}]), simple(pets[0],employees[0],'17:01','18:01'),
  simple(pets[0],employees[0],'08:00','09:00','2030-08-04'), simple(pets[0],randomUUID()),
 ])ok(!!(await owner.rpc('save_internal_appointment',{p_input:bad})).error,'Payload inválido, habilidad, rango o mascota ajena denegados');
 const countBefore=(await value(owner.from('appointments').select('id').eq('client_id',clients[0]))).length;
 const badAtomic=input([item(pets[1],services[1],[stage(employees[1],'SERVICE','11:00','12:00')]),item(pets[2],services[1],[stage(employees[0],'SERVICE','12:00','13:00')])]);
 ok(!!(await owner.rpc('save_internal_appointment',{p_input:badAtomic})).error,'Segundo item inválido revierte operación');
 ok((await value(owner.from('appointments').select('id').eq('client_id',clients[0]))).length===countBefore,'Sin cabecera parcial');
 const beforeEdit=JSON.stringify(await value(owner.rpc('get_appointment',{p_id:a.id})));
 ok(!!(await owner.rpc('save_internal_appointment',{p_id:a.id,p_expected_version:a.version,p_input:badAtomic})).error,'Edición inválida rechazada');
 ok(JSON.stringify(await value(owner.rpc('get_appointment',{p_id:a.id})))===beforeEdit,'Edición fallida conserva todos los datos');
 const occupied=await value(staff.rpc('appointment_availability',{p_employee_id:employees[0],p_date:'2030-07-29',p_start:'08:30',p_end:'09:30'}));
 ok(!occupied.interval_covered&&occupied.reasons.includes('BUSY'),'Disponibilidad incluye reservas');
 const own=await value(owner.rpc('appointment_availability',{p_employee_id:employees[0],p_date:'2030-07-29',p_start:'09:00',p_end:'10:00',p_exclude_appointment_id:a.id}));ok(own.interval_covered,'Consulta de edición excluye su propia cita');
 ok(!!(await owner.rpc('save_internal_appointment',{p_input:simple(pets[1],employees[1],'09:00','10:00')})).error===false,'Otro perro/persona libre puede reservar tramo adyacente');
 // Registrar la reserva anterior para limpieza aunque se compruebe por consulta posterior.
 const extra=await value(owner.from('appointments').select('id').eq('client_id',clients[0]));appointments.push(...extra.map(x=>x.id).filter(id=>!appointments.includes(id)));
 const race=await Promise.all([owner,admin].map(api=>api.rpc('save_internal_appointment',{p_input:simple(pets[0],employees[0],'12:00','13:00')})));
 for(const r of race)if(!r.error)appointments.push(r.data.id);
 ok(race.filter(r=>!r.error).length===1,'Concurrencia mismo trabajador: una reserva');
 const petRace=await Promise.all([owner.rpc('save_internal_appointment',{p_input:simple(pets[0],employees[0],'13:00','14:00')}),admin.rpc('save_internal_appointment',{p_input:simple(pets[0],employees[1],'13:00','14:00')})]);
 for(const r of petRace)if(!r.error)appointments.push(r.data.id);
 ok(petRace.filter(r=>!r.error).length===1,'Concurrencia misma mascota con distintos trabajadores: una reserva');
 const versionRace=await Promise.all([owner,admin].map(api=>api.rpc('save_internal_appointment',{p_id:a.id,p_expected_version:a.version,p_input:snapshotInput})));
 ok(versionRace.filter(r=>!r.error).length===1&&versionRace.some(r=>r.error?.code==='40001'),'Versión evita pérdida por editores simultáneos');a=await value(owner.rpc('get_appointment',{p_id:a.id}));
 for(const api of [staff,clientApi,anon]){
  ok(!!(await api.rpc('save_internal_appointment',{p_input:simple(pets[1],employees[1],'15:00','16:00')})).error,'Actor sin gestión no crea');
  ok(!!(await api.rpc('change_appointment_status',{p_id:a.id,p_expected_version:a.version,p_target:'CANCELLED',p_reason:'No autorizado'})).error,'Actor sin gestión no cancela');
 }
 for(const table of ['appointments','appointment_items','appointment_item_staff','appointment_internal']){
  ok(!!(await owner.from(table).insert({})).error,'Sin escritura directa ni para owner');
  ok((await value(clientApi.from(table).select('*'))).length===0,'CLIENT sin lectura laboral');
 }
 for(const api of [clientApi,anon])ok(!!(await api.rpc('get_appointment',{p_id:a.id})).error,'CLIENT/anon sin ficha por RPC');
 ok(!!(await owner.rpc('change_appointment_status',{p_id:a.id,p_expected_version:a.version,p_target:'IN_PROGRESS'})).error,'No atender antes de inicio');
 ok(!!(await owner.rpc('change_appointment_status',{p_id:a.id,p_expected_version:a.version,p_target:'COMPLETED'})).error,'No completar sin iniciar');
 ok(!!(await owner.rpc('change_appointment_status',{p_id:a.id,p_expected_version:a.version,p_target:'CANCELLED',p_reason:' '})).error,'Motivo obligatorio');
 const conflictingBlock={employee_id:employees[0],starts_local:'2030-07-29T09:15',ends_local:'2030-07-29T09:45',reason:prefix};
 const configConflict=await owner.rpc('save_time_block',{p_input:conflictingBlock});
 ok(configConflict.error?.code==='23P01'&&configConflict.error.message.includes(a.id)&&configConflict.error.message.includes('2030-07-29'),'Cambio laboral identifica cita y fecha que debe resolver recepción');
 ok(!!(await owner.rpc('save_employee',{p_id:employees[0],p_input:{active:false}})).error,'No desactivar empleado con reservas vigentes');
 ok(!!(await owner.rpc('save_employee',{p_id:employees[0],p_input:{skill_level:'ASSISTANT'}})).error,'No quitar habilidad necesaria de cita vigente');
 const shifts=await value(owner.from('employee_schedules').select('*').eq('employee_id',employees[0]).eq('weekday',1));
 ok(!!(await owner.rpc('remove_work_period',{p_kind:'employee',p_id:shifts[0].id})).error,'No eliminar turno que cubre reserva');
 a=await cancel(a);ok(a.status==='CANCELLED'&&a.cancelled_by===actors.OWNER.id&&a.items.length===2,'Cancelar conserva detalle y autor');
 ok(!!(await owner.rpc('change_appointment_status',{p_id:a.id,p_expected_version:a.version,p_target:'CONFIRMED'})).error,'No reabrir terminal');
 const released=await value(owner.rpc('appointment_availability',{p_employee_id:employees[0],p_date:'2030-07-29',p_start:'09:00',p_end:'10:00'}));ok(released.interval_covered,'Cancelar libera sus intervalos');
 const same=await save(input([item(pets[0],services[0],[stage(employees[0],'BATH','15:00','16:00'),stage(employees[0],'CUT','16:00','17:00')])]));ok(same.items[0].stages.length===2,'Misma persona puede hacer ambas etapas');
 const late=await save(input([item(pets[1],services[0],[stage(employees[1],'BATH','17:00','18:00'),stage(employees[0],'CUT','18:00','19:00')])]));ok(late.ends_at.startsWith('2030-07-30T00:00:00'),'Continuación después17 y fin19 con turno explícito');
 const directBlock=await value(owner.rpc('save_time_block',{p_input:{...conflictingBlock,starts_local:'2030-07-30T08:00',ends_local:'2030-07-30T09:00'}}));blocks.push(directBlock);
 ok(!!(await owner.rpc('save_internal_appointment',{p_input:simple(pets[0],employees[0],'08:00','09:00','2030-07-30')})).error,'Bloqueo anterior impide reserva');
 const cross=await Promise.all([owner.rpc('save_internal_appointment',{p_input:simple(pets[0],employees[0],'10:00','11:00','2030-07-30')}),admin.rpc('save_time_block',{p_input:{...conflictingBlock,starts_local:'2030-07-30T10:00',ends_local:'2030-07-30T11:00'}})]);
 if(!cross[0].error)appointments.push(cross[0].data.id);if(!cross[1].error)blocks.push(cross[1].data);
 ok(cross.filter(r=>!r.error).length===1,'Reserva y bloqueo concurrentes: solo gana uno');
 // Carrera entre reserva y eliminación de turno, sin tocar horarios ajenos.
 const assistantShift=await value(owner.from('employee_schedules').select('id').eq('employee_id',employees[1]).eq('weekday',2).single());
 const shiftRace=await Promise.all([owner.rpc('save_internal_appointment',{p_input:simple(pets[1],employees[1],'14:00','15:00','2030-07-30')}),admin.rpc('remove_work_period',{p_kind:'employee',p_id:assistantShift.id})]);
 if(!shiftRace[0].error)appointments.push(shiftRace[0].data.id);
 ok(shiftRace.filter(r=>!r.error).length===1,'Reserva y eliminación de turno concurrentes: una gana');
 // Estados en registros sintéticos propios. Trasladar fixture al pasado solo por postgres.
 let lifecycle=await save(simple(pets[0],employees[0],'15:00','16:00','2030-07-30'));
 sql(`update public.appointment_item_staff set starts_at='2020-07-28 15:00+00',ends_at='2020-07-28 16:00+00' where item_id in(select id from public.appointment_items where appointment_id='${lifecycle.id}');update public.appointments set starts_at='2020-07-28 15:00+00',ends_at='2020-07-28 16:00+00' where id='${lifecycle.id}'`);
 lifecycle=await value(owner.rpc('change_appointment_status',{p_id:lifecycle.id,p_expected_version:lifecycle.version,p_target:'IN_PROGRESS'}));
 ok(lifecycle.status==='IN_PROGRESS','Transición a atención una vez llegado el inicio');
 lifecycle=await value(owner.rpc('change_appointment_status',{p_id:lifecycle.id,p_expected_version:lifecycle.version,p_target:'COMPLETED'}));
 ok(lifecycle.status==='COMPLETED','Completar después de iniciar');
 ok(!(await value(owner.rpc('appointment_availability',{p_employee_id:employees[0],p_date:'2020-07-28',p_start:'10:00',p_end:'11:00'}))).interval_covered,'Completada mantiene ocupación histórica');
 let absent=await save(simple(pets[0],employees[0],'16:00','17:00','2030-07-30'));
 sql(`update public.appointment_item_staff set starts_at='2020-07-28 16:00+00',ends_at='2020-07-28 17:00+00' where item_id in(select id from public.appointment_items where appointment_id='${absent.id}');update public.appointments set starts_at='2020-07-28 16:00+00',ends_at='2020-07-28 17:00+00' where id='${absent.id}'`);
 absent=await value(owner.rpc('change_appointment_status',{p_id:absent.id,p_expected_version:absent.version,p_target:'NO_SHOW'}));
 ok(absent.status==='NO_SHOW'&&(await value(owner.rpc('appointment_availability',{p_employee_id:employees[0],p_date:'2020-07-28',p_start:'11:00',p_end:'12:00'}))).interval_covered,'No asistió libera capacidad');
 // 1002 citas canceladas completas: datos sintéticos propios, sin ocupación vigente.
 sql(`insert into public.appointments(client_id,starts_at,ends_at,total_price,created_by,status,cancelled_at,cancelled_by,cancel_reason) select '${clients[1]}','2030-07-30 19:00+00','2030-07-30 20:00+00',50.25,'${actors.OWNER.id}','CANCELLED',now(),'${actors.OWNER.id}','${prefix}' from generate_series(1,1002);insert into public.appointment_items(appointment_id,pet_id,client_id,service_id,price,duration_minutes,requires_specialist_snapshot) select id,'${pets[2]}','${clients[1]}','${services[1]}',50.25,60,false from public.appointments where client_id='${clients[1]}';insert into public.appointment_item_staff(item_id,employee_id,stage,starts_at,ends_at) select id,'${employees[0]}','SERVICE','2030-07-30 19:00+00','2030-07-30 20:00+00' from public.appointment_items where client_id='${clients[1]}'`);
 const bulk=await value(staff.rpc('search_appointments',{p_from:'2030-07-30T00:00:00-05:00',p_until:'2030-07-31T00:00:00-05:00',p_search:prefix+'1',p_status:'CANCELLED',p_page:101,p_size:10}));
 ok(bulk.total===1002&&bulk.rows.length===2&&bulk.rows[0].items.length===1,'Agenda y detalle superan 1000 sin truncado');
 const range=await value(staff.rpc('search_appointments',{p_from:'2030-07-29T00:00:00-05:00',p_until:'2030-07-31T00:00:00-05:00',p_search:prefix,p_size:1,p_page:2}));ok(range.total>=5&&range.rows.length===1,'Agenda paginada por rango y búsqueda');
 // Un administrador desactivado mientras espera el mutex no puede guardar al despertar.
 const lockName='agenda-lock-'+randomUUID();
 const locker=spawn('psql',[`postgresql://postgres:postgres@127.0.0.1:55322/postgres?application_name=${lockName}`,'-At','-v','ON_ERROR_STOP=1','-c','begin','-c','select pg_advisory_xact_lock(930003)','-c','select pg_sleep(5)','-c','commit'],{stdio:['ignore','pipe','pipe']});
 const ended=new Promise(resolve=>locker.on('exit',resolve));
 const lockCount=query=>Number(sql(query).toString().split('\n').map(x=>x.trim()).find(x=>/^\d+$/.test(x))??0);
 let locked=false;
 for(let n=0;n<50&&!locked;n++){await new Promise(resolve=>setTimeout(resolve,25));locked=lockCount(`select count(*) from pg_locks l join pg_stat_activity a on a.pid=l.pid where a.application_name='${lockName}' and l.locktype='advisory' and l.objid=930003 and l.granted`)>0;}
 assert.ok(locked,'La conexión de ensayo debe poseer el mutex');
 const waiting=Promise.resolve(admin.rpc('save_internal_appointment',{p_input:simple(pets[0],employees[0],'13:00','14:00','2030-07-30')}));
 let blocked=false;
 for(let n=0;n<20&&!blocked;n++){await new Promise(resolve=>setTimeout(resolve,50));blocked=lockCount("select count(*) from pg_locks where locktype='advisory' and objid=930003 and not granted")>0;}
 assert.ok(blocked,'La petición debe estar esperando el mutex');
 await value(owner.rpc('set_profile_active',{p_user_id:actors.ADMIN.id,p_active:false}));
 const revoked=await waiting;await ended;
 ok(revoked.error?.code==='42501','Revalidar permisos tras esperar el mutex');
 await value(owner.rpc('set_profile_active',{p_user_id:actors.ADMIN.id,p_active:true}));
 ok((await value(owner.from('appointments').select('id').eq('client_id',clients[0]).eq('starts_at','2030-07-30T18:00:00Z'))).length===0,'Administrador desactivado no dejó una reserva');
 await value(owner.rpc('set_profile_active',{p_user_id:actors.CLIENT.id,p_active:false}));
 const incident=await value(owner.rpc('get_appointment',{p_id:late.id}));ok(incident.needs_attention,'Desactivación de perfil alerta reservas afectadas sin impedir seguridad');
 await value(owner.rpc('set_profile_active',{p_user_id:actors.CLIENT.id,p_active:true}));
 await value(owner.rpc('set_profile_active',{p_user_id:actors.STAFF.id,p_active:false}));ok(!!(await staff.rpc('get_appointment',{p_id:late.id})).error,'Actor inactivo pierde acceso');
 console.log(`Fase 4 API: ${checks} comprobaciones correctas.`);
}finally{
 sql(`delete from public.appointment_internal where appointment_id in(select id from public.appointments where client_id in(${ids(clients)}));delete from public.appointment_item_staff where item_id in(select id from public.appointment_items where client_id in(${ids(clients)}));delete from public.appointment_items where client_id in(${ids(clients)});delete from public.appointments where client_id in(${ids(clients)});delete from public.time_blocks where id in(${ids(blocks)});delete from public.employee_schedules where employee_id in(${ids(employees)});delete from public.employees where id in(${ids(employees)});delete from public.pets where id in(${ids(pets)});delete from public.clients where id in(${ids(clients)});delete from public.services where id in(${ids(services)})`);
 for(const id of users)await root.auth.admin.deleteUser(id);
}
