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
  ok((await value(owner.from('pet_dewormings').select('id').in('id', [id(251), id(252)]))).length === 2, 'Dos antecedentes de desparasitación');
  const serviceNames = ['Baño estético','Baño y corte','Corte estético','Baño medicado para parásitos externos',
    'Baño medicado para piel delicada','Corte higiénico','Cepillado','Corte de uñas','Desparasitación'];
  const newServiceIds = [305,310,313,314,315,316,317,318,319].map(id);
  const demoServices = await value(root.from('services').select('id,name,active,requires_specialist').in('id', newServiceIds));
  ok(demoServices.length === 9 && serviceNames.every(name => demoServices.some(row => row.name === name && row.active)),
    'Catálogo contiene los nueve servicios aprobados');
  ok((await value(client.from('services').select('id').in('id', newServiceIds))).length === 9,
    'CLIENT ve los nueve servicios aprobados');
  ok((await value(root.from('services').select('id').in('id', [301,302,303,304,306,307,308,309,311,312].map(id)))).length === 0,
    'Servicios antiguos eliminados');
  const bathQuote = await value(owner.rpc('quote_service', {p_service_id: id(305), p_size: 'TOY'}));
  ok(bathQuote.source === 'SIZE' && Number(bathQuote.price) === 25 && bathQuote.duration_minutes === 45,
    'Baño estético Toy usa importe y duración aprobados');
  ok(demoServices.filter(row => [id(313),id(314),id(316)].includes(row.id)).every(row => row.requires_specialist),
    'Los cortes requieren especialista');
  const appointments = await value(root.from('appointments').select('*').in('client_id', [id(101), id(102)]).like('client_notes', '[pandas11-phases-0-4-v1:%'));
  ok(appointments.length === 3, 'Tres citas demo sin duplicados');
  const split = appointments.find(a => a.client_notes.includes(':relevo-dos-mascotas]'));
  const late = appointments.find(a => a.client_notes.includes(':fin-despues-18]'));
  const cancelled = appointments.find(a => a.client_notes.includes(':cancelada]'));
  ok(cancelled?.status === 'CANCELLED' && !!cancelled.cancel_reason, 'Cancelada conserva motivo');
  ok(appointments.every(a => a.source === 'INTERNAL' && Number(a.deposit_required) === 0), 'Citas internas sin adelanto obligatorio');
  const detail = await value(actors.STAFF.rpc('get_appointment', {p_id: split.id}));
  ok([1,2].includes(detail.items.length) && detail.items.flatMap(i => i.stages).length >= 2, 'STAFF consulta cita y etapas históricas');
  ok([50,115].includes(Number(detail.total_price)) && !detail.needs_attention, 'Cita demo conserva total y cobertura');
  ok(!JSON.stringify(detail).includes('Confirmar detalles del servicio con recepción antes del ingreso.')
    && !JSON.stringify(detail).includes('DEMO INTERNO'), 'Notas internas separadas de ficha ordinaria');
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
  ok([90,120].includes((new Date(late.ends_at).getTime() - new Date(late.starts_at).getTime()) / 60_000), 'Cita tardía conserva duración válida');
  console.log(`${checks} comprobaciones del seed local: correctas. No se modificaron fixtures.`);
} catch (error) {
  console.error(`Verificación del seed: ${error.message}`);
  process.exitCode = 1;
}
