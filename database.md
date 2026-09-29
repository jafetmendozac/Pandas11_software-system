// https://dbdiagram.io/Í

Table roles {
  id uuid [pk]
  name text [unique]        // OWNER, ADMIN, RECEPTIONIST, GROOMER
  description text
}

Table permissions {
  id uuid [pk]
  code text [unique]        // 'appointments.create', 'payments.refund', 'reports.view'
  description text
}

Table role_permissions {
  role_id uuid [ref: > roles.id]
  permission_id uuid [ref: > permissions.id]
  indexes { (role_id, permission_id) [pk] }
}

Table user_roles {
  user_id uuid [ref: > profiles.id]
  role_id uuid [ref: > roles.id]
  branch_id uuid [ref: > branches.id] // el rol puede ser por sucursal
  indexes { (user_id, role_id, branch_id) [pk] }
}

// Tipos ENUM requeridos para pets
Enum pet_sex {
  MALE
  FEMALE
  UNKNOWN
}

Enum pet_size {
  SMALL
  MEDIUM
  LARGE
  EXTRA_LARGE
}

Enum pet_coat_type {
  SHORT
  MEDIUM
  LONG
  WIRE
  CURLY
  HAIRLESS
}

// Tablas base referenciadas en las citas
Enum employee_role {
  ALL_SERVICES  // El que puede hacer de todo (Groomer principal)
  ASSISTANT     // El que solo hace servicios básicos (Bañador/Asistente)
}

Table profiles {
  id uuid [pk]
  first_name text
  last_name text
  role employee_role // <--- Identifica qué puede hacer cada uno
  active boolean
  created_at timestamptz
  updated_at timestamptz
}

Table clients {
  id uuid [pk]
  first_name text
  last_name text
  phone text
  email text
  address text
  created_at timestamptz
  updated_at timestamptz
}

Table pets {
  id uuid [pk]
  client_id uuid [ref: >? clients.id]
  name text
  breed text
  pet_sex pet_sex
  pet_size pet_size
  bites bool
  pet_coat_type pet_coat_type
  weight numeric
  allergies text
  notes text
  active boolean
  birth_date date
  death_date date
  created_at timestamptz
  updated_at timestamptz
}

Table services {
  id uuid [pk]
  name text
  description text
  price numeric
  duration_minutes integer
  requires_specialist boolean // <--- TRUE si solo lo puede hacer el principal
  active boolean
  created_at timestamptz
  updated_at timestamptz
}

// Módulo principal de Citas
Table appointments {
  id uuid [pk]
  client_id uuid [ref: > clients.id]
  pet_id uuid [ref: > pets.id]
  employee_id uuid [ref: > profiles.id]
  appointment_date date
  start_time time
  end_time time
  status text
  notes text
  created_at timestamptz
  updated_at timestamptz
}

Table appointment_services {
  id uuid [pk]
  appointment_id uuid [ref: > appointments.id]
  service_id uuid [ref: > services.id]
  price numeric
  duration_minutes integer
  created_at timestamptz
  updated_at timestamptz
}