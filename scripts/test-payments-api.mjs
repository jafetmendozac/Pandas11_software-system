// Solo instancia local y fixtures sintéticos propios; sin reset ni claves en salida.
import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
const env = JSON.parse(execFileSync('supabase', ['status', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
assert.equal(env.API_URL, 'http://127.0.0.1:55321');
const db = 'postgresql://postgres:postgres@127.0.0.1:55322/postgres';
const sql = text => execFileSync('psql', [db, '-v', 'ON_ERROR_STOP=1', '-Atc', text], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const root = createClient(env.API_URL, env.SERVICE_ROLE_KEY, opts);
const actors = {}, users = [], appointments = [], clientId = randomUUID(), prefix = 'Payments-' + randomUUID();
const ids = values => values.length ? values.map(v => `'${v}'`).join(',') : 'null';
let checks = 0;
const ok = (condition, label) => { assert.ok(condition, label); checks++; };
const value = async request => { const r = await request; assert.ifError(r.error); return r.data; };
const fail = async (request, label) => { const r = await request; ok(!!r.error, label); return r.error; };
let clientCreated = false;
try {
  for (const role of ['OWNER', 'ADMIN', 'STAFF', 'CLIENT']) {
    const email = `payments-${randomUUID()}@example.test`, password = randomUUID() + 'Aa1!';
    const d = await value(root.auth.admin.createUser({ email, password, email_confirm: true })); users.push(d.user.id);
    if (role !== 'CLIENT') sql(`insert into public.user_roles select '${d.user.id}',id from public.roles where code='${role}'`);
    const api = createClient(env.API_URL, env.ANON_KEY, opts); await value(api.auth.signInWithPassword({ email, password })); actors[role] = { api, id: d.user.id };
  }
  const owner = actors.OWNER.api, admin = actors.ADMIN.api, staff = actors.STAFF.api, client = actors.CLIENT.api;
  const anon = createClient(env.API_URL, env.ANON_KEY, opts);
  sql(`insert into public.clients(id,first_name) values('${clientId}','${prefix}')`); clientCreated = true;
  const appointment = (status = 'COMPLETED', total = '100.35', source = 'INTERNAL') => {
    const id = randomUUID(); appointments.push(id);
    sql(`insert into public.appointments(id,client_id,starts_at,ends_at,status,total_price,source,created_by${status === 'CANCELLED' ? ',cancelled_at,cancelled_by,cancel_reason' : ''}) values('${id}','${clientId}','2020-01-06 12:00+00','2020-01-06 13:00+00','${status}',${total},'${source}','${actors.OWNER.id}'${status === 'CANCELLED' ? `,now(),'${actors.OWNER.id}','Fixture'` : ''})`);
    return id;
  };
  const appt = appointment();
  const input = (overrides = {}) => ({ appointment_id: appt, type: 'BALANCE', method: 'YAPE', amount: '20.10', operation_code: '  OP-fixture  ', external_ref: '  referencia  ', request_id: randomUUID(), ...overrides });
  const register = (p = {}, api = admin) => value(api.rpc('register_payment', { p_input: input(p) }));
  const summary = id => value(owner.rpc('appointment_payment_summary', { p_appointment_id: id }));
  const initial = await summary(appt); ok(initial.confirmed === '0' && initial.outstanding === '100.35', 'Saldo inicial exacto');
  const req = input(); let payment = await value(admin.rpc('register_payment', { p_input: req }));
  ok(payment.status === 'PENDING' && payment.created_by === actors.ADMIN.id && payment.verified_by === null && payment.paid_at === null, 'Actor y estado PENDING del servidor');
  ok(payment.operation_code === 'OP-fixture' && payment.external_ref === 'referencia', 'Referencias normalizadas');
  let s = await summary(appt); ok(s.confirmed === '0' && s.pending === '20.10' && s.outstanding === '100.35', 'PENDING no reduce deuda');
  const retry = await value(admin.rpc('register_payment', { p_input: req })); ok(retry.id === payment.id, 'Reintento idempotente');
  await fail(admin.rpc('register_payment', { p_input: { ...req, amount: '20.11' } }), 'Misma clave con otro contenido falla');
  await fail(owner.rpc('register_payment', { p_input: req }), 'Otra identidad no usa clave ajena');
  await fail(admin.rpc('verify_payment', { p_id: payment.id, p_expected_version: 1 }), 'ADMIN no verifica Yape');
  await fail(admin.rpc('reject_payment', { p_id: payment.id, p_expected_version: 1, p_reason: 'No recibido' }), 'ADMIN no rechaza');
  payment = await value(owner.rpc('verify_payment', { p_id: payment.id, p_expected_version: 1 }));
  ok(payment.status === 'PAID' && payment.verified_by === actors.OWNER.id && !!payment.paid_at && payment.version === 2, 'OWNER verifica con trazabilidad');
  s = await summary(appt); ok(s.confirmed === '20.10' && s.pending === '0' && s.outstanding === '80.25', 'PAID reduce saldo exacto');
  await fail(owner.rpc('verify_payment', { p_id: payment.id, p_expected_version: 1 }), 'Versión vieja rechazada');
  await fail(owner.rpc('verify_payment', { p_id: payment.id, p_expected_version: 2 }), 'No verifica PAID dos veces');
  await fail(owner.rpc('reject_payment', { p_id: payment.id, p_expected_version: 2, p_reason: 'Error' }), 'No revierte PAID');
  let last = payment;
  for (const method of ['PLIN', 'CASH', 'CARD', 'TRANSFER']) {
    const p = await register({ method, amount: '10' });
    if (method === 'CASH') await fail(admin.rpc('verify_payment', { p_id: p.id, p_expected_version: 1 }), 'ADMIN tampoco verifica efectivo');
    last = await value(owner.rpc('verify_payment', { p_id: p.id, p_expected_version: 1 }));
    ok(last.method === method && last.status === 'PAID', `${method} manual verificado por OWNER`);
  }
  s = await summary(appt); ok(s.confirmed === '60.10' && s.outstanding === '40.25', 'Métodos combinados exactos');
  const rejected = await register({ amount: '0.25' });
  await fail(owner.rpc('reject_payment', { p_id: rejected.id, p_expected_version: 1, p_reason: '   ' }), 'Rechazo exige motivo');
  await fail(owner.rpc('reject_payment', { p_id: rejected.id, p_expected_version: 1, p_reason: 'x'.repeat(501) }), 'Límite del motivo');
  const rejectedResult = await value(owner.rpc('reject_payment', { p_id: rejected.id, p_expected_version: 1, p_reason: '  No recibido  ' }));
  ok(rejectedResult.status === 'FAILED' && rejectedResult.rejection_reason === 'No recibido' && rejectedResult.paid_at === null, 'FAILED conserva motivo sin recepción');
  ok((await summary(appt)).outstanding === '40.25', 'FAILED no reduce saldo');
  await fail(owner.rpc('verify_payment', { p_id: rejected.id, p_expected_version: 2 }), 'No verificar FAILED');
  for (const api of [staff, client, anon]) {
    await fail(api.rpc('search_payments', {}), 'Sin permiso no lista');
    await fail(api.rpc('get_payment', { p_id: payment.id }), 'Sin permiso no consulta ficha');
    await fail(api.rpc('appointment_payment_summary', { p_appointment_id: appt }), 'Sin permiso no consulta saldos');
    await fail(api.rpc('search_payment_appointments', {}), 'Sin permiso no obtiene selector');
    await fail(api.rpc('register_payment', { p_input: input() }), 'Sin permiso no registra');
    await fail(api.rpc('verify_payment', { p_id: last.id, p_expected_version: 2 }), 'Sin permiso no verifica');
    await fail(api.rpc('reject_payment', { p_id: last.id, p_expected_version: 2, p_reason: 'No' }), 'Sin permiso no rechaza');
  }
  ok((await value(staff.from('payments').select('id').eq('appointment_id', appt))).length === 0, 'RLS oculta pagos a STAFF');
  ok((await value(client.from('payments').select('id').eq('appointment_id', appt))).length === 0, 'RLS oculta pagos a CLIENT');
  await fail(anon.from('payments').select('id'), 'Anon sin SELECT');
  const apptData = await value(staff.rpc('get_appointment', { p_id: appt }));
  ok(!('payments' in apptData) && !('operation_code' in apptData), 'Agenda no filtra información financiera');
  for (const api of [owner, admin]) {
    await fail(api.from('payments').insert({ appointment_id: appt, type: 'BALANCE', method: 'CASH', amount: 1, created_by: actors.OWNER.id, request_id: randomUUID() }), 'INSERT directo revocado');
    await fail(api.from('payments').update({ status: 'PAID' }).eq('id', rejected.id), 'UPDATE directo revocado');
    await fail(api.from('payments').delete().eq('id', rejected.id), 'DELETE directo revocado');
  }
  for (const amount of ['', null, '0', '-1', 'NaN', 'Infinity', '1.234', '1e2']) await fail(owner.rpc('register_payment', { p_input: input({ amount }) }), 'Importe inválido');
  for (const patch of [{ method: null }, { method: 'OTHER' }, { type: 'DEPOSIT' }, { type: 'REFUND' }, { type: null }, { request_id: null }, { appointment_id: randomUUID() }, { amount: '40.26' }, { operation_code: 'x'.repeat(121) }, { external_ref: 'x'.repeat(121) }, { proof_url: 'https://example.test/proof' }, { status: 'PAID' }, { verified_by: actors.OWNER.id }, { paid_at: '2020-01-01' }, { created_by: actors.OWNER.id }]) await fail(owner.rpc('register_payment', { p_input: input(patch) }), 'Payload inválido o manipulado');
  for (const status of ['CONFIRMED', 'IN_PROGRESS', 'CANCELLED', 'NO_SHOW', 'PENDING', 'REQUESTED']) {
    await fail(admin.rpc('register_payment', { p_input: input({ appointment_id: appointment(status) }) }), 'Cobro solo tras COMPLETED');
  }
  await fail(admin.rpc('register_payment', { p_input: input({ appointment_id: appointment('COMPLETED', '0') }) }), 'Cita gratuita sin pago ficticio');
  await fail(admin.rpc('register_payment', { p_input: input({ appointment_id: appointment('COMPLETED', '100', 'ONLINE') }) }), 'No habilitar ONLINE incompleto');
  const concurrent = await Promise.all([register({ amount: '30' }), register({ amount: '30' })]);
  const decisions = await Promise.all(concurrent.map(p => owner.rpc('verify_payment', { p_id: p.id, p_expected_version: 1 })));
  ok(decisions.filter(r => !r.error).length === 1 && decisions.filter(r => r.error).length === 1, 'Concurrencia real: solo un cobro cabe en el saldo');
  ok((await summary(appt)).outstanding === '10.25', 'Concurrencia no produce sobrecobro');
  const paidConcurrent = decisions.find(r => !r.error).data;
  const remaining = concurrent.find(p => p.id !== paidConcurrent.id);
  await value(owner.rpc('reject_payment', { p_id: remaining.id, p_expected_version: 1, p_reason: 'Supera saldo tras otra verificación' }));
  const doubleReq = input({ amount: '1' });
  const double = await Promise.all([admin.rpc('register_payment', { p_input: doubleReq }), admin.rpc('register_payment', { p_input: doubleReq })]);
  ok(double.every(r => !r.error) && double[0].data.id === double[1].data.id, 'Registro concurrente idempotente');
  const small = double[0].data;
  const mixed = await Promise.all([owner.rpc('verify_payment', { p_id: small.id, p_expected_version: 1 }), owner.rpc('reject_payment', { p_id: small.id, p_expected_version: 1, p_reason: 'Revisión concurrente' })]);
  ok(mixed.filter(r => !r.error).length === 1, 'Verificación/rechazo concurrente no sobrescribe decisión');
  const confirmed = Number((await summary(appt)).confirmed);
  let reduced = false; try { sql(`update public.appointments set total_price=1 where id='${appt}'`); } catch { reduced = true; }
  ok(reduced && Number((await summary(appt)).total) === 100.35, 'Trigger impide rebajar total bajo lo cobrado y revierte');
  // Carrera con cambio de total, usando la misma coordinación que las RPC de agenda.
  const raceAppt = appointment('COMPLETED', '100');
  const racePay = await register({ appointment_id: raceAppt, amount: '80' });
  const child = spawn('psql', [db, '-v', 'ON_ERROR_STOP=1', '-c', `begin;select pg_advisory_xact_lock(930003);update public.appointments set total_price=50 where id='${raceAppt}';select pg_sleep(0.8);commit;`], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PGAPPNAME: prefix } });
  const ended = new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error('Falló sesión de concurrencia'))); });
  let locked = false;
  for (let n = 0; n < 40 && !locked; n++) { await new Promise(r => setTimeout(r, 10)); locked = Number(sql(`select count(*) from pg_locks l join pg_stat_activity a on a.pid=l.pid where a.application_name='${prefix}' and l.locktype='advisory' and l.objid=930003 and l.granted`)) > 0; }
  assert.ok(locked, 'Mutex de sesión de ensayo');
  await fail(owner.rpc('verify_payment', { p_id: racePay.id, p_expected_version: 1 }), 'Verificador revalida total después de esperar mutex'); await ended;
  ok((await summary(raceAppt)).confirmed === '0', 'Cambio concurrente no deja cobro parcial');
  const paidBeforeCancel = appointment('COMPLETED', '25'); const cp = await register({ appointment_id: paidBeforeCancel, amount: '25' });
  await value(owner.rpc('verify_payment', { p_id: cp.id, p_expected_version: 1 }));
  await fail(owner.rpc('change_appointment_status', { p_id: paidBeforeCancel, p_expected_version: 1, p_target: 'CANCELLED', p_reason: 'No permitida' }), 'COMPLETED no se cancela por flujo actual');
  // Simular datos históricos/importados: no ampliar las transiciones operativas aprobadas.
  sql(`update public.appointments set status='CANCELLED',cancelled_at=now(),cancelled_by='${actors.OWNER.id}',cancel_reason='Fixture histórico' where id='${paidBeforeCancel}'`);
  const cancelledSummary = await summary(paidBeforeCancel); ok(cancelledSummary.requires_resolution && cancelledSummary.confirmed === '25', 'Cancelada histórica conserva importe y alerta de resolución');
  const cancelledPending = appointment('COMPLETED', '10'); const pp = await register({ appointment_id: cancelledPending, amount: '10' });
  sql(`update public.appointments set status='NO_SHOW' where id='${cancelledPending}'`);
  await fail(owner.rpc('verify_payment', { p_id: pp.id, p_expected_version: 1 }), 'No confirmar pendiente si cita dejó de admitir cobros');
  await value(owner.rpc('reject_payment', { p_id: pp.id, p_expected_version: 1, p_reason: 'Cita no admite cobros' }));
  await value(owner.rpc('set_profile_active', { p_user_id: actors.ADMIN.id, p_active: false }));
  await fail(admin.rpc('search_payments', {}), 'Perfil inactivo sin acceso');
  await value(owner.rpc('set_profile_active', { p_user_id: actors.ADMIN.id, p_active: true }));
  // Aun con permiso delegado por un rol personalizado, solo OWNER puede verificar.
  const customId = randomUUID();
  sql(`insert into public.roles(id,code,name) values('${customId}','${prefix}','Fixture');insert into public.role_permissions select '${customId}',id from public.permissions where code='payments.verify';insert into public.user_roles values('${actors.ADMIN.id}','${customId}')`);
  try { await fail(admin.rpc('verify_payment', { p_id: pp.id, p_expected_version: 2 }), 'Permiso personalizado no elude OWNER exclusivo'); }
  finally { sql(`delete from public.user_roles where role_id='${customId}';delete from public.role_permissions where role_id='${customId}';delete from public.roles where id='${customId}'`); }
  sql(`insert into public.payments(appointment_id,type,method,amount,created_by,request_id) select '${raceAppt}','BALANCE','CASH',1,'${actors.OWNER.id}',gen_random_uuid() from generate_series(1,1002)`);
  const first = await value(owner.rpc('search_payments', { p_appointment_id: raceAppt, p_page: 1, p_size: 100 }));
  const final = await value(owner.rpc('search_payments', { p_appointment_id: raceAppt, p_page: 11, p_size: 100 }));
  ok(first.total === 1003 && first.rows.length === 100 && final.rows.length === 3, 'Paginación >1000 sin truncado');
  ok((await summary(raceAppt)).pending === '1082', 'Resumen incluye pendientes de todas las páginas');
  ok((await value(owner.rpc('get_payment', { p_id: racePay.id }))).id === racePay.id, 'Detalle individual sin depender de la página');
  const filtered = await value(owner.rpc('search_payments', { p_search: prefix, p_status: 'PAID', p_method: 'CARD' })); ok(filtered.total === 1 && filtered.rows[0].method === 'CARD', 'Filtros cliente/estado/método');
  const emptyDates = await value(owner.rpc('search_payments', { p_search: prefix, p_from: '2000-01-01', p_until: '2000-01-02' })); ok(emptyDates.total === 0, 'Filtro fecha Lima');
  await fail(owner.rpc('search_payments', { p_from: '2026-10-20', p_until: '2026-10-19' }), 'Rango invertido rechazado');
  const candidates = await value(admin.rpc('search_payment_appointments', { p_search: prefix, p_size: 100 }));
  ok(candidates.rows.every(c => c.status === 'COMPLETED') && !candidates.rows.some(c => c.id === paidBeforeCancel), 'Selector solo citas internas completadas');
  ok(confirmed >= 90.10, 'Sumas conservadas');
  console.log(`Fase 5 API: ${checks} comprobaciones correctas.`);
} finally {
  if (clientCreated) sql(`delete from public.payments where appointment_id in(select id from public.appointments where client_id='${clientId}');delete from public.appointments where client_id='${clientId}';delete from public.clients where id='${clientId}'`);
  for (const id of users) await root.auth.admin.deleteUser(id);
}
