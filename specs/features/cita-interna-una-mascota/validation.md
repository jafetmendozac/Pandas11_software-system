# Validación — Cita interna con una sola mascota

Fecha: 2026-11-13. Estado: implementado y validado localmente.

| Criterio | Estado | Evidencia |
|---|---|---|
| CUM-A01 | Cumple | Seleccionar cliente crea una sola tarjeta; la prueba Angular recorre mascota, multiselección y guardado de dos servicios. |
| CUM-A02 | Cumple | No existe acción para añadir/quitar tarjetas completas; `addItem` impide una segunda y cambiar cliente reinicia exactamente una. |
| CUM-A03 | Cumple | `appointmentInput` y `save_internal_appointment` exigen un único `pet_id`; pgTAP y API comprueban rollback sin cabecera parcial. |
| CUM-A04 | Cumple | API guarda una mascota con baño/corte y un segundo servicio consecutivo, conservando snapshots, etapas y total por item. |
| CUM-A05 | Cumple | Fixture API privilegiado con dos mascotas permanece consultable; reprogramarlo devuelve `22023` y la comparación completa antes/después no cambia. Angular lo presenta no editable y permite acciones de estado. |
| CUM-A06 | Cumple | Migración `20261113020000` aplicada localmente con `quote_service(service_id, pet_size)` y sin referencias a raza/pelaje. |
| CUM-A07 | Cumple | Suites SQL/API/Angular, seed, tipos, lint, build y diff correctos. |

## Ejecuciones

| Comprobación | Resultado |
|---|---|
| `supabase migration up --local` | `20261113020000_single_pet_internal_appointments.sql` aplicada sin reset |
| `supabase test db` | 372/372 correctas |
| API de agenda | 86/86 comprobaciones correctas |
| Angular enfocado | 30/30 correctas |
| Angular completo | 208/208 correctas |
| Seed local | Carga correcta y 41/41 comprobaciones |
| TypeScript de pruebas | Correcto |
| `supabase db lint --local` | Sin errores; advertencia preexistente en `contact_queue` sobre volatilidad |
| `npm run build` | Correcto; advertencias previas de RouterLink sin uso, presupuesto CSS de inicio y dependencia CommonJS de Flatpickr |

## Protección de datos

No se cambió la estructura de `Pandas11.sql`: varios items siguen representando varios servicios de una misma mascota. La migración no elimina ni convierte filas existentes. La cita sintética histórica `relevo-dos-mascotas` se conservó durante el seed y los históricos múltiples quedan fuera de la reprogramación.

No se inspeccionó ni modificó el esquema remoto.
