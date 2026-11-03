// Exclusivamente Supabase local; usuarios y artículos sintéticos propios.
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const env=JSON.parse(execFileSync('supabase',['status','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
assert.equal(env.API_URL,'http://127.0.0.1:55321');
const sql=q=>execFileSync('psql',['postgresql://postgres:postgres@127.0.0.1:55322/postgres','-v','ON_ERROR_STOP=1','-Atc',q],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const opts={auth:{persistSession:false,autoRefreshToken:false}};
const root=createClient(env.API_URL,env.SERVICE_ROLE_KEY,opts), users=[], products=[], sales=[];
const clientId=randomUUID(), prefix='Sales-'+randomUUID();let created=false,checks=0;
const value=async p=>{const r=await p;assert.ifError(r.error);checks++;return r.data;};
const fail=async p=>{assert.ok((await p).error);checks++;};
try{
 const actors={};
 for(const role of ['OWNER','ADMIN','STAFF','CLIENT']){
  const email='sales-'+randomUUID()+'@example.test',password=randomUUID()+'Aa1!';
  const u=await value(root.auth.admin.createUser({email,password,email_confirm:true}));users.push(u.user.id);
  if(role!=='CLIENT')sql(`insert into public.user_roles select '${u.user.id}',id from public.roles where code='${role}'`);
  const api=createClient(env.API_URL,env.ANON_KEY,opts);await value(api.auth.signInWithPassword({email,password}));actors[role]=api;
 }
 sql(`insert into public.clients(id,first_name) values('${clientId}','${prefix}')`);created=true;
 const owner=actors.OWNER, admin=actors.ADMIN;
 await value(owner.rpc('search_sales',{p_search:prefix,p_page:1,p_size:1}));
 const p=await value(admin.rpc('save_product',{p_id:null,p_name:prefix,p_sku:null,p_price:'12.35',p_active:true}));products.push(p.id);assert.equal(p.price,'12.35');
 const catalog=await value(admin.rpc('search_products',{p_search:prefix,p_page:1,p_size:10,p_active:true}));assert.equal(catalog.total,1);
 const input={request_id:randomUUID(),client_id:clientId,appointment_id:null,products:[{product_id:p.id,quantity:3}]};
 const sale=await value(admin.rpc('create_sale_draft',{p_input:input}));sales.push(sale.id);assert.equal(sale.total,'37.05');
 assert.equal((await value(admin.rpc('create_sale_draft',{p_input:input}))).id,sale.id);
 assert.equal((await value(owner.rpc('get_sale',{p_id:sale.id}))).items.length,1);
 await fail(owner.rpc('confirm_sale',{p_id:sale.id,p_expected_version:1}));
 await fail(owner.rpc('cancel_sale',{p_id:sale.id,p_expected_version:99,p_reason:'Fixture'}));
 const cancelled=await value(owner.rpc('cancel_sale',{p_id:sale.id,p_expected_version:1,p_reason:'Fixture'}));assert.equal(cancelled.status,'CANCELLED');
 for(const actor of [actors.STAFF,actors.CLIENT,createClient(env.API_URL,env.ANON_KEY,opts)]){
  await fail(actor.rpc('search_sales',{}));await fail(actor.rpc('search_products',{}));
  await fail(actor.rpc('get_sale',{p_id:sale.id}));
 }
 console.log(`${checks} comprobaciones API de ventas correctas; precios, borradores, reintentos, roles y conflictos.`);
}finally{
 for(const id of sales){sql(`delete from public.sale_items where sale_id='${id}'`);sql(`delete from public.sales where id='${id}'`);}
 for(const id of products)sql(`delete from public.products where id='${id}'`);
 if(created)sql(`delete from public.clients where id='${clientId}'`);
 for(const id of users){sql(`delete from public.user_roles where user_id='${id}'`);const r=await root.auth.admin.deleteUser(id);assert.ifError(r.error);}
}
