# Desparasitación en la ficha de mascotas — validación

Estado: implementado y validado localmente el 2026-11-13. Sin cambios remotos.

| Criterio | Estado | Evidencia pendiente |
|---|---|
| DM-A01 | Cumplido localmente | API: creación, corrección y rechazo de próxima fecha anterior; pgTAP rechaza fecha inválida; formulario y servicio usan los tres campos acordados |
| DM-A02 | Cumplido localmente | Prueba Angular de `/mis-datos` y API con dos clientes: solo se leen registros propios, sin notas internas |
| DM-A03 | Cumplido localmente | API verifica OWNER/ADMIN, STAFF sin escritura, aislamiento CLIENT y lectura de archivo; las políticas RLS y grants están en la migración |
| DM-A04 | Cumplido localmente | Preflight `2:2`: dos filas, ambas fixtures DEMO conocidos. Migración aplicada; comprobación final: tabla de vacunas ausente, tabla nueva presente, dos filas DEMO nuevas, cero permisos de vacunas y dos de desparasitación |
| DM-A05 | Cumplido por alcance del cambio | La migración y el servicio solo escriben `pet_dewormings`; no llaman a citas, ventas, inventario ni pagos |

## Ejecuciones

- `supabase migration up --local`: correcta, sin reset; la migración incluye guardia que detiene el borrado ante vacunas ajenas a los dos fixtures DEMO.
- `node scripts/test-clients-pets-api.mjs`: 42/42 comprobaciones correctas.
- `npm run seed:local` y `node scripts/test-local-seed.mjs`: correctos; 41/41 comprobaciones del seed.
- `npm test -- --watch=false --browsers=ChromeHeadless --include=...` para antecedentes, ficha propia y detalle de mascota: 8/8 correctas.
- Suite Angular completa tras corregir el aislamiento y el desplazamiento del formulario compartido: 201/201 correctas. El modal mantiene los campos en un área desplazable y las acciones fuera de ella.
- `npx tsc -p tsconfig.spec.json --noEmit` y `npm run build`: correctos. El build conserva advertencias de RouterLink no usado, presupuesto CSS de inicio y Flatpickr CommonJS ajenas al cambio.
- `supabase db lint --local`: comando correcto; advertencia previa de volatilidad en `public.contact_queue`.
- `supabase test db`: 370/370 correctas en 13 archivos. `contact_queue.test.sql` se aisló de los fixtures DEMO filtrando por su cliente sintético; sus 26 casos pasan.
- `git diff --check`: correcto.

No hubo inspección visual manual ni despliegue remoto. La migración histórica de Fase 1 conserva la definición original de vacunas como parte del historial, pero la migración nueva la elimina del esquema local final. Los cambios pendientes del usuario en la agenda no se tocaron.
