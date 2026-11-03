// Escenario comercial persistente y ficticio. Solo para Pandas11-identity-dev local.
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {Temporal} from 'temporal-polyfill';

const dbUrl = 'postgresql://postgres:postgres@127.0.0.1:55322/postgres';
const marker = 'pandas11-phases-0-4-v1';
const commercialMarker = '[pandas11-commercial-v1:cita-lucia-toby]';
const password = 'Pandas11-Demo-2026!';
const id = n => `d0400000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const literal = input => `'${String(input).replaceAll("'", "''")}'`;
const options = {auth: {persistSession: false, autoRefreshToken: false}};
const sql = query => execFileSync('psql', [dbUrl, '-X', '-At', '-v', 'ON_ERROR_STOP=1'], {
  input: query, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
}).trim();
const value = async request => {
  const response = await request;
  if (response.error) throw new Error(response.error.message);
  return response.data;
};
const row = async request => {
  const rows = await value(request);
  assert.ok(rows.length <= 1, 'Marcador duplicado: revisar antes de repetir el seed');
  return rows[0] ?? null;
};
const money = amount => Number(amount).toFixed(2);
const productDefinitions = [
  {sku: 'P11-SEED-CHAMPU-250', name: 'Champú suave 250 ml', price: '18.50', initial: 4, minimum: 2, request: 821},
  {sku: 'P11-SEED-PANUELO', name: 'Pañuelo para mascota', price: '12.00', initial: 5, minimum: 1, request: 822},
];

