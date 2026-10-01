-- ---------- POBLAR ROLES ----------
INSERT INTO "roles" ("id", "name", "description") VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'OWNER', 'Propietario del negocio con acceso total'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'ADMIN', 'Administrador del sistema'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'RECEPTIONIST', 'Atención al cliente y gestión de citas'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'GROOMER', 'Personal operativo de peluquería'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'CLIENT', 'Cliente registrado en la plataforma')
ON CONFLICT ("id") DO NOTHING;

-- ---------- POBLAR SERVICIOS BASE ----------
INSERT INTO "services" ("id", "name", "description", "base_price", "base_duration_minutes", "requires_specialist", "visible_to_clients", "active", "created_at", "updated_at") VALUES
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'Baño Completo',
    'Incluye baño, secado, cepillado, limpieza de oídos y corte de uñas.',
    35.00,
    45,
    false,
    true,
    true,
    now(),
    now()
  ),
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Corte de Raza / Especial',
    'Corte de pelo según la raza o estilo solicitado por el dueño.',
    50.00,
    60,
    true,
    true,
    true,
    now(),
    now()
  )
ON CONFLICT ("id") DO NOTHING;

-- ---------- POBLAR REGLAS DE PRECIOS POR TAMAÑO/PELAJE ----------
-- Ajuste para Baño Completo según tamaño de la mascota
INSERT INTO "service_prices" ("id", "service_id", "pet_size", "pet_coat_type", "price", "duration_minutes") VALUES
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'SMALL', NULL, 35.00, 45),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'MEDIUM', NULL, 45.00, 60),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'LARGE', NULL, 60.00, 75),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'EXTRA_LARGE', NULL, 80.00, 90)
ON CONFLICT ("id") DO NOTHING;