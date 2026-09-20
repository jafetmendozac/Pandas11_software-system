-- Seed data. auth_user_id is optional and can be linked to auth.users later.

insert into public.clients (id, first_name, last_name, phone, email, address) values
  ('10000000-0000-0000-0000-000000000001', 'Ana', 'García', '+52 555 010 0001', 'ana@example.com', 'Av. Reforma 100'),
  ('10000000-0000-0000-0000-000000000002', 'Luis', 'Pérez', '+52 555 010 0002', 'luis@example.com', 'Calle Norte 20')
on conflict (id) do nothing;

insert into public.pets (id, client_id, name, breed, pet_sex, pet_size, pet_coat_type, weight, active) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nala', 'Golden Retriever', 'FEMALE', 'LARGE', 'LONG', 28.50, true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Bruno', 'Poodle', 'MALE', 'MEDIUM', 'CURLY', 9.20, true)
on conflict (id) do nothing;

insert into public.services (id, name, description, price, duration_minutes, requires_specialist) values
  ('30000000-0000-0000-0000-000000000001', 'Baño', 'Baño y secado', 250, 45, false),
  ('30000000-0000-0000-0000-000000000002', 'Grooming completo', 'Corte, baño y secado', 550, 90, true),
  ('30000000-0000-0000-0000-000000000003', 'Corte de uñas', 'Corte y limado de uñas', 100, 15, false)
on conflict (id) do nothing;

insert into public.profiles (id, first_name, last_name, role) values
  ('40000000-0000-0000-0000-000000000001', 'María', 'Gómez', 'ALL_SERVICES'),
  ('40000000-0000-0000-0000-000000000002', 'Pedro', 'López', 'ASSISTANT')
on conflict (id) do nothing;

insert into public.appointments
  (id, client_id, pet_id, employee_id, appointment_date, start_time, end_time, status, notes)
values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
   current_date + 1, '10:00', '10:45', 'SCHEDULED', 'Cita de prueba')
on conflict (id) do nothing;

insert into public.appointment_services
  (appointment_id, service_id, price, duration_minutes)
values
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 250, 45)
on conflict (appointment_id, service_id) do nothing;
