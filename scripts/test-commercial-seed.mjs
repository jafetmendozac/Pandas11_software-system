// Verificación por lectura del escenario persistente; no modifica datos.
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';

const env = JSON.parse(execFileSync('supabase', ['status', '--output', 'json'], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
}));
if (env.API_URL !== 'http://127.0.0.1:55321'
  || env.DB_URL !== 'postgresql://postgres:postgres@127.0.0.1:55322/postgres') {
  throw new Error('La prueba solo admite la instancia Supabase local 55321/55322.');
}
const options = {auth: {persistSession: false, autoRefreshToken: false}};
const root = createClient(env.API_URL, env.SERVICE_ROLE_KEY, options);
const id = n => `d0400000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const value = async request => {
  const response = await request;
  assert.ifError(response.error);
  return response.data;
};
const one = async request => {
  const rows = await value(request);
  assert.equal(rows.length, 1);
  return rows[0];
};
const amount = input => Number(input).toFixed(2);
let checks = 0;
const ok = (condition, message) => {assert.ok(condition, message); checks++;};

try {
  const actors = {};
  for (const role of ['OWNER', 'ADMIN', 'STAFF', 'CLIENT']) {
    const api = createClient(env.API_URL, env.ANON_KEY, options);
    await value(api.auth.signInWithPassword({
      email: `demo.fases.${role.toLowerCase()}@example.test`, password: 'Pandas11-Demo-2026!',
    }));
    actors[role] = api;
  }
  const owner = actors.OWNER;
  const people = await value(root.from('clients').select('id,first_name,last_name').in('id', [id(101), id(102)]));
  ok(people.some(p => p.id === id(101) && p.first_name === 'Lucía' && p.last_name === 'Herrera')
    && people.some(p => p.id === id(102) && p.first_name === 'Mateo' && p.last_name === 'Ríos'),
  'Fichas de clientes con nombres coherentes');
  const pets = await value(root.from('pets').select('id,name').in('id', [id(202), id(203)]));
  ok(pets.some(p => p.id === id(202) && p.name === 'Toby')
    && pets.some(p => p.id === id(203) && p.name === 'Rocky'), 'Mascotas con nombres coherentes');
  const appointment = await one(root.from('appointments').select('id,status,total_price,client_id')
    .like('client_notes', '[pandas11-commercial-v1:cita-lucia-toby]%'));
  ok(appointment.status === 'COMPLETED' && appointment.client_id === id(101)
    && amount(appointment.total_price) === '25.00', 'Cita interna completada');
  const appointmentBalance = await value(owner.rpc('appointment_payment_summary', {
    p_appointment_id: appointment.id,
  }));
  ok(amount(appointmentBalance.confirmed) === '25.00'
    && amount(appointmentBalance.outstanding) === '0.00', 'Saldo de servicio confirmado');

  const mixed = await one(root.from('sales').select('id,status,total,appointment_id').eq('request_id', id(831)));
  const counter = await one(root.from('sales').select('id,status,total,appointment_id').eq('request_id', id(832)));
  ok(mixed.status === 'CONFIRMED' && mixed.appointment_id === appointment.id
    && amount(mixed.total) === '43.50', 'Venta mixta confirmada');
  ok(counter.status === 'CONFIRMED' && counter.appointment_id === null
    && amount(counter.total) === '30.50', 'Venta de mostrador confirmada');
  const mixedBalance = await value(owner.rpc('sale_payment_summary', {p_sale_id: mixed.id}));
  const counterBalance = await value(owner.rpc('sale_payment_summary', {p_sale_id: counter.id}));
  ok(amount(mixedBalance.service_total) === '25.00'
    && amount(mixedBalance.product_total) === '18.50'
    && amount(mixedBalance.appointment_paid) === '25.00'
    && amount(mixedBalance.product_paid) === '18.50'
    && amount(mixedBalance.product_outstanding) === '0.00', 'Saldos mixtos separados');
  ok(amount(counterBalance.service_total) === '0.00'
    && amount(counterBalance.product_paid) === '30.50'
    && amount(counterBalance.product_outstanding) === '0.00', 'Cobro de mostrador');

  const products = await value(root.from('products').select('id,sku,name,minimum_stock')
    .in('sku', ['P11-SEED-CHAMPU-250', 'P11-SEED-PANUELO']));
  ok(products.length === 2 && products.every(p => !/demo|prueba/i.test(p.name)),
    'Nombres comerciales coherentes');
  const shampoo = products.find(p => p.sku === 'P11-SEED-CHAMPU-250');
  const scarf = products.find(p => p.sku === 'P11-SEED-PANUELO');
  const balances = await value(root.from('inventory_balances').select('product_id,quantity')
    .in('product_id', products.map(p => p.id)));
  ok(balances.find(b => b.product_id === shampoo.id)?.quantity === 2
    && shampoo.minimum_stock === 2, 'Champú en el umbral de mínimo');
  ok(balances.find(b => b.product_id === scarf.id)?.quantity === 4
    && scarf.minimum_stock === 1, 'Pañuelo con stock disponible');
  const movements = await value(root.from('inventory_movements').select('product_id,kind,delta,sale_id')
    .in('product_id', products.map(p => p.id)));
  ok(movements.filter(m => m.kind === 'INITIAL').length === 2
    && movements.filter(m => m.kind === 'SALE').length === 3, 'Dos cargas y tres salidas únicas');
  const alert = await value(owner.rpc('search_low_stock', {p_search: 'P11-SEED-CHAMPU-250'}));
  ok(alert.rows.length === 1 && alert.rows[0].id === shampoo.id, 'Alerta de mínimo visible');

  const sessionId = (await one(root.from('cash_sessions').select('id').eq('request_id', id(850)))).id;
  const session = await value(owner.rpc('cash_overview', {p_id: sessionId}));
  ok(session.status === 'CLOSED' && amount(session.opening_cash) === '20.00'
    && amount(session.expected_cash) === '41.50' && amount(session.counted_cash) === '41.00'
    && amount(session.difference) === '-0.50', 'Cierre de caja y diferencia');
  const cashMovements = await value(root.from('cash_movements').select('source,method,amount,session_id')
    .eq('session_id', sessionId));
  ok(cashMovements.length === 5
    && cashMovements.filter(m => m.source === 'APPOINTMENT_PAYMENT').length === 1
    && cashMovements.filter(m => m.source === 'SALE_PAYMENT').length === 2
    && cashMovements.filter(m => m.source.startsWith('MANUAL_')).length === 2,
  'Cinco movimientos de caja sin duplicados');
  for (const role of ['STAFF', 'CLIENT']) {
    const api = actors[role];
    const denied = await api.rpc('sale_payment_summary', {p_sale_id: mixed.id});
    ok(!!denied.error, `${role} sin acceso a saldo comercial`);
    ok((await value(api.from('cash_sessions').select('id').eq('id', sessionId))).length === 0,
      `${role} sin lectura de caja por RLS`);
  }
  console.log(`${checks} comprobaciones del seed comercial: correctas. No se modificaron datos.`);
} catch (error) {
  console.error(`Verificación del seed comercial: ${error.message}`);
  process.exitCode = 1;
}
