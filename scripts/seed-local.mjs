// Fixtures persistentes, exclusivamente para Pandas11-identity-dev. No importar en Angular.
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {Temporal} from 'temporal-polyfill';

const marker = 'pandas11-phases-0-4-v1';
const password = 'Pandas11-Demo-2026!'; // Contraseña pública SOLO de cuentas locales ficticias.
const dbUrl = 'postgresql://postgres:postgres@127.0.0.1:55322/postgres';
const id = n => `d0400000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const literal = value => `'${String(value).replaceAll("'", "''")}'`;
const options = {auth: {persistSession: false, autoRefreshToken: false}};
const value = async request => {
  const result = await request;
  if (result.error) throw new Error(result.error.message);
  return result.data;
};
const sql = text => execFileSync('psql', [dbUrl, '-X', '-At', '-v', 'ON_ERROR_STOP=1'], {
  input: text, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
});

async function main() {
  // No aceptar variables SUPABASE_URL/keys del shell ni un proyecto enlazado remoto.
  const env = JSON.parse(execFileSync('supabase', ['status', '--output', 'json'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }));
  assert.equal(env.API_URL, 'http://127.0.0.1:55321', 'Solo instancia local 55321');
  assert.equal(env.DB_URL, dbUrl, 'Solo PostgreSQL local 55322');
  assert.equal(sql(`select count(*) from supabase_migrations.schema_migrations where version in
    ('20261017152256','20261017201505','20261017210343','20261017212614','20261017220427');`).trim(), '5',
  'Aplicar primero las cinco migraciones con supabase migration up --local; no se ejecuta reset');
  const root = createClient(env.API_URL, env.SERVICE_ROLE_KEY, options);
  const users = [];
  for (let page = 1; ; page++) {
    const batch = await value(root.auth.admin.listUsers({page, perPage: 100}));
    users.push(...batch.users);
    if (batch.users.length < 100) break;
  }
  const roles = ['OWNER', 'ADMIN', 'STAFF', 'CLIENT'];
  const email = role => `demo.fases.${role.toLowerCase()}@example.test`;
  // Comprobar todas las colisiones antes de crear cuentas o conceder roles.
  for (const role of roles) {
    const user = users.find(u => u.email === email(role));
    assert.ok(!user || user.app_metadata.local_demo_seed === marker,
      `${email(role)} ya existe sin la marca del seed. No se modifica ni se eleva su rol.`);
  }
  const today = Temporal.Now.zonedDateTimeISO('America/Lima').toPlainDate();
  const startDate = Temporal.PlainDate.from(users.find(u => u.email === email('OWNER'))?.app_metadata.demo_start_date
    ?? today.add({days: 8 - today.dayOfWeek}).toString());
  const accounts = {};
  for (const role of roles) {
    let user = users.find(u => u.email === email(role));
    if (!user) {
      user = (await value(root.auth.admin.createUser({email: email(role), password, email_confirm: true,
        app_metadata: {local_demo_seed: marker, demo_start_date: startDate.toString()},
        user_metadata: {first_name: ({OWNER: 'Ana', ADMIN: 'Diego', STAFF: 'María', CLIENT: 'Lucía'})[role],
          last_name: ({OWNER: 'Valdez', ADMIN: 'Ramos', STAFF: 'Torres', CLIENT: 'Herrera'})[role]},
      }))).user;
    }
    assert.match(user.id, /^[a-f0-9-]{36}$/);
    accounts[role] = user.id;
  }
  // SQL privilegiado limitado al bootstrap y fixtures locales; no alterar RLS ni permisos de sistema.
  const bootstrap = roles.map(role => `insert into public.user_roles(user_id,role_id)
    select ${literal(accounts[role])}::uuid,id from public.roles where code=${literal(role)} on conflict do nothing;`).join('\n');
  const fixtures = [];
  // Ajustar únicamente nombres antiguos intactos del propio seed. Una edición manual se conserva.
  const displayNames = [
    `update public.clients set first_name='Lucía',last_name='Herrera' where id='${id(101)}' and first_name in ('DEMO Lucía','Lucía') and last_name in ('Cliente con cuenta','Herrera') and (first_name='DEMO Lucía' or last_name='Cliente con cuenta');`,
    `update public.clients set first_name='Mateo',last_name='Ríos' where id='${id(102)}' and first_name in ('DEMO Mateo','Mateo') and last_name in ('Cliente sin cuenta','Ríos') and (first_name='DEMO Mateo' or last_name='Cliente sin cuenta');`,
    `update public.clients set first_name='Rosa',last_name='Salazar' where id='${id(103)}' and first_name in ('DEMO Archivo','Rosa') and last_name in ('Cliente retirado','Salazar') and (first_name='DEMO Archivo' or last_name='Cliente retirado');`,
    ...[[201,'DEMO Luna','Luna'],[202,'DEMO Toby','Toby'],[203,'DEMO Rocky','Rocky'],[204,'DEMO Histórico','Milo']]
      .map(([n,oldName,newName]) => `update public.pets set name=${literal(newName)} where id='${id(n)}' and name=${literal(oldName)};`),
    ...[[301,'DEMO Baño','Baño canino'],[302,'DEMO Baño y corte','Baño y corte canino'],
      [303,'DEMO Servicio interno','Hidratación de pelaje'],[304,'DEMO Servicio inactivo','Spa de temporada']]
      .map(([n,oldName,newName]) => `update public.services set name=${literal(newName)} where id='${id(n)}' and name=${literal(oldName)};`),
    ...[['OWNER','DEMO OWNER','Pruebas locales','Ana','Valdez'],['ADMIN','DEMO ADMIN','Pruebas locales','Diego','Ramos'],
      ['STAFF','DEMO STAFF','Pruebas locales','María','Torres'],['CLIENT','DEMO CLIENT','Pruebas locales','Lucía','Herrera']]
      .map(([role,oldFirst,oldLast,first,last]) => `update public.profiles set first_name=${literal(first)},last_name=${literal(last)} where id=${literal(accounts[role])}::uuid and first_name=${literal(oldFirst)} and last_name=${literal(oldLast)};`),
    `update public.pet_vaccinations set vaccine='Antirrábica' where id='${id(251)}' and vaccine='DEMO Antirrábica vigente';`,
    `update public.pet_vaccinations set vaccine='Séxtuple' where id='${id(252)}' and vaccine='DEMO Vacuna vencida';`,
    `update public.client_internal set notes='Confirmar teléfono de contacto antes de la cita.' where client_id='${id(101)}' and notes='DEMO INTERNO: confirmar contacto antes de atender.';`,
    `update public.pet_internal set notes='Rocky puede reaccionar al cepillado; consultar manejo con Mateo.' where pet_id='${id(203)}' and notes='DEMO INTERNO: antecedentes ficticios de mordida; revisar manejo con responsable.';`,
    `update public.services set description='Baño, secado y cepillado.' where id='${id(301)}' and description='Tarifas y minutos ficticios para probar prioridad de reglas.';`,
    `update public.services set description='Baño, secado y corte.' where id='${id(302)}' and description='Ejemplo ficticio con relevo; requiere especialista.';`,
    `update public.time_blocks set reason='Recojo a domicilio de una mascota.' where id='${id(701)}' and reason='DEMO: recojo manual; trabajador ocupado (sin viaje de regreso ni cotización automática)';`,
    `update public.time_blocks set reason='Ausencia programada.' where id='${id(702)}' and reason='DEMO: ausencia / descanso';`,
  ];
  // Inserción aditiva por UUID estable; los cambios manuales en filas existentes se conservan.
  // Comprobar vínculos/marcas para no reutilizar un UUID que pertenezca a otro conjunto de datos.
  function fixture(table, rows, identity, primary = 'id') {
    for (const row of rows) {
      fixtures.push(`do $$ begin if exists(select 1 from public.${table} t where ${primary}=${literal(row[primary])}::uuid
        and to_jsonb(t)->>${literal(identity)} is distinct from ${literal(row[identity])}) then
        raise exception 'Colisión de fixture en ${table}: ${row[primary]}; no se sobrescribe'; end if; end $$;`);
      const fields = Object.keys(row).join(',');
      fixtures.push(`insert into public.${table}(${fields}) select ${fields}
        from jsonb_populate_record(null::public.${table},${literal(JSON.stringify(row))}::jsonb)
        on conflict (${primary}) do nothing;`);
    }
  }
  fixture('clients', [
    {id: id(101), profile_id: accounts.CLIENT, first_name: 'Lucía', last_name: 'Herrera',
      email: email('CLIENT'), address: 'Calle Los Cedros 124, Trujillo', whatsapp_opt_in: false},
    {id: id(102), first_name: 'Mateo', last_name: 'Ríos', address: 'Jirón Las Palmeras 317, Trujillo'},
    {id: id(103), first_name: 'Rosa', last_name: 'Salazar', deleted_at: `${startDate}T00:00:00-05:00`},
  ], 'first_name');
  fixture('pets', [
    {id: id(201), client_id: id(101), name: 'Luna', breed: 'Mestiza', pet_sex: 'FEMALE',
      pet_size: 'SMALL', pet_coat_type: 'LONG', weight_kg: 6, allergies: true,
      client_notes: 'Información comunicable: usar champú indicado por su dueña.'},
    {id: id(202), client_id: id(101), name: 'Toby', pet_sex: 'MALE', pet_size: 'TOY', pet_coat_type: 'SHORT', weight_kg: 3},
    {id: id(203), client_id: id(102), name: 'Rocky', pet_sex: 'MALE', pet_size: 'LARGE', pet_coat_type: 'CURLY', bites: true, weight_kg: 25},
    {id: id(204), client_id: id(103), name: 'Milo', active: false, deleted_at: `${startDate}T00:00:00-05:00`},
  ], 'client_id');
  fixture('pet_vaccinations', [
    {id: id(251), pet_id: id(201), vaccine: 'Antirrábica', applied_on: today.subtract({days: 30}).toString(), valid_until: today.add({days: 335}).toString()},
    {id: id(252), pet_id: id(203), vaccine: 'Séxtuple', applied_on: today.subtract({days: 400}).toString(), valid_until: today.subtract({days: 35}).toString()},
  ], 'pet_id');
  fixture('client_internal', [{client_id: id(101), notes: 'Confirmar teléfono de contacto antes de la cita.', updated_by: accounts.OWNER}], 'client_id', 'client_id');
  fixture('pet_internal', [{pet_id: id(203), notes: 'Rocky puede reaccionar al cepillado; consultar manejo con Mateo.', updated_by: accounts.OWNER}], 'pet_id', 'pet_id');
  fixture('services', [
    {id: id(301), name: 'Baño canino', description: 'Baño, secado y cepillado.', base_price: '45.00', base_duration_minutes: 60},
    {id: id(302), name: 'Baño y corte canino', description: 'Baño, secado y corte.', base_price: '90.00', base_duration_minutes: 120, requires_specialist: true},
    {id: id(303), name: 'Hidratación de pelaje', description: 'Servicio interno de acondicionamiento.', base_price: '30.00', base_duration_minutes: 30, visible_to_clients: false},
    {id: id(304), name: 'Spa de temporada', base_price: '10.00', base_duration_minutes: 30, active: false},
  ], 'name');
  fixture('service_prices', [
    {id: id(401), service_id: id(301), pet_size: null, pet_coat_type: null, price: '40.00', duration_minutes: 60},
    {id: id(402), service_id: id(301), pet_size: 'TOY', pet_coat_type: null, price: '25.00', duration_minutes: 30},
    {id: id(403), service_id: id(301), pet_size: null, pet_coat_type: 'LONG', price: '50.00', duration_minutes: 60},
    {id: id(404), service_id: id(301), pet_size: 'SMALL', pet_coat_type: 'LONG', price: '55.00', duration_minutes: 60},
  ], 'service_id');
  fixture('employees', [
    {id: id(501), profile_id: accounts.ADMIN, skill_level: 'ALL_SERVICES'},
    {id: id(502), profile_id: accounts.STAFF, skill_level: 'ASSISTANT'},
  ], 'profile_id');
  fixture('employee_schedules', [1, 2, 3, 4, 5, 6].flatMap(weekday => [
    {id: id(600 + weekday), employee_id: id(501), weekday, start_time: '07:00', end_time: '19:00'},
    {id: id(610 + weekday), employee_id: id(502), weekday, start_time: '07:00', end_time: '18:00'},
  ]), 'employee_id');
  fixture('time_blocks', [
    {id: id(701), employee_id: id(502), starts_at: `${startDate}T11:00:00-05:00`, ends_at: `${startDate}T12:00:00-05:00`,
      reason: 'Recojo a domicilio de una mascota.', created_by: accounts.OWNER},
    {id: id(702), employee_id: id(501), starts_at: `${startDate.add({days: 1})}T13:00:00-05:00`, ends_at: `${startDate.add({days: 1})}T14:00:00-05:00`,
      reason: 'Ausencia programada.', created_by: accounts.OWNER},
  ], 'employee_id');
  sql(`begin; select pg_advisory_xact_lock(930003);\n${bootstrap}\n${displayNames.join('\n')}\n${fixtures.join('\n')}\ncommit;`);

  const owner = createClient(env.API_URL, env.ANON_KEY, options);
  await value(owner.auth.signInWithPassword({email: email('OWNER'), password}));
  const stage = (employee, kind, start, end) => ({employee_id: id(employee), stage: kind,
    starts_local: `${startDate}T${start}`, ends_local: `${startDate}T${end}`});
  const item = (pet, service, stages) => ({pet_id: id(pet), service_id: id(service), stages});
  const cases = [
    {key: 'relevo-dos-mascotas', client: 101, items: [
      item(201, 302, [stage(502, 'BATH', '08:00', '09:00'), stage(501, 'CUT', '09:00', '10:00')]),
      item(202, 301, [stage(501, 'SERVICE', '08:00', '08:30')]),
    ]},
    {key: 'fin-despues-18', client: 102, items: [item(203, 302, [stage(501, 'SERVICE', '17:00', '19:00')])]},
    {key: 'cancelada', client: 102, cancel: true, items: [item(203, 301, [stage(502, 'SERVICE', '14:00', '15:00')])]},
  ];
  for (const scenario of cases) {
    const notes = `[${marker}:${scenario.key}] ${scenario.cancel ? 'Cliente canceló la atención programada.' : 'Atención solicitada en el local.'}`;
    const existing = await value(root.from('appointments').select('id').eq('client_id', id(scenario.client)).like('client_notes', `[${marker}:${scenario.key}]%`));
    assert.ok(existing.length <= 1, `Hay marcadores duplicados para ${scenario.key}; revisar sin sobrescribir`);
    if (existing.length) {
      console.log(`Conservada cita ${scenario.key}: ${existing[0].id}`);
      continue;
    }
    const pendingStart = Temporal.PlainDateTime.from(`${startDate}T08:00`).toZonedDateTime('America/Lima').epochMilliseconds;
    assert.ok(pendingStart > Date.now(), 'La fecha del seed ya pasó y falta una cita. Revisar manualmente; no se desplazan reservas existentes.');
    let appointment = await value(owner.rpc('save_internal_appointment', {p_input: {
      client_id: id(scenario.client), client_notes: notes, items: scenario.items,
    }}));
    appointment = await value(owner.rpc('save_appointment_internal', {p_id: appointment.id,
      p_expected_version: appointment.version, p_notes: 'Confirmar detalles del servicio con recepción antes del ingreso.'}));
    if (scenario.cancel) appointment = await value(owner.rpc('change_appointment_status', {
      p_id: appointment.id, p_expected_version: appointment.version, p_target: 'CANCELLED', p_reason: 'Cliente solicitó cancelar la cita.',
    }));
    console.log(`Creada cita ${scenario.key}: ${appointment.id} (${appointment.status})`);
  }
  console.log(`Seed local completado. Agenda de ejemplo: ${startDate} (America/Lima).`);
  console.log('Cuentas: demo.fases.{owner,admin,staff,client}@example.test');
  console.log('Contraseña inicial pública de demostración: Pandas11-Demo-2026!');
  console.log('Las contraseñas y los registros ya existentes se conservan. Arranque: npm run start:local');
}

main().catch(error => {
  // No volcar objetos de CLI/Auth: pueden incluir claves o respuestas con datos de sesión.
  const diagnostic = error.stderr?.toString().trim().split('\n').filter(line => /ERROR:|DETAIL:|HINT:/.test(line)).join('\n');
  console.error(`Seed local interrumpido: ${diagnostic || (error.stderr ? 'No se pudo ejecutar Supabase CLI/psql; comprobar Docker, CLI y permisos locales.' : error.message)}`);
  console.error('No se hizo reset. Puede haber fixtures parciales; corregir la causa y repetir. No ejecutar contra producción.');
  process.exitCode = 1;
});
