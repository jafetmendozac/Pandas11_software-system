// Solo identity-dev. Nunca imprimir credenciales o datos ajenos a los fixtures.
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
const env=JSON.parse(execFileSync('supabase',['status','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
assert.equal(env.API_URL,'http://127.0.0.1:55321');
const options={auth:{persistSession:false,autoRefreshToken:false}};
const root=createClient(env.API_URL,env.SERVICE_ROLE_KEY,options);
const users=[],clients=[],pets=[],bulkPrefix='Pagination-'+randomUUID();
const apis={};let checks=0;
const check=(ok,label)=>{assert.ok(ok,label);checks++;};
const sql=text=>execFileSync('psql',['postgresql://postgres:postgres@127.0.0.1:55322/postgres','-v','ON_ERROR_STOP=1','-c',text],{stdio:'pipe'});
const value=async result=>{const r=await result;assert.ifError(r.error);return r.data;};
try{
 for(const role of ['OWNER','ADMIN','STAFF','A','B']){
  const password=randomUUID()+'Aa1!';const email=`records-${randomUUID()}@example.test`;
  const data=await value(root.auth.admin.createUser({email,password,email_confirm:true}));
  users.push(data.user.id);
  if(['OWNER','ADMIN','STAFF'].includes(role))sql(`insert into public.user_roles select '${data.user.id}'::uuid,id from public.roles where code='${role}'`);
  const api=createClient(env.API_URL,env.ANON_KEY,options);await value(api.auth.signInWithPassword({email,password}));
  apis[role]={api,id:data.user.id};
 }
 const owner=apis.OWNER.api,admin=apis.ADMIN.api,staff=apis.STAFF.api,a=apis.A.api,b=apis.B.api;
 async function makeClient(input){const row=await value(owner.rpc('save_client',{p_input:input}));clients.push(row.id);return row;}
 const c1=await makeClient({first_name:"O'Connor",phone:'900111222',profile_id:apis.A.id});
 const c2=await makeClient({first_name:'Cliente B',profile_id:apis.B.id});
 const c3=await makeClient({first_name:'Sin cuenta'});
 check(c3.profile_id===null,'Cliente sin cuenta permitido');
 const p1=await value(owner.from('pets').insert({client_id:c1.id,name:'Toby',pet_size:'TOY',allergies:true,bites:true,client_notes:'Indicaciones visibles'}).select().single());pets.push(p1.id);
 const p2=await value(owner.from('pets').insert({client_id:c2.id,name:'Luna'}).select().single());pets.push(p2.id);
 check(p1.pet_size==='TOY'&&p1.allergies===true,'TOY y alergias boolean');
 check(!!(await owner.from('pets').insert({client_id:c1.id,name:'',weight_kg:2})).error,'Nombre vacío rechazado');
 check(!!(await owner.from('pets').insert({client_id:c1.id,name:'Peso',weight_kg:-1})).error,'Peso negativo rechazado');
 check(!!(await owner.from('pets').insert({client_id:c1.id,name:'Fechas',birth_date:'2025-01-01',death_date:'2024-01-01'})).error,'Fechas de vida inválidas rechazadas');
 check(!!(await owner.from('pets').insert({client_id:randomUUID(),name:'Huérfano'})).error,'Cliente inexistente rechazado');
 const own=await value(a.from('clients').select('id'));check(own.length===1&&own[0].id===c1.id,'Cliente A solo ficha propia');
 const ownPets=await value(a.from('pets').select('id,client_notes'));check(ownPets.length===1&&ownPets[0].id===p1.id&&ownPets[0].client_notes==='Indicaciones visibles','Solo mascotas propias y observaciones visibles');
 check((await value(b.from('pets').select('id'))).every(row=>row.id!==p1.id),'B no ve mascotas de A');
 check(!!(await a.rpc('save_client',{p_input:{first_name:'Ataque',profile_id:apis.A.id}})).error,'Cliente no se vincula por RPC');
 check(!!(await a.from('clients').update({profile_id:apis.A.id}).eq('id',c2.id)).error,'Vínculo directo protegido');
 check(!!(await owner.from('pets').update({client_id:c2.id}).eq('id',p1.id)).error,'Transferencia de mascota denegada');
 check(!!(await staff.rpc('save_client',{p_input:{first_name:'Sin permiso'}})).error,'STAFF no crea clientes');
 const deniedEdit=await a.from('pets').update({name:'Cambio'}).eq('id',p1.id).select('id');
 check(!deniedEdit.error&&deniedEdit.data.length===0,'Cliente no edita mascota');
 check((await value(owner.from('pets').select('name').eq('id',p1.id).single())).name==='Toby','Nombre permanece intacto');
 await value(admin.from('pets').update({breed:'Mestizo'}).eq('id',p1.id).select('id').single());checks++;
 await value(owner.from('pet_internal').insert({pet_id:p1.id,notes:'Detalle reservado de alergia'}).select().single());
 const note=await value(staff.from('pet_internal').select('notes,updated_by').eq('pet_id',p1.id).single());
 check(note.notes==='Detalle reservado de alergia'&&note.updated_by===apis.OWNER.id,'Personal lee nota con autor servidor');
 check((await value(a.from('pet_internal').select('*'))).length===0,'Cliente sin notas internas');
 const deniedNote=await staff.from('pet_internal').update({notes:'Cambio'}).eq('pet_id',p1.id).select('pet_id');
 check(!deniedNote.error&&deniedNote.data.length===0,'STAFF no edita notas');
 check(!!(await owner.from('pet_internal').update({updated_by:apis.A.id}).eq('pet_id',p1.id)).error,'Autor no falsificable');
 const embedded=await value(a.from('pets').select('id,pet_internal(notes)').eq('id',p1.id).single());
 check(embedded.pet_internal===null || (Array.isArray(embedded.pet_internal)&&embedded.pet_internal.length===0),'Join no filtra notas internas');
 await value(owner.from('client_internal').insert({client_id:c1.id,notes:'Reservado cliente'}).select().single());
 check((await value(a.from('client_internal').select('*'))).length===0,'Notas de cliente privadas');
 check(!!(await a.from('client_internal').insert({client_id:c1.id,notes:'Ataque'})).error,'Cliente no escribe notas internas');
 const vaccine=await value(admin.from('pet_vaccinations').insert({pet_id:p1.id,vaccine:'Rabia',applied_on:'2026-01-01',valid_until:'2027-01-01'}).select().single());
 check((await value(a.from('pet_vaccinations').select('id'))).length===1,'Vacunas propias visibles');
 check((await value(b.from('pet_vaccinations').select('id'))).length===0,'Vacunas ajenas ocultas');
 check(!!(await staff.from('pet_vaccinations').insert({pet_id:p1.id,vaccine:'No',applied_on:'2026-01-01'})).error,'STAFF no registra vacunas');
 check(!!(await owner.from('pet_vaccinations').insert({pet_id:p1.id,vaccine:'Error',applied_on:'2026-01-02',valid_until:'2026-01-01'})).error,'Vigencia inválida denegada');
 await value(admin.from('pet_vaccinations').update({vaccine:'Rabia corregida'}).eq('id',vaccine.id).select('id').single());checks++;
 const result=await value(staff.rpc('search_clients',{p_search:"O'Connor",p_page:1,p_size:5}));
 check(result.rows.some(row=>row.id===c1.id),'Búsqueda con apóstrofe');
 const phoneSearch=await value(staff.rpc('search_clients',{p_search:'900111222'}));check(phoneSearch.rows.some(row=>row.id===c1.id),'Búsqueda por teléfono');
 const petSearch=await value(staff.rpc('search_pets',{p_search:"O'Connor"}));check(petSearch.rows.some(row=>row.id===p1.id),'Búsqueda por dueño');
 sql(`insert into public.clients(first_name) select '${bulkPrefix}-'||i from generate_series(1,1002) i`);
 const page=await value(staff.rpc('search_clients',{p_search:bulkPrefix,p_page:101,p_size:10}));
 check(page.total===1002&&page.rows.length===2,'Paginación más allá de límite de 1000');
 await value(owner.rpc('retire_client',{p_id:c1.id}));
 check((await value(a.from('pets').select('id'))).length===0,'Retiro cliente oculta mascotas propias');
 check((await value(a.from('pet_vaccinations').select('id'))).length===0,'Retiro oculta vacunas al cliente');
 const archived=await value(staff.rpc('search_pets',{p_search:'Toby',p_archived:true}));check(archived.rows.some(row=>row.id===p1.id),'Personal consulta archivo');
 check((await value(staff.from('pet_vaccinations').select('id').eq('id',vaccine.id))).length===1,'Vacunas preservadas');
 check((await value(staff.from('pet_internal').select('pet_id').eq('pet_id',p1.id))).length===1,'Notas preservadas');
 const noEdit=await admin.from('pets').update({name:'Archivado'}).eq('id',p1.id).select('id');check(!noEdit.error&&noEdit.data.length===0,'Archivo sin edición');
 check(!!(await owner.from('pets').insert({client_id:c1.id,name:'No permitido'})).error,'No crear mascota en cliente retirado');
 check(!!(await createClient(env.API_URL,env.ANON_KEY,options).from('clients').select('id')).error,'Anon sin fichas');
 check(!!(await staff.rpc('retire_pet',{p_id:p2.id})).error,'STAFF no retira mascotas');
 await value(owner.rpc('retire_pet',{p_id:p2.id}));
 check((await value(b.from('pets').select('id'))).length===0,'Retiro individual oculta mascota');
 console.log(`Fase 1 API: ${checks} comprobaciones correctas.`);
}finally{
 // IDs aleatorios creados en esta ejecución; no reiniciar ni borrar datos del usuario.
 for(const id of pets){sql(`delete from public.pet_internal where pet_id='${id}';delete from public.pet_vaccinations where pet_id='${id}';delete from public.pets where id='${id}'`);}
 for(const id of clients){sql(`delete from public.client_internal where client_id='${id}';delete from public.clients where id='${id}'`);}
 sql(`delete from public.clients where first_name like '${bulkPrefix}-%'`);
 for(const id of users)await root.auth.admin.deleteUser(id);
}
