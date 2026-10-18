# Fase 1 — Clientes y mascotas

Fecha: 2026-10-17. Estado: aprobado por el usuario el 2026-10-17; implementación local.

## Resultado esperado

Registrar, buscar, editar y consultar clientes y sus mascotas, con vacunas, observaciones visibles al cliente y notas reservadas al personal autorizado. Reutilizar las páginas y CRUD existentes; no reconstruir la aplicación.

## Modelo local obligatorio

Tablas de Pandas11.sql: `clients`, `pets`, `pet_vaccinations`, `client_internal`, `pet_internal`. Relaciones: cliente–perfil opcional y único, mascota–cliente obligatorio, vacunas–mascota, notas internas 1:1 con cliente/mascota y autor perfil. Usar enums `tax_doc_type`, `pet_sex`, `pet_size` (incluido TOY), `pet_coat_type`.

Hechos: ya hay CRUD/baja lógica y mascotas desde cliente; no se identificaron servicios de vacunas/notas internas. Solo existe migración local de identidad. Angular espera allergies como texto mientras SQL define boolean; TOY no aparece en tipos/opciones Angular.

## Definiciones y límites

- Información pública: ficha visible para el cliente autenticado vinculado mediante `clients.profile_id`; no acceso anónimo ni listado de todos los clientes.
- Observaciones visibles: `pets.client_notes`. Antecedentes en esta fase: ficha, alergias/mordidas, vacunas y notas; no consultas veterinarias, diagnósticos ni historia de tratamientos.
- `pets.allergies` se mantiene boolean según SQL. Propuesta: detalles narrativos reservados en `pet_internal.notes`; no crear otra columna sin aprobación.
- Notas internas son una nota editable por ficha, conforme a las PK existentes; `updated_by`/`updated_at` registran última edición, no historial inmutable de revisiones.
- No incluye subir fotos o comprobantes a Storage. `photo_url`/`document_url` no deben publicarse ni abrirse automáticamente; conservar datos existentes y validar URL si se usa entrada manual. Diseñar Storage privado requiere alcance separado.
- No citas, tarifas, pagos ni traslados en esta fase. No borrado físico de clientes/mascotas ni cambio de propietario de una mascota ya creada.

## Reglas aplicables

RN-09: personal puede registrar clientes sin cuenta, `profile_id` nullable. RN-04/RN-05: conservar tamaño para fases posteriores; no calcular duración aquí. RN-07: habilidad de corte distinta de permiso para editar fichas. RN-03 no limita cantidad de mascotas registradas; limita capacidad simultánea de atención. Las restantes reglas de citas/pagos no se implementan.

## Matriz aprobada

| Operación | OWNER/ADMIN | STAFF | CLIENT autenticado |
|---|---|---|---|
| Consultar/buscar fichas operativas | Sí | Sí | Solo ficha propia y mascotas asociadas |
| Crear/editar clientes y mascotas | Sí | No por defecto | No; solo consulta en esta fase |
| Baja lógica de cliente/mascota | Sí | No | No |
| Leer vacunas | Sí | Sí | Solo sus mascotas |
| Registrar/corregir vacunas | Sí | No por defecto | No |
| Leer notas internas | Sí | Sí | Nunca |
| Editar notas internas | Sí | No por defecto | Nunca |
| Vincular cliente a perfil | Sí mediante operación controlada | No | No puede vincularse por ID, email o metadata |

Permisos propuestos: `clients.read`, `clients.manage`, `pets.read`, `pets.manage`, `vaccinations.read`, `vaccinations.manage`, `internal.read`, `internal.manage`. Lectura propia se basa en identidad y vínculo, no requiere esos permisos globales. Roles/perfiles inactivos no conceden acceso; OWNER/ADMIN reciben el conjunto, STAFF solo lecturas. Asignación inicial a roles de sistema mediante migración privilegiada; no debilitar su protección API de Fase 0.

## Criterios de aceptación

- F1-01: cinco tablas y enums dependientes instalados mediante nueva migración local, conservando identidad y cuentas actuales; no reset.
- F1-02: crear/editar/consultar clientes con o sin cuenta y mascotas desde ficha o listado; nombres obligatorios y asociación válida. No crear Auth users desde el frontend ni asociar cuentas basándose solo en email.
- F1-03: buscar clientes por nombre/apellido/teléfono/WhatsApp/documento; mascotas por nombre y cliente. Búsqueda/paginación no debe ocultar registros al superar límite API y no debe exponer filas no autorizadas.
- F1-04: TOY y allergies boolean coherentes en UI/servicios/SQL. Peso positivo si se indica, fechas de vida coherentes, booleanos normalizados; validar campos opcionales solo cuando se informen.
- F1-05: consultar/registrar/corregir vacunas con nombre, fecha aplicada y vencimiento opcional coherente. Antecedentes permanecen asociados a mascota correcta. Sin bloqueo de agenda por vacunas en esta fase.
- F1-06: notas visibles e internas separadas en interfaz y consultas; CLIENT no obtiene filas internas ni por join/RPC/API directa. Solo servidor establece autor y fecha de notas.
- F1-07: RLS y grants de las cinco tablas aplican la matriz; no autoasignación de cliente, transferencia de mascota, modificación de autor/timestamps ni acceso entre clientes.
- F1-08: baja lógica oculta cliente/mascotas de listados operativos sin borrar antecedentes. Vacunas/notas de fichas retiradas no quedan accesibles al cliente; personal autorizado puede consultar antecedentes archivados, en modo lectura. No reactivación automática.
- F1-09: escritura comprueba filas afectadas, muestra errores y conserva/restaura estado de formulario/listado; no éxito visual antes de persistir. Guard/menú/botones alineados con permisos, sin sustituir RLS. CLIENT dispone de consulta propia fuera del panel.
- F1-10: pruebas SQL/API/Angular con datos sintéticos y cuentas preexistentes, build y regresiones de Fase 0 correctos; no cambios remotos o credenciales expuestas.

## Decisiones concretadas con la aprobación

1. Matriz: STAFF solo lectura o también edición de fichas, vacunas y notas.
2. CLIENT solo consulta y acceso propio; confirmar significado de información pública.
3. Indicador de alergias boolean y detalle interno; confirmar si el cliente también necesita leer el detalle.
4. Una nota interna editable por ficha, sin historial cronológico adicional; confirmar alcance de antecedentes.

## Aprobación y concreción

El usuario autorizó proceder con la propuesta: OWNER/ADMIN editan; STAFF consulta; CLIENT consulta su ficha/mascotas sin notas internas. Allergies permanece boolean y detalles narrativos son internos; una nota editable por ficha, sin historial de revisiones ni Storage. Migración incremental local sin reset ni adopción remota.
