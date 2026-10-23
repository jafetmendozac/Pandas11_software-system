// API real contra Supabase local 55321/55322; datos sintéticos y limpieza propia.
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const env=JSON.parse(execFileSync('supabase',['status','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
assert.equal(env.API_URL,'http://127.0.0.1:55321');
const sql=q=>execFileSync('psql',['postgresql://postgres:postgres@127.0.0.1:55322/postgres','-v','ON_ERROR_STOP=1','-Atc',q],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const opts={auth:{persistSession:false,autoRefreshToken:false}};
const root=createClient(env.API_URL,env.SERVICE_ROLE_KEY,opts);
const users=[], actors={}, clientId=randomUUID(), prefix='Commercial-'+randomUUID();
let productId=null,saleId=null,cashId=null,clientCreated=false,checks=0;
const value=async p=>{const r=await p;assert.ifError(r.error);checks++;return r.data;};
const fail=async(p,code)=>{const r=await p;assert.ok(r.error);if(code)assert.equal(r.error.code,code);checks++;};
try{
 for(const role of ['OWNER','ADMIN','STAFF','CLIENT']){
  const email=`commercial-${randomUUID()}@example.test`,password=randomUUID()+'Aa1!';
  const u=await value(root.auth.admin.createUser({email,password,email_confirm:true}));users.push(u.user.id);
  if(role!=='CLIENT')sql(`insert into public.user_roles select '${u.user.id}',id from public.roles where code='${role}'`);
  const api=createClient(env.API_URL,env.ANON_KEY,opts);await value(api.auth.signInWithPassword({email,password}));actors[role]=api;
 }
 const owner=actors.OWNER,admin=actors.ADMIN,staff=actors.STAFF,client=actors.CLIENT;
 sql(`insert into public.clients(id,first_name) values('${clientId}','${prefix}')`);clientCreated=true;
 const product=await value(admin.rpc('save_product',{p_id:null,p_name:prefix,p_sku:null,p_price:'5.00',p_active:true}));productId=product.id;
 await value(admin.rpc('set_product_minimum',{p_id:productId,p_minimum:2}));
 assert.equal((await value(admin.rpc('search_low_stock',{p_search:prefix}))).total,1);
 const balance=(await value(owner.rpc('search_inventory',{p_search:prefix}))).rows[0];
 await value(admin.rpc('record_inventory_movement',{p_input:{product_id:productId,kind:'INITIAL',delta:3,reason:'Fixture',expected_version:balance.version,request_id:randomUUID()}}));
 assert.equal((await value(admin.rpc('search_low_stock',{p_search:prefix}))).total,0);
 const draft=await value(admin.rpc('create_sale_draft',{p_input:{request_id:randomUUID(),client_id:clientId,products:[{product_id:productId,quantity:2}]}}));saleId=draft.id;
 const confirmed=await value(admin.rpc('confirm_sale',{p_id:saleId,p_expected_version:1}));assert.equal(confirmed.status,'CONFIRMED');
 assert.equal((await value(admin.rpc('search_low_stock',{p_search:prefix}))).total,1);
 const input={sale_id:saleId,amount:'4.25',method:'CASH',operation_code:null,external_ref:null,request_id:randomUUID()};
 const payment=await value(admin.rpc('register_sale_payment',{p_input:input}));assert.equal(payment.status,'PENDING');
 assert.equal((await value(admin.rpc('register_sale_payment',{p_input:input}))).id,payment.id);
 await fail(admin.rpc('verify_sale_payment',{p_id:payment.id,p_expected_version:1}),'42501');
 await fail(owner.rpc('verify_sale_payment',{p_id:payment.id,p_expected_version:1}),'22023');
 await fail(staff.rpc('search_sale_payments',{p_sale_id:saleId}),'42501');
 await fail(client.rpc('cash_overview',{}),'42501');
 cashId=(await value(admin.rpc('open_cash',{p_opening:'10.00',p_request_id:randomUUID()}))).id;
 assert.equal((await value(owner.rpc('verify_sale_payment',{p_id:payment.id,p_expected_version:1}))).status,'PAID');
 const summary=await value(owner.rpc('sale_payment_summary',{p_sale_id:saleId}));assert.equal(summary.product_outstanding,'5.75');
 assert.equal((await value(owner.rpc('cash_overview',{}))).totals.CASH,'4.25');
 await fail(owner.rpc('verify_sale_payment',{p_id:payment.id,p_expected_version:1}),'40001');
 const p2=await value(admin.rpc('register_sale_payment',{p_input:{sale_id:saleId,amount:'5.75',method:'YAPE',request_id:randomUUID()}}));
 const p3=await value(admin.rpc('register_sale_payment',{p_input:{sale_id:saleId,amount:'5.75',method:'PLIN',request_id:randomUUID()}}));
 const race=await Promise.all([p2,p3].map(p=>owner.rpc('verify_sale_payment',{p_id:p.id,p_expected_version:1})));
 assert.equal(race.filter(r=>!r.error).length,1);assert.equal(race.filter(r=>r.error).length,1);checks++;
 assert.equal((await value(owner.rpc('sale_payment_summary',{p_sale_id:saleId}))).product_outstanding,'0.00');
 await value(owner.rpc('record_cash_movement',{p_input:{session_id:cashId,source:'MANUAL_OUT',amount:'3.00',reason:'Cambio',request_id:randomUUID()}}));
 assert.equal((await value(admin.rpc('close_cash',{p_id:cashId,p_expected_version:1,p_counted:'11.00'}))).difference,'-0.25');
 assert.equal((await value(owner.rpc('cancel_sale',{p_id:saleId,p_expected_version:2,p_reason:'Fixture',p_disposition:'RESTOCK'}))).requires_resolution,true);
 assert.equal((await value(admin.rpc('search_low_stock',{p_search:prefix}))).total,0);
 console.log(`API comercial local: ${checks} operaciones comprobadas.`);
}finally{
 if(cashId)sql(`delete from public.cash_movements where session_id='${cashId}';delete from public.cash_sessions where id='${cashId}'`);
 if(saleId)sql(`delete from public.sale_payments where sale_id='${saleId}';delete from public.inventory_movements where sale_id='${saleId}';delete from public.sale_items where sale_id='${saleId}';delete from public.sales where id='${saleId}'`);
 if(productId)sql(`delete from public.inventory_movements where product_id='${productId}';delete from public.products where id='${productId}'`);
 if(clientCreated)sql(`delete from public.clients where id='${clientId}'`);
 for(const id of users){sql(`delete from public.user_roles where user_id='${id}'`);const r=await root.auth.admin.deleteUser(id);assert.ifError(r.error);}
}
