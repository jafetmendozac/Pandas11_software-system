// Prueba local con cuentas/imagen sintéticas. No usa un proyecto remoto.
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';

const env=JSON.parse(execFileSync('supabase',['status','--output','json'],{
  encoding:'utf8',stdio:['ignore','pipe','pipe'],
}));
assert.equal(env.API_URL,'http://127.0.0.1:55321');
assert.equal(env.DB_URL,'postgresql://postgres:postgres@127.0.0.1:55322/postgres');
const sql=q=>execFileSync('psql',[env.DB_URL,'-v','ON_ERROR_STOP=1','-Atc',q],{
  encoding:'utf8',stdio:['ignore','pipe','pipe'],
}).trim();
const options={auth:{persistSession:false,autoRefreshToken:false}};
const root=createClient(env.API_URL,env.SERVICE_ROLE_KEY,options);
const anon=createClient(env.API_URL,env.ANON_KEY,options);
const actors={};const users=[];
const dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const day=dayNames.indexOf(new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',weekday:'short'}).format(new Date()));
const weekday=day===0?7:day;
const path=`${weekday}/${randomUUID()}.png`;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lN8AAAAASUVORK5CYII=','base64');
const value=async request=>{const result=await request;assert.ifError(result.error);return result.data;};
const denied=async request=>{const result=await request;assert.ok(result.error,'La operación debía denegarse');};
let ownsRow=false,uploaded=false,checks=0;
try{
 const initial=await value(root.from('home_flyers').select('*').eq('weekday',weekday).single());
 assert.equal(initial.object_path,null,'La prueba requiere el día local vacío');
 ownsRow=true;
 for(const role of ['OWNER','ADMIN','STAFF','CLIENT']){
   const email=`home-flyers-${randomUUID()}@example.test`,password=randomUUID()+'Aa1!';
   const user=await value(root.auth.admin.createUser({email,password,email_confirm:true}));
   users.push(user.user.id);
   if(role!=='CLIENT')sql(`insert into public.user_roles select '${user.user.id}',id from public.roles where code='${role}'`);
   const client=createClient(env.API_URL,env.ANON_KEY,options);
   await value(client.auth.signInWithPassword({email,password}));actors[role]=client;
 }
 assert.equal((await value(anon.from('home_flyers').select('weekday'))).length,0);checks++;
 await denied(actors.STAFF.storage.from('home-flyers').upload(`${weekday}/${randomUUID()}.png`,png,{contentType:'image/png'}));checks++;
 await value(actors.ADMIN.storage.from('home-flyers').upload(path,png,{contentType:'image/png'}));uploaded=true;checks++;
 await denied(anon.storage.from('home-flyers').createSignedUrl(path,300));checks++;
 await denied(actors.ADMIN.from('home_flyers').update({published:true}).eq('weekday',weekday));checks++;
 await denied(actors.STAFF.rpc('save_home_flyer',{p_weekday:weekday,p_object_path:path,p_alt_text:'Imagen de prueba local',p_published:true,p_expected_version:1}));checks++;
 const first=await value(actors.OWNER.rpc('save_home_flyer',{
   p_weekday:weekday,p_object_path:path,p_alt_text:'Imagen de prueba local',p_published:true,p_expected_version:1,
 }));assert.equal(first.version,2);checks++;
 const publicRows=await value(anon.from('home_flyers').select('weekday,object_path,alt_text,published'));
 assert.equal(publicRows.length,1);assert.equal(publicRows[0].object_path,path);checks++;
 const signed=await value(anon.storage.from('home-flyers').createSignedUrl(path,300));
 const response=await fetch(signed.signedUrl);assert.equal(response.status,200);checks++;
 await denied(actors.OWNER.rpc('save_home_flyer',{
   p_weekday:weekday,p_object_path:path,p_alt_text:'Imagen modificada',p_published:true,p_expected_version:1,
 }));checks++;
 const second=await value(actors.ADMIN.rpc('save_home_flyer',{
   p_weekday:weekday,p_object_path:path,p_alt_text:'Imagen modificada',p_published:false,p_expected_version:2,
 }));assert.equal(second.version,3);checks++;
 assert.equal((await value(anon.from('home_flyers').select('weekday'))).length,0);checks++;
 await denied(anon.storage.from('home-flyers').createSignedUrl(path,300));checks++;
 await actors.ADMIN.storage.from('home-flyers').remove([path]);
 assert.ok(await value(root.storage.from('home-flyers').info(path)));checks++;
 console.log(`Panfletos API local: ${checks} comprobaciones correctas.`);
} finally {
 if(ownsRow)sql(`update public.home_flyers set object_path=null,alt_text=null,published=false,version=1,updated_at=null,updated_by=null where weekday=${weekday}`);
 if(uploaded){const result=await root.storage.from('home-flyers').remove([path]);assert.ifError(result.error);}
 for(const id of users){
  sql(`delete from public.user_roles where user_id='${id}'`);
  const result=await root.auth.admin.deleteUser(id);assert.ifError(result.error);
 }
}
