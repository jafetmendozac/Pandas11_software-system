# Validación — consultas del portal de cliente

Estado: implementación local completada el 2026-11-02 (America/Lima); sin cambios de base ni despliegue remoto.

| Criterio | Resultado |
|---|---|
| PC-01 | Perfil presenta tarjetas directas a `/mis-datos` y `/catalogo` arriba de la ficha para toda cuenta autenticada, tanto en `/profile` como en `/mi-perfil` porque usan el mismo componente. Se retiró la condición `panel.access` que las ocultaba al personal; no cambió el acceso a los datos de cada ruta. |
| PC-02 | `/mis-datos` consulta `ClientesService.own` y usa el ID de esa ficha para obtener mascotas mediante `search_pets` sujeto a RLS. Presenta ficha, tarjetas de mascotas, antecedentes visibles y vacunas; no llama a notas internas ni ofrece edición. Estados de carga, error, sin ficha y sin mascotas. |
| PC-03 | `/catalogo` muestra solo servicios activos/visibles; selecciona mascota propia para completar tamaño/pelaje y permite modificarlos. `TarifasService.quote` calcula en servidor. Descarta resultados anteriores al cambiar entradas y aclara que no reserva ni incluye transporte. |
| PC-04 | Navegación de texto entre las tres rutas, tarjetas adaptables, controles con etiquetas/foco visible y variantes claro/oscuro. Compilación de plantillas y pruebas DOM correctas. Inspección visual manual pendiente. |
| PC-05 | Sin migraciones, dependencias nuevas, cambios RLS ni datos reales. Las consultas existentes siguen bajo políticas del servidor. |

## Pruebas

- `npx ngc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit`: correctos.
- Pruebas focalizadas de Perfil, Mis datos y Catálogo: 8/8; incluyen navegación directa visible para una cuenta de panel, consulta vinculada, ausencia de vínculo, cotización con mascota y descarte de resultado obsoleto.
- Suite Angular completa: 159/159.
- `npm run build`: correcto; advertencia preexistente de presupuesto CSS en `inicio.component.css` (1,46 kB por encima del aviso).
- `git diff --check`: correcto.

Karma terminó con código 134 dentro del aislamiento antes de mostrar diagnósticos; las ejecuciones fuera del aislamiento pasaron. Un intento de suite completa perdió ChromeHeadless por inactividad, luego pasó al repetirlo. No hay herramienta de navegador disponible para revisar visualmente móvil, oscuro o teclado con sesión real; tampoco se ejecutaron pruebas SQL/API, porque no se cambió el contrato de base ni RLS. La experiencia debe comprobarse manualmente con una cuenta CLIENT sintética vinculada y otra sin vínculo.
