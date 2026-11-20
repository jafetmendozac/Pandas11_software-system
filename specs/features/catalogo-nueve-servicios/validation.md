# Catálogo de nueve servicios — validación local

Fecha: 2026-11-20 (America/Lima). Implementado solo en Supabase local y Angular; sin despliegue remoto.

| Criterio | Resultado |
|---|---|
| CNS-01/02 (RN-43/RN-45) | Nueve servicios activos: tres `MAIN` y seis `ADD_ON`. Dos baños medicados independientes, cada uno solo compatible con Baño estético. Cepillado y Corte de uñas compatibles con los tres principales y vendibles solos. Doce pares permitidos en total. Siete items históricos siguen con nombre guardado y servicio retirado nulo. |
| CNS-03 (RN-04/05/44) | Cuarenta y cinco tarifas por tamaño para los nueve servicios. Cepillado: S/ 5/5/10/15/20 y 10/10/15/20/25 minutos; Corte de uñas: S/ 5 y 10 minutos en todos. Ambas variantes medicadas: S/ 5–15 y 15 minutos. |
| CNS-04 (RN-11/12) | Las pantallas de mascota, cliente, tarifas, simulador y catálogo muestran las cinco etiquetas aprobadas. El enum PostgreSQL conserva sus cinco códigos; la RPC de citas rechaza mascotas sin tamaño, comprobado por API. |
| CNS-05 (RN-12/44) | La agenda autocompleta el mínimo de la cotización por tamaño, deja editar el rango y conserva validación final en servidor. Prueba Angular verifica autocompletado y bloqueo sin tamaño. |
| CNS-06 (RN-12/44) | «Servicios incluidos» muestra nombre y «Precio final» con rango editable o importe fijo; ya no repite duración, importe ni insignia dentro de cada tarjeta. Se conservan el ícono, la distribución y el estilo original de las tarjetas por corrección del usuario. Prueba focalizada de agenda: 30/30; compilación correcta tras restaurar el diseño. |

Comprobaciones suficientes ejecutadas: `npm test -- --watch=false --browsers=ChromeHeadless` **217/217**; tras limpiar la cotización anterior, repetición focalizada de agenda **29/29**; `npm run build` correcto; `node scripts/test-appointments-api.mjs` **94** comprobaciones (incluye `supabase test db` completo); `node scripts/test-local-seed.mjs` **40** comprobaciones. Consulta PostgreSQL local confirmó 9 servicios, 45 tarifas, 12 relaciones y 7 items históricos preservados. `git diff --check` correcto.

El primer intento de la suite API detectó un fixture SQL antiguo que agendaba una mascota sin tamaño; se le asignó `TOY` y la repetición pasó. La compilación conserva advertencias preexistentes de imports no usados, presupuesto CSS de inicio y `flatpickr` CommonJS. No se realizó recorrido visual manual. No se inspeccionó ni modificó el esquema remoto; no se hicieron commits ni pushes.
