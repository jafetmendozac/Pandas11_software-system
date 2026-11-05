# Validación — corrección de razas y transporte

Fecha: 2026-11-05. Alcance: Supabase local y árbol de trabajo actual.

| Comprobación | Resultado |
|---|---|
| `supabase migration up --local` | Aplicadas 20261104000000, 20261104010000 y 20261104020000 |
| `supabase test db` | 367/367 correctas tras las tres migraciones |
| `supabase db lint --local` | Sin errores; advertencia previa en `contact_queue` sobre volatilidad |
| API servicios/precios | 50/50 correctas |
| API clientes/mascotas | 42/42 correctas |
| API agenda | 82/82 correctas; se repitió aisladamente tras un choque con otra suite SQL concurrente |
| Seed local y verificación | Se conservaron las citas sintéticas; 41/41 comprobaciones correctas |
| TypeScript app/spec | Correcto |
| Angular afectado | 19/19 pruebas de razas, catálogo, tarifas, simulador y agenda correctas |
| `npm run build` | Correcto; advertencia previa de presupuesto CSS en inicio |
| `git diff --check`, sintaxis Node | Correctos |

La suite Angular general encontró 11 fallos fuera de esta corrección: diez tests de guard con mock sin `isSessionValidated` y uno de paginación de PersonalizedTable. El alcance revisado pasó.

La base local tenía una mascota con raza histórica, ahora vinculada a UUID (cero razas históricas sin correspondencia). Conserva los campos anteriores; las tarifas antiguas por pelaje no se convierten automáticamente a una raza. No se inspeccionó ni cambió ninguna base remota.