async function main() {
  const env = JSON.parse(execFileSync('supabase', ['status', '--output', 'json'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }));
  assert.equal(env.API_URL, 'http://127.0.0.1:55321', 'Solo API local 55321');
  assert.equal(env.DB_URL, dbUrl, 'Solo PostgreSQL local 55322');
  const migrations = [
    '20261017152256', '20261017201505', '20261017210343', '20261017212614',
    '20261017220427', '20261018225928', '20261018230255', '20261021090000',
    '20261021093000', '20261021100000', '20261022140000',
    '20261022143000', '20261022160000', '20261022163000', '20261022164000',
    '20261022165000', '20261022166000', '20261022167000',
  ];
  const installed = sql(`select count(*) from supabase_migrations.schema_migrations where version in (${migrations.map(v => `'${v}'`).join(',')});`);
  assert.equal(installed, String(migrations.length), 'Faltan migraciones locales. Ejecutar supabase migration up --local primero.');

  const root = createClient(env.API_URL, env.SERVICE_ROLE_KEY, options);
  const users = [];
  for (let page = 1; ; page++) {
    const batch = await value(root.auth.admin.listUsers({page, perPage: 100}));
    users.push(...batch.users);
    if (batch.users.length < 100) break;
  }
  const actors = {};
  for (const role of ['OWNER', 'ADMIN', 'STAFF', 'CLIENT']) {
    const email = `demo.fases.${role.toLowerCase()}@example.test`;
    const user = users.find(candidate => candidate.email === email);
    assert.ok(user && user.app_metadata.local_demo_seed === marker,
      `Falta ${email} con marca válida. Ejecutar npm run seed:local primero.`);
    const api = createClient(env.API_URL, env.ANON_KEY, options);
    await value(api.auth.signInWithPassword({email, password}));
    actors[role] = {api, user};
  }
  const owner = actors.OWNER.api;
  const admin = actors.ADMIN.api;
  const date = Temporal.PlainDate.from(actors.OWNER.user.app_metadata.demo_start_date).subtract({days: 7});
  assert.ok(Temporal.PlainDate.compare(date, Temporal.Now.zonedDateTimeISO('America/Lima').toPlainDate()) < 0,
    'La fecha comercial debe estar en el pasado; revisar la metadata de la cuenta demo.');
  assert.equal(date.dayOfWeek, 1, 'La fecha comercial debe ser lunes.');

  for (const [table, key] of [['clients', id(101)], ['pets', id(202)], ['services', id(301)],
    ['employees', id(502)]]) {
    const fixture = await row(root.from(table).select('id').eq('id', key));
    assert.ok(fixture, `Falta fixture ${table}/${key}. Ejecutar npm run seed:local primero.`);
  }

  const cash = await row(root.from('cash_sessions').select('*').eq('request_id', id(850)));
  const openCash = await row(root.from('cash_sessions').select('id,request_id').eq('status', 'OPEN'));
  assert.ok(!openCash || openCash.request_id === id(850),
    'Hay una caja ajena abierta. Cerrar esa sesión desde la aplicación antes de cargar el escenario comercial.');
  if (cash) {
    assert.equal(cash.opened_by, actors.OWNER.user.id, 'La marca de caja pertenece a otra cuenta');
    assert.equal(money(cash.opening_cash), '20.00', 'El fondo de la caja demo fue modificado');
    if (cash.status === 'CLOSED') {
      for (const [table, requests] of [
        ['payments', [id(861)]], ['sale_payments', [id(862), id(863)]],
      ]) {
        const payments = await value(root.from(table).select('request_id,status').in('request_id', requests));
        assert.ok(requests.every(request => payments.some(p => p.request_id === request && p.status === 'PAID')),
          'La caja demo ya está cerrada pero faltan cobros verificados. Revisar manualmente.');
      }
      const manual = await value(root.from('cash_movements').select('request_id').in('request_id', [id(871), id(872)]));
      assert.equal(manual.length, 2, 'La caja demo cerrada carece de movimientos manuales; revisar manualmente.');
    }
  }

  // Revisar marcadores reservados antes de la primera escritura del escenario.
  for (const definition of productDefinitions) {
    const product = await row(root.from('products').select('id,name,price,active,minimum_stock').eq('sku', definition.sku));
    assert.ok(!product || (product.name === definition.name && money(product.price) === definition.price
      && product.active && [null, definition.minimum].includes(product.minimum_stock)),
    `SKU ${definition.sku} en conflicto con otro artículo`);
    const receipt = await row(root.from('inventory_movements').select('created_by,product_id,kind,delta')
      .eq('request_id', id(definition.request)));
    assert.ok(!receipt || (receipt.created_by === actors.ADMIN.user.id && receipt.kind === 'INITIAL'
      && receipt.delta === definition.initial && product?.id === receipt.product_id
      && product.minimum_stock === definition.minimum), 'Marca de carga inicial en conflicto');
  }
  for (const [request, clientId] of [[831, id(101)], [832, id(102)]]) {
    const sale = await row(root.from('sales').select('created_by,client_id,status').eq('request_id', id(request)));
    assert.ok(!sale || (sale.created_by === actors.ADMIN.user.id && sale.client_id === clientId
      && ['DRAFT', 'CONFIRMED'].includes(sale.status)), `Marca de venta ${request} en conflicto`);
  }
  for (const [table, requests] of [['payments', [861]], ['sale_payments', [862, 863]]]) {
    for (const request of requests) {
      const payment = await row(root.from(table).select('created_by,status').eq('request_id', id(request)));
      assert.ok(!payment || (payment.created_by === actors.ADMIN.user.id
        && ['PENDING', 'PAID'].includes(payment.status)), `Marca de cobro ${request} en conflicto`);
    }
  }
  for (const request of [871, 872]) {
    const movement = await row(root.from('cash_movements').select('created_by,session_id').eq('request_id', id(request)));
    assert.ok(!movement || (cash && movement.created_by === actors.OWNER.user.id
      && movement.session_id === cash.id), `Marca de caja ${request} en conflicto`);
  }

  const note = `${commercialMarker} Lucía trae a Toby para baño.`;
  const reservedAppointment = await row(root.from('appointments').select('client_notes').eq('id', id(809)));
  assert.ok(!reservedAppointment || reservedAppointment.client_notes === note,
    'El UUID reservado de la cita pertenece a otro registro');
  let appointment = await row(root.from('appointments').select('id,client_id,status,version,starts_at,total_price')
    .eq('client_notes', note));
  if (!appointment) {
    const quote = await value(owner.rpc('quote_service', {
      p_service_id: id(301), p_size: 'TOY', p_coat: 'SHORT',
    }));
    assert.ok(money(quote.price) === '25.00' && quote.duration_minutes === 30,
      'La tarifa de Toby cambió; no se crea la cita histórica');
    // La RPC de creación rechaza fechas pasadas. Solo este fixture histórico usa SQL
    // local privilegiado y valida horario, habilidad y solapamientos en la misma transacción.
    const starts = `${date}T10:00:00-05:00`;
    const ends = `${date}T10:30:00-05:00`;
    sql(`begin;
      select pg_advisory_xact_lock(930003);
      do $$ begin
        if exists(select 1 from public.appointments where id=${literal(id(809))}::uuid or client_notes=${literal(note)}) then
          raise exception 'La cita histórica ya existe; revisar marcadores';
        end if;
      end $$;
      insert into public.appointments(id,client_id,starts_at,ends_at,total_price,created_by,client_notes)
        values(${literal(id(809))}::uuid,${literal(id(101))}::uuid,${literal(starts)}::timestamptz,
          ${literal(ends)}::timestamptz,25.00,${literal(actors.ADMIN.user.id)}::uuid,${literal(note)});
      insert into public.appointment_items(id,appointment_id,pet_id,client_id,service_id,price,duration_minutes,requires_specialist_snapshot)
        values(${literal(id(810))}::uuid,${literal(id(809))}::uuid,${literal(id(202))}::uuid,
          ${literal(id(101))}::uuid,${literal(id(301))}::uuid,25.00,30,false);
      insert into public.appointment_item_staff(id,item_id,employee_id,stage,starts_at,ends_at)
        values(${literal(id(811))}::uuid,${literal(id(810))}::uuid,${literal(id(502))}::uuid,
          'SERVICE',${literal(starts)}::timestamptz,${literal(ends)}::timestamptz);
      select private.validate_appointment(${literal(id(809))}::uuid);
      commit;`);
    appointment = await row(root.from('appointments').select('id,client_id,status,version,starts_at,total_price')
      .eq('id', id(809)));
  }
  assert.equal(appointment.id, id(809), 'La cita marcada no usa el UUID reservado');
  assert.equal(appointment.client_id, id(101), 'La cita marcada pertenece a otro cliente');
  assert.equal(money(appointment.total_price), '25.00', 'La tarifa de la cita comercial cambió');
  assert.equal(appointment.starts_at.slice(0, 10), `${date}`, 'La fecha de la cita comercial cambió');
  const detail = await value(owner.rpc('get_appointment', {p_id: appointment.id}));
  assert.ok(detail.items.length === 1 && detail.items[0].pet_id === id(202)
    && detail.items[0].service_id === id(301) && detail.items[0].stages.length === 1
    && detail.items[0].stages[0].employee_id === id(502),
  'El detalle de la cita comercial fue modificado');
  if (appointment.status === 'CONFIRMED') {
    appointment = await value(admin.rpc('change_appointment_status', {
      p_id: appointment.id, p_expected_version: appointment.version, p_target: 'IN_PROGRESS',
    }));
  }
  if (appointment.status === 'IN_PROGRESS') {
    appointment = await value(admin.rpc('change_appointment_status', {
      p_id: appointment.id, p_expected_version: appointment.version, p_target: 'COMPLETED',
    }));
  }
  assert.equal(appointment.status, 'COMPLETED', 'La cita marcada está en un estado incompatible');

  const products = {};
  for (const definition of productDefinitions) {
    let product = await row(root.from('products').select('*').eq('sku', definition.sku));
    if (!product) product = await value(admin.rpc('save_product', {
      p_id: null, p_name: definition.name, p_sku: definition.sku, p_price: definition.price, p_active: true,
    }));
    assert.ok(product.name === definition.name && money(product.price) === definition.price && product.active,
      `Producto ${definition.sku} modificado o en conflicto; revisar manualmente.`);
    if (product.minimum_stock === null) product = await value(admin.rpc('set_product_minimum', {
      p_id: product.id, p_minimum: definition.minimum,
    }));
    assert.equal(product.minimum_stock, definition.minimum, `Mínimo de ${definition.sku} modificado`);
    const balance = await row(root.from('inventory_balances').select('quantity,version').eq('product_id', product.id));
    assert.ok(balance, `Falta saldo de ${definition.sku}`);
    const receipt = await row(root.from('inventory_movements').select('id,product_id,kind,delta').eq('request_id', id(definition.request)));
    if (!receipt) assert.equal(balance.quantity, 0, `Stock previo no esperado para ${definition.sku}`);
    const input = {product_id: product.id, kind: 'INITIAL', delta: definition.initial,
      reason: 'Carga inicial de artículos', expected_version: 1, request_id: id(definition.request)};
    const initial = await value(admin.rpc('record_inventory_movement', {p_input: input}));
    assert.ok(initial.product_id === product.id && initial.kind === 'INITIAL' && initial.delta === definition.initial,
      `La carga inicial de ${definition.sku} no coincide`);
    products[definition.sku] = product;
  }
  const shampoo = products['P11-SEED-CHAMPU-250'];
  const scarf = products['P11-SEED-PANUELO'];

  async function sale(request, clientId, appointmentId, lines, expected) {
    const input = {request_id: id(request), client_id: clientId, products: lines,
      ...(appointmentId ? {appointment_id: appointmentId} : {})};
    let result = await value(admin.rpc('create_sale_draft', {p_input: input}));
    assert.equal(money(result.total), expected, `Total inesperado de venta ${request}`);
    assert.equal(result.client_id, clientId, `Cliente inesperado en venta ${request}`);
    if (result.status === 'DRAFT') result = await value(admin.rpc('confirm_sale', {
      p_id: result.id, p_expected_version: result.version,
    }));
    assert.equal(result.status, 'CONFIRMED', `Venta ${request} en estado incompatible`);
    return result;
  }
  const mixed = await sale(831, id(101), appointment.id, [{product_id: shampoo.id, quantity: 1}], '43.50');
  const counter = await sale(832, id(102), null, [
    {product_id: shampoo.id, quantity: 1}, {product_id: scarf.id, quantity: 1},
  ], '30.50');

  let session = await value(owner.rpc('open_cash', {p_opening: '20.00', p_request_id: id(850)}));
  assert.equal(session.id, cash?.id ?? session.id, 'La caja marcada cambió de identidad');
  async function payment(kind, request, target, amount, method) {
    const input = kind === 'appointment'
      ? {appointment_id: target, type: 'BALANCE', amount, method, request_id: id(request),
        operation_code: method === 'YAPE' ? 'YP-2401' : null, external_ref: null}
      : {sale_id: target, amount, method, request_id: id(request),
        operation_code: method === 'PLIN' ? 'PL-2401' : null, external_ref: null};
    let result = await value(admin.rpc(kind === 'appointment' ? 'register_payment' : 'register_sale_payment', {
      p_input: input,
    }));
    assert.equal(money(result.amount), amount, `Importe del cobro ${request} modificado`);
    if (result.status === 'PENDING') {
      assert.equal(session.status, 'OPEN', 'La caja demo está cerrada y quedan cobros pendientes');
      result = await value(owner.rpc(kind === 'appointment' ? 'verify_payment' : 'verify_sale_payment', {
        p_id: result.id, p_expected_version: result.version,
      }));
    }
    assert.equal(result.status, 'PAID', `Cobro ${request} en estado incompatible`);
    return result;
  }
  await payment('appointment', 861, appointment.id, '25.00', 'YAPE');
  await payment('sale', 862, mixed.id, '18.50', 'CASH');
  await payment('sale', 863, counter.id, '30.50', 'PLIN');

  for (const [request, source, amount, reason] of [
    [871, 'MANUAL_IN', '5.00', 'Ingreso de efectivo para cambio'],
    [872, 'MANUAL_OUT', '2.00', 'Retiro de efectivo para caja chica'],
  ]) {
    await value(owner.rpc('record_cash_movement', {p_input: {
      session_id: session.id, source, amount, reason, request_id: id(request),
    }}));
  }
  session = await value(owner.rpc('cash_overview', {p_id: session.id}));
  assert.equal(money(session.expected_cash), '41.50', 'El efectivo esperado de la caja cambió');
  if (session.status === 'OPEN') session = await value(owner.rpc('close_cash', {
    p_id: session.id, p_expected_version: session.version, p_counted: '41.00',
  }));
  assert.ok(session.status === 'CLOSED' && money(session.counted_cash) === '41.00'
    && money(session.difference) === '-0.50', 'El cierre de caja no coincide');
  console.log(`Seed comercial local completado: cita ${date}, dos ventas y caja cerrada.`);
  console.log('Lucía Herrera / Toby: baño S/ 25.00; venta mixta S/ 43.50.');
  console.log('Mateo Ríos: venta de mostrador S/ 30.50. Caja: esperado S/ 41.50, contado S/ 41.00.');
}

main().catch(error => {
  const diagnostic = error.stderr?.toString().trim().split('\n')
    .filter(line => /ERROR:|DETAIL:|HINT:/.test(line)).join('\n');
  console.error(`Seed comercial interrumpido: ${diagnostic || (error.stderr
    ? 'No se pudo ejecutar Supabase CLI/psql; comprobar CLI, Docker y permisos locales.' : error.message)}`);
  console.error('No se hizo reset ni limpieza. Revisar el estado parcial y repetir sin modificar registros ajenos.');
  process.exitCode = 1;
});
