// Solo Supabase local, UUID/cuentas sintéticos propios; sin reset ni datos reales.
import {execFileSync, spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const env=JSON.parse(execFileSync('supabase',['status','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
assert.equal(env.API_URL,'http://127.0.0.1:55321');
const db='postgresql://postgres:postgres@127.0.0.1:55322/postgres';
const sql=q=>execFileSync('psql',[db,'-v','ON_ERROR_STOP=1','-Atc',q],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const opts={auth:{persistSession:false,autoRefreshToken:false}};
const root=createClient(env.API_URL,env.SERVICE_ROLE_KEY,opts), users=[], products=[], sales=[];
const clientId=randomUUID(), prefix='Inventory-'+randomUUID();let created=false,checks=0,blocker;
const ok=(condition,label)=>{assert.ok(condition,label);checks++;};
const value=async p=>{const r=await p;assert.ifError(r.error);checks++;return r.data;};
const fail=async(p,code)=>{const r=await p;ok(!!r.error,'Expected denied request');if(code)assert.equal(r.error.code,code);};
const balance=async(api,id)=>{const r=await value(api.rpc('search_inventory',{p_search:prefix,p_size:100}));return r.rows.find(b=>b.product_id===id);};
const actors={};
try{
 for(const role of ['OWNER','ADMIN','STAFF','CLIENT']){
  const email='inventory-'+randomUUID()+'@example.test',password=randomUUID()+'Aa1!';
  const u=await value(root.auth.admin.createUser({email,password,email_confirm:true}));users.push(u.user.id);
  if(role!=='CLIENT')sql(`insert into public.user_roles select '${u.user.id}',id from public.roles where code='${role}'`);
  const api=createClient(env.API_URL,env.ANON_KEY,opts);await value(api.auth.signInWithPassword({email,password}));actors[role]={api,id:u.user.id};
 }
 sql(`insert into public.clients(id,first_name) values('${clientId}','${prefix}')`);created=true;
 const owner=actors.OWNER.api, admin=actors.ADMIN.api;
 const product=async suffix=>{const p=await value(admin.rpc('save_product',{p_id:null,p_name:prefix+suffix,p_sku:null,p_price:'12.35',p_active:true}));products.push(p.id);return p;};
 const p=await product('-main');const p2=await product('-empty');
 ok((await balance(owner,p.id)).quantity===0,'New product zero');
 const moveInput=async(id,kind,delta)=>({request_id:randomUUID(),product_id:id,kind,delta,reason:'Fixture',expected_version:(await balance(owner,id)).version});
 const initial=await moveInput(p.id,'INITIAL',10);
 const m=await value(admin.rpc('record_inventory_movement',{p_input:initial}));
 ok((await value(admin.rpc('record_inventory_movement',{p_input:initial}))).id===m.id,'Idempotent receipt');
 await fail(admin.rpc('record_inventory_movement',{p_input:{...initial,delta:9}}),'22023');
 await fail(admin.rpc('record_inventory_movement',{p_input:await moveInput(p.id,'INITIAL',1)}),'22023');
 await fail(admin.rpc('record_inventory_movement',{p_input:await moveInput(p.id,'ADJUSTMENT',1)}),'42501');
 const receipt=await moveInput(p.id,'RECEIPT',2);
 await value(admin.rpc('record_inventory_movement',{p_input:receipt}));
 await fail(owner.rpc('record_inventory_movement',{p_input:{...receipt,request_id:randomUUID()}}),'40001');
 await fail(owner.rpc('record_inventory_movement',{p_input:{...await moveInput(p.id,'RECEIPT',1),delta:1.5}}),'22023');
 await fail(owner.rpc('record_inventory_movement',{p_input:await moveInput(p.id,'ADJUSTMENT',-13)}),'22023');
 await fail(owner.from('inventory_balances').update({quantity:999}).eq('product_id',p.id),'42501');
 await fail(owner.from('inventory_movements').delete().eq('id',m.id),'42501');
 const draft=async lines=>{const s=await value(admin.rpc('create_sale_draft',{p_input:{request_id:randomUUID(),client_id:clientId,products:lines}}));sales.push(s.id);return s;};
 const s=await draft([{product_id:p.id,quantity:3}]);
 ok((await balance(owner,p.id)).quantity===12,'Draft no reserve');
 const confirmed=await value(admin.rpc('confirm_sale',{p_id:s.id,p_expected_version:1}));
 ok(confirmed.total==='37.05'&&confirmed.status==='CONFIRMED','Confirmed exact');
 await value(admin.rpc('confirm_sale',{p_id:s.id,p_expected_version:1}));
 ok((await balance(owner,p.id)).quantity===9,'Retry no extra deduction');
 await fail(admin.rpc('cancel_sale',{p_id:s.id,p_expected_version:2,p_reason:'Fixture',p_disposition:'RESTOCK'}),'42501');
 await fail(owner.rpc('cancel_sale',{p_id:s.id,p_expected_version:2,p_reason:'Fixture'}),'22023');
 await value(owner.rpc('cancel_sale',{p_id:s.id,p_expected_version:2,p_reason:'Fixture',p_disposition:'RESTOCK'}));
 await value(owner.rpc('cancel_sale',{p_id:s.id,p_expected_version:2,p_reason:'Fixture',p_disposition:'RESTOCK'}));
 ok((await balance(owner,p.id)).quantity===12,'Exactly one restock');
 const insufficient=await draft([{product_id:p.id,quantity:1},{product_id:p2.id,quantity:1}]);
 await fail(owner.rpc('confirm_sale',{p_id:insufficient.id,p_expected_version:1}),'22023');
 ok((await balance(owner,p.id)).quantity===12,'Atomic insufficient line rollback');
 // Dos peticiones concurrentes esperan el mismo bloqueo en conexiones distintas.
 await value(owner.rpc('record_inventory_movement',{p_input:await moveInput(p2.id,'INITIAL',1)}));
 const raceA=await draft([{product_id:p2.id,quantity:1}]),raceB=await draft([{product_id:p2.id,quantity:1}]);
 blocker=spawn('psql',[db,'-At','-v','ON_ERROR_STOP=1'],{stdio:['pipe','pipe','pipe']});
 const locked=new Promise((resolve,reject)=>{let data='';blocker.stdout.on('data',chunk=>{data+=chunk;if(data.includes('LOCKED'))resolve();});blocker.on('error',reject);blocker.on('exit',code=>{if(code)reject(new Error('Blocker failed'));});});
 blocker.stdin.write("begin; select pg_advisory_xact_lock(930003); select 'LOCKED';\n");await locked;
 const races=Promise.all([raceA,raceB].map(r=>owner.rpc('confirm_sale',{p_id:r.id,p_expected_version:1}).then(result=>result)));
 let waiting=0;
 for(let n=0;n<60;n++){waiting=Number(sql("select count(*) from pg_stat_activity where wait_event='advisory' and query like '%confirm_sale%'"));if(waiting>=2)break;await new Promise(r=>setTimeout(r,50));}
 ok(waiting>=2,'Two requests waiting concurrently');blocker.stdin.end('commit;\n');
 const results=await races;ok(results.filter(r=>!r.error).length===1&&results.filter(r=>r.error?.code==='22023').length===1,'Last unit sold once');
 ok((await balance(owner,p2.id)).quantity===0,'No negative stock');
 const winner=results.find(r=>!r.error).data;
 await value(owner.rpc('cancel_sale',{p_id:winner.id,p_expected_version:2,p_reason:'Not recovered',p_disposition:'NO_RESTOCK'}));
 ok((await balance(owner,p2.id)).quantity===0,'No restock disposition honored');

 // Competencia entre ajuste OWNER y confirmación por la misma última unidad.
 await value(owner.rpc('record_inventory_movement',{p_input:await moveInput(p2.id,'RECEIPT',1)}));
 const raceC=await draft([{product_id:p2.id,quantity:1}]);
 const adjustment=await moveInput(p2.id,'ADJUSTMENT',-1);
 blocker=spawn('psql',[db,'-At','-v','ON_ERROR_STOP=1'],{stdio:['pipe','pipe','pipe']});
 await new Promise((resolve,reject)=>{let data='';blocker.stdout.on('data',chunk=>{data+=chunk;if(data.includes('LOCKED'))resolve();});blocker.on('error',reject);blocker.stdin.write("begin; select pg_advisory_xact_lock(930003); select 'LOCKED';\n");});
 const mixedRace=Promise.all([
  owner.rpc('confirm_sale',{p_id:raceC.id,p_expected_version:1}).then(r=>r),
  owner.rpc('record_inventory_movement',{p_input:adjustment}).then(r=>r),
 ]);
 waiting=0;
 for(let n=0;n<60;n++){waiting=Number(sql("select count(*) from pg_stat_activity where wait_event='advisory' and (query like '%confirm_sale%' or query like '%record_inventory_movement%')"));if(waiting>=2)break;await new Promise(r=>setTimeout(r,50));}
 ok(waiting>=2,'Adjustment and sale wait concurrently');blocker.stdin.end('commit;\n');
 const competing=await mixedRace;
 ok(competing.filter(r=>!r.error).length===1,'Exactly one consumes final unit');
 ok((await balance(owner,p2.id)).quantity===0,'Adjustment race leaves valid balance');
 const history=await value(owner.rpc('search_inventory_movements',{p_product_id:p.id,p_page:1,p_size:2}));
 ok(history.rows.length===2&&history.total===4,'History pagination total');
 const filtered=await value(owner.rpc('search_inventory_movements',{p_product_id:p.id,p_sale_id:s.id}));
 ok(filtered.rows.length===2&&filtered.rows.reduce((sum,m)=>sum+m.delta,0)===0,'History sale reconciliation');
 for(const actor of [actors.STAFF.api,actors.CLIENT.api,createClient(env.API_URL,env.ANON_KEY,opts)]){
  await fail(actor.rpc('search_inventory',{}),'42501');await fail(actor.rpc('search_inventory_movements',{}),'42501');
  await fail(actor.rpc('record_inventory_movement',{p_input:await moveInput(p.id,'RECEIPT',1)}),'42501');
 }

 // Retirar autorización mientras una entrada espera por una fila de catálogo.
 const blockedInput=await moveInput(p.id,'RECEIPT',1);
 blocker=spawn('psql',[db,'-At','-v','ON_ERROR_STOP=1'],{stdio:['pipe','pipe','pipe']});
 await new Promise((resolve,reject)=>{let data='';blocker.stdout.on('data',chunk=>{data+=chunk;if(data.includes('ROW_LOCKED'))resolve();});blocker.on('error',reject);blocker.stdin.write(`begin; select id from public.products where id='${p.id}' for update; select 'ROW_LOCKED';\n`);});
 const blockedMovement=admin.rpc('record_inventory_movement',{p_input:blockedInput}).then(r=>r);
 let rowWaiting=0;
 for(let n=0;n<60;n++){rowWaiting=Number(sql("select count(*) from pg_stat_activity where wait_event='transactionid' and query like '%record_inventory_movement%'"));if(rowWaiting)break;await new Promise(r=>setTimeout(r,50));}
 ok(rowWaiting>0,'Movement is waiting for catalog row');
 sql(`update public.profiles set active=false where id='${actors.ADMIN.id}'`);
 blocker.stdin.end('commit;\n');
 const blockedResult=await blockedMovement;ok(blockedResult.error?.code==='42501','Permission withdrawal honored after row wait');
 sql(`update public.profiles set active=true where id='${actors.ADMIN.id}'`);
 sql(`update public.profiles set active=false where id='${actors.ADMIN.id}'`);
 await fail(admin.rpc('search_inventory',{}),'42501');
 sql(`update public.profiles set active=true where id='${actors.ADMIN.id}'`);
 console.log(`${checks} comprobaciones API de inventario correctas; concurrencia real, RLS, movimientos, ventas y anulaciones.`);
}finally{
 blocker?.kill();
 for(const id of products)sql(`delete from public.inventory_movements where product_id='${id}'`);
 for(const id of sales){sql(`delete from public.sale_items where sale_id='${id}'`);sql(`delete from public.sales where id='${id}'`);}
 for(const id of products)sql(`delete from public.products where id='${id}'`);
 if(created)sql(`delete from public.clients where id='${clientId}'`);
 for(const id of users){sql(`delete from public.user_roles where user_id='${id}'`);const r=await root.auth.admin.deleteUser(id);assert.ifError(r.error);}
}
