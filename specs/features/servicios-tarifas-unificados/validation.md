# Validación — Servicios y tarifas unificados

Fecha: 2026-11-13. Estado: implementado y validado localmente.

| Criterio | Estado | Evidencia |
|---|---|---|
| STU-A01 | Cumple | `/servicios-y-tarifas` presenta catálogo, acción «Ver tarifas», editor con los cinco tamaños y simulador; pruebas Angular del editor y página relacionada incluidas en la suite completa. |
| STU-A02 | Cumple | El editor crea/actualiza por `(service_id, pet_size)` y permite volver al precio base; pruebas unitarias, pgTAP y 44 comprobaciones API verifican persistencia y prioridad `SIZE → BASE`. |
| STU-A03 | Cumple | `service_prices.pet_size` es obligatorio y `pet_breed_id` fue retirado; catálogo, simulador y agenda cotizan sin raza. Las razas permanecen en la ficha de mascota. |
| STU-A04 | Cumple | Sidebar muestra una sola entrada «Servicios y tarifas» en `/servicios-y-tarifas`; `/servicios` y `/tarifas` redirigen a la ruta unificada. La configuración de rutas y navegación se compiló y pasó la suite Angular. |
| STU-A05 | Cumple | Las 370 pruebas pgTAP y las 44 comprobaciones API cubren lectura, gestión, catálogo de cliente, ocultos/inactivos, rechazo anónimo y el bloqueo de la firma histórica con raza. |
| STU-A06 | Cumple | Migración `20261113010000`, SQL raíz, seed, scripts, tipos, pruebas y documentación quedaron alineados; build de producción correcto. |

## Ejecuciones

| Comprobación | Resultado |
|---|---|
| `supabase migration list --local` | Migración `20261113010000` aplicada localmente |
| `supabase test db` | 370/370 correctas |
| `supabase db lint --local` | Sin errores; advertencia preexistente en `contact_queue` sobre volatilidad |
| `npm run seed:local` + verificación | Seed correcto; 41/41 comprobaciones |
| API servicios y tarifas | 44/44 comprobaciones correctas |
| TypeScript de pruebas | Correcto |
| Angular | 205/205 pruebas correctas |
| `npm run build` | Correcto; conserva advertencias previas de RouterLink sin uso, presupuesto CSS de inicio y dependencia CommonJS de Flatpickr |

No se inspeccionó ni modificó el esquema remoto. La migración se detiene si otro entorno contiene tarifas por raza, para exigir conciliación explícita y evitar pérdida silenciosa de precios.
