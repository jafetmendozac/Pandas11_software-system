# Plan técnico — Cita interna con una sola mascota

Estado: aprobado mediante «Claro vamos con eso».

## Impacto de datos

`Pandas11.sql` mantiene el modelo `appointments → appointment_items → appointment_item_staff`: varios items siguen siendo necesarios para varios servicios de una misma mascota. No se propone agregar columnas, borrar filas ni crear una restricción única sobre `appointment_id`.

La migración `20261113020000_single_pet_internal_appointments.sql` existe pero no está aplicada local ni remotamente. Se corregirá en lugar de crear otra migración encima de una versión defectuosa no aplicada.

## Implementación propuesta

1. Reescribir la función de la migración a partir del contrato vigente, no de una versión histórica. Validar que el array no esté vacío y contenga exactamente un `pet_id`; cotizar nuevos items mediante `quote_service(service_id, pet_size)`.
2. Al editar, comprobar antes de escribir cuántas mascotas distintas posee la cita almacenada. Si tiene más de una, rechazar la reprogramación como histórico de solo consulta. Esto impide que un payload parcial borre silenciosamente otras mascotas.
3. Mantener la transacción, mutex, control de versión, snapshots, validación de cliente/mascota/servicio, etapas, disponibilidad y permisos existentes. Conservar los grants mínimos actuales.
4. Añadir validación defensiva al constructor `appointmentInput`: exactamente un `pet_id` no vacío para todos los items. El servidor sigue siendo la autoridad.
5. En `CalendarioComponent`, crear automáticamente un único draft al seleccionar cliente. Mantener esa tarjeta al elegir mascota y múltiples servicios; retirar las acciones de añadir/quitar tarjetas completas.
6. Detectar citas cargadas con más de una mascota. Mostrar un aviso de histórico, deshabilitar su formulario de reprogramación y conservar consulta, cancelación/transición permitida y observaciones internas.
7. Adaptar las pruebas Angular para recorrer el flujo real cliente → tarjeta → mascota → varios servicios, no solo inyectar `items` manualmente. Cubrir cambio de cliente y histórico múltiple de solo lectura.
8. Actualizar pgTAP y `scripts/test-appointments-api.mjs`: alta válida de una mascota con varios servicios, rechazo atómico de dos mascotas y fixture privilegiado de histórico múltiple que no puede reprogramarse ni perder items.
9. Corregir referencias vigentes que aún prometen varias mascotas. Los documentos históricos de validación conservarán su evidencia con una nota de reemplazo, sin reescribir resultados pasados como si nunca hubieran ocurrido.
10. Aplicar la migración solo en Supabase local, sin reset. Ejecutar pruebas SQL/API/Angular, lint, seed pertinente, TypeScript, build y `git diff --check`; documentar resultados en `validation.md`.

## Archivos previstos

- `supabase/migrations/20261113020000_single_pet_internal_appointments.sql`
- `supabase/tests/database/appointments.test.sql`
- `scripts/test-appointments-api.mjs`
- `src/app/shared/services/appointment.models.ts` y su prueba
- `src/app/pages/agenda/calendario.component.ts/.html/.spec.ts`
- Reglas y documentos vigentes de agenda estrictamente relacionados
- Este paquete SDD

No se modificarán producción, dependencias, rutas, pagos ni módulos ajenos.

## Riesgos y protección

- Histórico múltiple: nunca se recorta al primer perro ni se divide automáticamente; se bloquea la reprogramación completa.
- Servicios múltiples: la regla se aplica a mascotas distintas, no al número de `appointment_items`.
- Migración desactualizada: se elimina toda referencia a `pet_coat_type`, `pet_breed_id` o firmas de cotización anteriores.
- Concurrencia: se conserva el mutex y la validación dentro de la misma transacción.
