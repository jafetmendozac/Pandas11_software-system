// Ejecutar solo contra identity-dev. Claves leídas en memoria; nunca se imprimen.
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const env = JSON.parse(execFileSync('supabase', ['status', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }));
assert.equal(env.API_URL, 'http://127.0.0.1:55321');
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(env.API_URL, env.SERVICE_ROLE_KEY, opts);
const client = () => createClient(env.API_URL, env.ANON_KEY, opts);
const users = [];
const temporaryRoles = [];
const password = randomUUID() + 'aA1!';
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
try {
  const clients = {};
  for (const role of ['OWNER','ADMIN','STAFF','CLIENT']) {
    const email = `test-${role.toLowerCase()}-${randomUUID()}@example.test`;
    const { data, error } = await admin.auth.admin.generateLink({ type: 'signup', email, password, options: { data: { role: 'OWNER' } } });
    assert.ifError(error);
    users.push(data.user.id);
    const api = client();
    const denied = await api.auth.signInWithPassword({ email, password });
    check(!!denied.error, 'Correo sin confirmar no accede');
    const verified = await api.auth.verifyOtp({ token_hash: data.properties.hashed_token, type: 'signup' });
    assert.ifError(verified.error);
    check(!!verified.data.session?.user.email_confirmed_at, 'Confirmación crea sesión');
    if (role !== 'CLIENT') {
      // UUID y role son generados o enumerados por este script, nunca entrada externa.
      execFileSync('psql', ['postgresql://postgres:postgres@127.0.0.1:55322/postgres', '-v', 'ON_ERROR_STOP=1', '-c',
        `insert into public.user_roles select '${data.user.id}'::uuid,id from public.roles where code='${role}'`], { stdio: 'pipe' });
    }
    clients[role] = { api, id: data.user.id };
  }
  const anon = await client().from('profiles').select('*');
  check(!!anon.error, 'Anon denegado');
  const c = clients.CLIENT;
  const own = await c.api.from('profiles').select('*');
  check(!own.error && own.data.length === 1 && own.data[0].id === c.id, 'Cliente solo perfil propio');
  const ownPerms = await c.api.rpc('my_permissions');
  check(!ownPerms.error && ownPerms.data.length === 0, 'Metadata no eleva privilegios');
  const edit = await c.api.from('profiles').update({ first_name: 'Prueba' }).eq('id',c.id).select('id');
  check(!edit.error && edit.data.length === 1, 'Editar nombres propios');
  check(!!(await c.api.from('profiles').update({ active: false }).eq('id',c.id)).error, 'Active protegido');
  const outsider = await c.api.from('profiles').update({first_name:'Ataque'}).eq('id',clients.OWNER.id).select('id');
  check(!outsider.error && outsider.data.length === 0, 'No cambia perfil ajeno');
  for (const role of ['ADMIN','STAFF']) {
    const permissions = await clients[role].api.rpc('my_permissions');
    check(!permissions.error && permissions.data.includes('panel.access') && !permissions.data.includes('roles.manage'), 'Personal sin gestión de seguridad');
  }
  const roles = await clients.OWNER.api.from('roles').select('*');
  assert.ifError(roles.error);
  const ownerRole = roles.data.find(r=>r.code==='OWNER');
  const grant = await c.api.from('user_roles').insert({user_id:c.id,role_id:ownerRole.id});
  check(!!grant.error, 'Autoasignación denegada por API');
  const removals = await Promise.all([1,2].map(()=>clients.OWNER.api.from('user_roles').delete().eq('user_id',clients.OWNER.id).eq('role_id',ownerRole.id)));
  check(removals.every(r=>r.error), 'Retirada concurrente owner denegada');
  const disabledOwner = await clients.OWNER.api.rpc('set_profile_active',{p_user_id:clients.OWNER.id,p_active:false});
  check(!!disabledOwner.error, 'Owner activo protegido');
  const temporary = await clients.OWNER.api.from('roles').insert({code:`TEST_${randomUUID()}`,name:`Prueba ${randomUUID()}`}).select('id').single();
  assert.ifError(temporary.error);
  temporaryRoles.push(temporary.data.id);
  const panel = await clients.OWNER.api.from('permissions').select('id').eq('code','panel.access').single();
  assert.ifError(panel.error);
  assert.ifError((await clients.OWNER.api.from('role_permissions').insert({role_id:temporary.data.id,permission_id:panel.data.id})).error);
  assert.ifError((await clients.OWNER.api.from('user_roles').insert({user_id:c.id,role_id:temporary.data.id})).error);
  check((await c.api.rpc('my_permissions')).data.includes('panel.access'),'Rol asignado concede permiso');
  assert.ifError((await clients.OWNER.api.from('roles').update({active:false}).eq('id',temporary.data.id)).error);
  check(!(await c.api.rpc('my_permissions')).data.includes('panel.access'),'Rol inactivo revoca permiso');
  check(!!(await clients.ADMIN.api.from('roles').insert({code:'ESCALATE',name:'Ataque'})).error,'Admin no administra seguridad');
  const adminProfiles = await clients.ADMIN.api.from('profiles').select('id').in('id',users);
  check(!adminProfiles.error && adminProfiles.data.length===4,'Admin lee perfiles para selectores');
  check(!!(await c.api.from('profiles').update({id:clients.OWNER.id}).eq('id',c.id)).error,'ID protegido');

  const disable = await clients.OWNER.api.rpc('set_profile_active',{p_user_id:clients.STAFF.id,p_active:false});
  assert.ifError(disable.error);
  const revoked = await clients.STAFF.api.rpc('my_permissions');
  check(!revoked.error && revoked.data.length===0, 'Sesión previa pierde permisos al desactivar');
  await c.api.auth.signOut();
  check(!!(await c.api.from('profiles').select('*')).error, 'Salida elimina acceso');
  console.log(`API identidad: ${checks} comprobaciones correctas.`);
} finally {
  for (const id of temporaryRoles) {
    execFileSync('psql', ['postgresql://postgres:postgres@127.0.0.1:55322/postgres','-v','ON_ERROR_STOP=1','-c',`delete from public.roles where id='${id}'::uuid`], {stdio:'pipe'});
  }
  // Limpieza privilegiada exclusivamente de UUIDs sintéticos creados en esta ejecución.
  for (const id of users) {
    execFileSync('psql', ['postgresql://postgres:postgres@127.0.0.1:55322/postgres','-v','ON_ERROR_STOP=1','-c',`delete from auth.users where id='${id}'::uuid`],{stdio:'pipe'});
  }
}
