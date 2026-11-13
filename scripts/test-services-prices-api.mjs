// Fixtures locales aislados. No imprimir claves; no reset.
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const env=JSON.parse(execFileSync('supabase',['status','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
assert.equal(env.API_URL,'http://127.0.0.1:55321');
const opts={auth:{persistSession:false,autoRefreshToken:false}},root=createClient(env.API_URL,env.SERVICE_ROLE_KEY,opts);
const users=[],services=[],actors={},prefix='Pricing-'+randomUUID();let checks=0;
const ok=(condition,label)=>{assert.ok(condition,label);checks++;};
const value=async request=>{const r=await request;assert.ifError(r.error);return r.data;};
const sql=text=>execFileSync('psql',['postgresql://postgres:postgres@127.0.0.1:55322/postgres','-v','ON_ERROR_STOP=1','-c',text],{stdio:'pipe'});
try{
 for(const role of ['OWNER','ADMIN','STAFF','CLIENT']){
  const email=`pricing-${randomUUID()}@example.test`,password=randomUUID()+'Aa1!';
  const d=await value(root.auth.admin.createUser({email,password,email_confirm:true}));users.push(d.user.id);
  if(role!=='CLIENT')sql(`insert into public.user_roles select '${d.user.id}'::uuid,id from public.roles where code='${role}'`);
  const api=createClient(env.API_URL,env.ANON_KEY,opts);await value(api.auth.signInWithPassword({email,password}));actors[role]={api,id:d.user.id};
 }
 const owner=actors.OWNER.api,admin=actors.ADMIN.api,staff=actors.STAFF.api,client=actors.CLIENT.api;
 const makeService=async payload=>{const s=await value(owner.from('services').insert({name:prefix,base_price:'100.10',base_duration_minutes:120,...payload}).select().single());services.push(s.id);return s;};
 const s=await makeService({});
 const quote=async(size=null,api=owner,id=s.id)=>value(api.rpc('quote_service',{p_service_id:id,p_size:size}));
 const add=payload=>value(admin.from('service_prices').insert({service_id:s.id,pet_size:'TOY',price:'90.25',duration_minutes:100,...payload}).select().single());
 let q=await quote('TOY');ok(q.source==='BASE'&&q.price==='100.10'&&q.duration_minutes===120&&q.rule_id===null,'Fallback base exacto');
 ok(!!(await owner.rpc('quote_service',{p_service_id:s.id,p_size:'TOY',p_ignored_breed:randomUUID()})).error,'Firma histórica con raza no está expuesta por API');
 const toy=await add({price:'0',duration_minutes:45});q=await quote('TOY');ok(q.source==='SIZE'&&q.rule_id===toy.id&&q.price==='0'&&q.duration_minutes===45,'Tamaño exacto gana y cero es válido');
 q=await quote();ok(q.source==='BASE'&&q.price==='100.10','Tamaño desconocido usa base');
 ok(!!(await admin.from('service_prices').insert({service_id:s.id,pet_size:'TOY',price:'10',duration_minutes:30})).error,'No duplicar servicio y tamaño');
 ok(!!(await admin.from('service_prices').insert({service_id:s.id,price:'10',duration_minutes:30})).error,'Tamaño obligatorio');
 for(const payload of [
  {base_price:'-1'},{base_price:'1.234'},{base_price:null},{base_price:'NaN'},{base_price:'Infinity'},
  {base_duration_minutes:0},{base_duration_minutes:-1},{base_duration_minutes:1.5},{base_duration_minutes:null},{name:'   '},
 ])ok(!!(await owner.from('services').insert({name:prefix,base_price:'1',base_duration_minutes:1,...payload})).error,'Datos base inválidos denegados');
 for(const payload of [{price:null},{price:'-1'},{price:'1.234'},{duration_minutes:null},{duration_minutes:0},{duration_minutes:1.5}])
  ok(!!(await admin.from('service_prices').insert({service_id:s.id,pet_size:'LARGE',price:'1',duration_minutes:1,...payload})).error,'Tarifa incompleta/inválida denegada');
 ok(!!(await admin.from('service_prices').insert({service_id:randomUUID(),pet_size:'SMALL',price:'1',duration_minutes:1})).error,'FK servicio obligatoria');
 const hidden=await makeService({name:prefix+' oculto',visible_to_clients:false});
 const inactive=await makeService({name:prefix+' inactivo',active:false});
 await value(owner.from('service_prices').insert({service_id:hidden.id,pet_size:'SMALL',price:'2',duration_minutes:20}));
 ok((await value(client.from('services').select('id').in('id',services))).length===1,'CLIENT solo servicio activo visible');
 ok((await value(client.from('service_prices').select('id').eq('service_id',hidden.id))).length===0,'CLIENT no ve tarifas ocultas');
 ok(!!(await client.rpc('quote_service',{p_service_id:hidden.id})).error,'CLIENT no cotiza oculto');
 ok(!!(await owner.rpc('quote_service',{p_service_id:inactive.id})).error,'Ni owner cotiza inactivo');
 ok((await quote('TOY',client)).source==='SIZE','CLIENT calcula catálogo permitido');
 ok((await quote(null,staff,hidden.id)).source==='BASE','STAFF calcula oculto autorizado');
 ok(!!(await staff.from('services').insert({name:prefix,base_price:'1',base_duration_minutes:10})).error,'STAFF no crea servicios');
 const noEdit=await client.from('services').update({base_price:'1'}).eq('id',s.id).select('id');ok(!noEdit.error&&noEdit.data.length===0,'CLIENT no edita servicio');
 ok(!!(await staff.from('service_prices').insert({service_id:s.id,pet_size:'SMALL',price:'1',duration_minutes:10})).error,'STAFF no crea tarifa');
 const noDelete=await staff.from('service_prices').delete().eq('id',toy.id).select('id');ok(!noDelete.error&&noDelete.data.length===0,'STAFF no elimina tarifa');
 await value(admin.from('service_prices').delete().eq('id',toy.id).select('id').single());q=await quote('TOY');ok(q.source==='BASE','Eliminar tarifa restablece valores base');
 await add({pet_size:'SMALL',price:'70.15',duration_minutes:80});
 const precise=await makeService({name:prefix+' preciso',base_price:'9007199254740993.25',base_duration_minutes:5});
 const exactDecimal=await quote(null,client,precise.id);ok(exactDecimal.price==='9007199254740993.25','RPC conserva decimal sin límite de precisión JS');
 const matches=await value(staff.rpc('search_services',{p_search:prefix}));ok(matches.rows.every(r=>typeof r.base_price==='string'),'Catálogo devuelve importes como texto');
 await value(admin.from('services').update({active:false}).eq('id',s.id).select('id').single());
 ok((await value(owner.from('service_prices').select('id').eq('service_id',s.id))).length===1,'Desactivar preserva tarifas');
 ok(!!(await client.rpc('quote_service',{p_service_id:s.id})).error,'Cotización revocada al desactivar');
 ok((await value(client.from('service_prices').select('id').eq('service_id',s.id))).length===0,'Tarifas inactivas ocultas al cliente');
 ok(!!(await owner.from('services').delete().eq('id',s.id)).error,'Sin borrado físico de servicios por API');
 const anon=createClient(env.API_URL,env.ANON_KEY,opts);ok(!!(await anon.rpc('quote_service',{p_service_id:precise.id})).error,'Anon no calcula');
 sql(`insert into public.services(name,base_price,base_duration_minutes) select '${prefix}-bulk-'||i,1.25,10 from generate_series(1,1002) i`);
 const page=await value(staff.rpc('search_services',{p_search:prefix+'-bulk-',p_page:101,p_size:10}));ok(page.total===1002&&page.rows.length===2,'Paginación de servicios supera 1000');
 sql(`insert into public.service_prices(service_id,pet_size,price,duration_minutes) select id,'SMALL',2.25,15 from public.services where name like '${prefix}-bulk-%'`);
 const pricePage=await value(staff.rpc('search_service_prices',{p_search:prefix+'-bulk-',p_page:101,p_size:10}));ok(pricePage.total===1002&&pricePage.rows.length===2,'Paginación de tarifas supera 1000');
 await value(owner.rpc('set_profile_active',{p_user_id:actors.STAFF.id,p_active:false}));
 ok(!!(await staff.rpc('quote_service',{p_service_id:precise.id})).error,'Perfil inactivo no cotiza');
 console.log(`Servicios y tarifas API: ${checks} comprobaciones correctas.`);
}finally{
 sql(`delete from public.service_prices where service_id in (select id from public.services where name like '${prefix}%');delete from public.services where name like '${prefix}%'`);
 for(const id of users)await root.auth.admin.deleteUser(id);
}
