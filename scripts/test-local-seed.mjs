// Comprobaciones de lectura sobre el seed inicial. No crea ni elimina fixtures.
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';

const env = JSON.parse(execFileSync('supabase', ['status', '--output', 'json'], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
}));
assert.equal(env.API_URL, 'http://127.0.0.1:55321');
assert.equal(env.DB_URL, 'postgresql://postgres:postgres@127.0.0.1:55322/postgres');
const options = {auth: {persistSession: false, autoRefreshToken: false}};
const root = createClient(env.API_URL, env.SERVICE_ROLE_KEY, options);
const id = n => `d0400000-0000-4000-8000-${String(n).padStart(12, '0')}`;
let checks = 0;
const ok = (condition, message) => {assert.ok(condition, message); checks++;};
const value = async request => {
  const result = await request;
  assert.ifError(result.error);
  return result.data;
};

try {
  const actors = {};
  for (const role of ['OWNER', 'ADMIN', 'STAFF', 'CLIENT']) {
    const api = createClient(env.API_URL, env.ANON_KEY, options);
    const login = await value(api.auth.signInWithPassword({email: `demo.fases.${role.toLowerCase()}@example.test`, password: 'Pandas11-Demo-2026!'}));
    ok(!!login.user.email_confirmed_at, `${role}: cuenta confirmada y login`);
    const permissions = await value(api.rpc('my_permissions'));
    ok(permissions.includes('appointments.manage') === ['OWNER', 'ADMIN'].includes(role), `${role}: gestión de agenda`);
    ok(permissions.includes('appointments.read') === (role !== 'CLIENT'), `${role}: lectura de agenda`);
    ok(permissions.includes('roles.manage') === (role === 'OWNER'), `${role}: seguridad`);
    actors[role] = api;
  }
  const client = actors.CLIENT, owner = actors.OWNER;
  const visibleClients = await value(client.from('clients').select('id').in('id', [id(101), id(102), id(103)]));
  ok(visibleClients.length === 1 && visibleClients[0].id === id(101), 'CLIENT ve solo su ficha demo vinculada');
  ok((await value(client.from('pets').select('id').in('id', [id(201), id(202), id(203), id(204)]))).length === 2, 'CLIENT ve sus dos mascotas');
  for (const table of ['client_internal', 'pet_internal', 'appointment_internal']) {
    ok((await value(client.from(table).select('*'))).length === 0, `CLIENT sin notas de ${table}`);
  }
  ok((await value(owner.from('pet_vaccinations').select('id').in('id', [id(251), id(252)]))).length === 2, 'Dos antecedentes de vacunas');
  ok((await value(client.from('services').select('id').in('id', [id(301), id(302), id(303), id(304)]))).length === 2, 'Catálogo CLIENT filtra interno e inactivo');
  for (const [service, size, coat, source, price, minutes] of [
    [301, 'SMALL', 'LONG', 'SIZE_COAT', '55', 60],
    [301, 'TOY', 'LONG', 'SIZE', '25', 30],
    [301, 'MEDIUM', 'LONG', 'COAT', '50', 60],
    [301, 'LARGE', 'SHORT', 'GENERAL', '40', 60],
    [302, 'SMALL', 'LONG', 'BASE', '90', 120],
  ]) {
    const quote = await value(owner.rpc('quote_service', {p_service_id: id(service), p_size: size, p_coat: coat}));
    ok(quote.source === source && Number(quote.price) === Number(price) && quote.duration_minutes === minutes, `Cotización ${source}`);
  }
  const appointments = await value(root.from('appointments').select('*').in('client_id', [id(101), id(102)]).like('client_notes', '[pandas11-phases-0-4-v1:%'));
  ok(appointments.length === 3, 'Tres citas demo sin duplicados');
  const split = appointments.find(a => a.client_notes.includes(':relevo-dos-mascotas]'));
  const late = appointments.find(a => a.client_notes.includes(':fin-despues-18]'));
  const cancelled = appointments.find(a => a.client_notes.includes(':cancelada]'));
  ok(cancelled?.status === 'CANCELLED' && !!cancelled.cancel_reason, 'Cancelada conserva motivo');
  ok(appointments.every(a => a.source === 'INTERNAL' && Number(a.deposit_required) === 0), 'Citas internas sin adelanto obligatorio');
  const detail = await value(actors.STAFF.rpc('get_appointment', {p_id: split.id}));
  ok(detail.items.length === 2 && detail.items.flatMap(i => i.stages).length === 3, 'STAFF consulta dos mascotas y tres etapas');
  ok(Number(detail.total_price) === 115 && !detail.needs_attention, 'Total 90 + 25 con cobertura válida');
  ok(!JSON.stringify(detail).includes('DEMO INTERNO'), 'Notas internas separadas de ficha ordinaria');
  ok((await value(owner.from('appointment_internal').select('appointment_id').in('appointment_id', appointments.map(a => a.id)))).length === 3, 'Notas internas de las tres citas');
  ok((await value(client.from('appointments').select('id').in('id', appointments.map(a => a.id)))).length === 0, 'CLIENT sin agenda interna');
  const date = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date(split.starts_at));
  const availability = async (employee, start, end, extra = {}) => value(owner.rpc('appointment_availability', {
    p_employee_id: id(employee), p_date: date, p_start: start, p_end: end, ...extra,
  }));
  ok(!(await availability(501, '09:00', '10:00')).interval_covered, 'Corte ocupa al especialista');
  ok(!(await availability(502, '11:00', '12:00')).interval_covered, 'Recojo manual ocupa al asistente');
  ok((await availability(502, '14:00', '15:00')).interval_covered, 'Cancelación libera al asistente');
  ok(!(await availability(502, '15:00', '16:00', {p_requires_specialist: true})).interval_covered, 'Asistente no cubre corte');
  ok(new Date(late.ends_at).getTime() - new Date(late.starts_at).getTime() === 120 * 60_000
    && new Intl.DateTimeFormat('en-GB', {timeZone: 'America/Lima', hour: '2-digit', hour12: false}).format(new Date(late.ends_at)) === '19', 'Cita de dos horas termina a19 Lima');
  console.log(`${checks} comprobaciones del seed local: correctas. No se modificaron fixtures.`);
} catch (error) {
  console.error(`Verificación del seed: ${error.message}`);
  process.exitCode = 1;
}
