# Cita interna con una sola mascota

Fecha: 2026-11-13 (America/Lima). Estado: aprobado mediante «Claro vamos con eso».

## Objetivo

Corregir la agenda interna para que toda cita nueva o reprogramada tenga exactamente una mascota, aunque pueda incluir varios servicios consecutivos para ella. Conservar sin pérdida las citas históricas que ya contengan más de una mascota.

## Hallazgos comprobados

- RN-14 y parte de la especificación de Fase 4 ya declaran una mascota por cita, pero el código operativo todavía conserva agrupación y contratos de varias mascotas.
- Los cambios locales sin commit ocultan «Añadir mascota», pero al seleccionar un cliente vacían `items` y no crean la primera tarjeta; el usuario no puede elegir ninguna mascota.
- `addItem()` solo evita una segunda tarjeta desde esa acción. El modelo de formulario y el RPC siguen necesitando validación autoritativa.
- La migración local `20261113020000_single_pet_internal_appointments.sql` aún no está aplicada. Su función usa `pets.pet_coat_type` y la firma antigua de `quote_service`; ambos fueron retirados antes por las migraciones vigentes.
- El control propuesto de `count(distinct pet_id) > 1` rechaza un payload múltiple, pero una edición de una cita histórica podría enviar solo una mascota y borrar los demás items omitidos.
- `Pandas11.sql` mantiene correctamente `appointment_items` por servicio. No se puede imponer unicidad por `appointment_id`, porque una mascota puede contratar varios servicios en la misma cita.

## Requisitos

- CUM-01: toda alta interna debe contener exactamente una mascota y uno o más servicios asociados a ella.
- CUM-02: una reprogramación de cita ordinaria mantiene una sola mascota. Puede modificar horarios, asignaciones y servicios sin introducir otra mascota.
- CUM-03: al seleccionar un cliente en una cita nueva, la UI crea una única tarjeta vacía para elegir mascota y servicios. No muestra acciones para añadir o quitar tarjetas de mascota.
- CUM-04: el modelo Angular rechaza antes de enviar cualquier payload vacío o con más de un `pet_id`; el RPC repite la validación de forma autoritativa dentro de la transacción.
- CUM-05: una cita histórica con varias mascotas continúa consultable y conserva items, snapshots, etapas, pagos y estados. No puede reprogramarse ni guardarse mediante `save_internal_appointment`; sí conserva las transiciones de estado y observaciones autorizadas que no reemplazan sus items.
- CUM-06: la cotización de nuevos items usa el contrato vigente `quote_service(service_id, pet_size)`. Raza y pelaje no intervienen.
- CUM-07: no se eliminan, dividen ni convierten citas existentes. No se modifica la estructura de `appointments`, `appointment_items` o sus claves.
- CUM-08: OWNER/ADMIN mantienen gestión; STAFF conserva solo lectura. No cambian permisos, RLS ni exposición a CLIENT/anon.

## Reglas aplicables

- RN-03: cada trabajador atiende una mascota a la vez; citas distintas pueden ejecutarse en paralelo con trabajadores distintos.
- RN-04/RN-05/RN-11/RN-12: cada servicio conserva precio y duración por tamaño o base.
- RN-10/RN-15: una misma mascota puede tener varios servicios y etapas consecutivas con relevo.
- RN-13: OWNER/ADMIN gestionan; STAFF consulta.
- RN-14: una cita interna nueva o reprogramada incluye una sola mascota; históricos múltiples se conservan.

## Criterios de aceptación

- CUM-A01: seleccionar cliente muestra exactamente una tarjeta donde se elige una mascota y uno o varios servicios.
- CUM-A02: ninguna acción de UI crea una segunda tarjeta; cambiar cliente reinicia la tarjeta única.
- CUM-A03: Angular y PostgreSQL rechazan payloads con cero o dos mascotas sin dejar cabecera/items parciales.
- CUM-A04: una cita con una mascota y varios servicios se guarda, cotiza y agenda en secuencia normalmente.
- CUM-A05: una cita histórica con dos mascotas se consulta completa; intentar reprogramarla falla y no cambia ni elimina ningún item.
- CUM-A06: la migración se aplica sobre el esquema local vigente sin referencias a raza/pelaje ni contratos eliminados.
- CUM-A07: pruebas SQL, API y Angular pertinentes, TypeScript, build y diff terminan correctamente.

## Fuera de alcance

No dividir automáticamente citas históricas, mover pagos, recalcular snapshots, cambiar capacidad simultánea entre citas distintas, modificar reservas online ni desplegar a remoto.
