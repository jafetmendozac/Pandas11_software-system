# Servicios principales y adicionales — requisitos aprobados

Estado: aprobado por el usuario el 2026-11-19 (America/Lima), incluidos rangos manuales, duraciones iniciales y borrado físico de servicios antiguos preservando históricos.

## Objetivo

Presentar tres servicios principales: Baño estético, Baño y corte, Corte estético. Baño medicado, Corte higiénico y Desparasitación se ofrecen como adicionales de una atención. Los importes están en PEN. La implementación local preserva las citas y ventas anteriores.

## Tarifas comunicadas por el usuario

| Prestación | Toy | Pequeño | Mediano | Mediano grande / grande | Grande–extra / extra grande |
|---|---:|---:|---:|---:|---:|
| Baño estético | 25 | 30 | 35 | 40–45 (mediano grande) | 50–60 (grande–extra) |
| Baño y corte | 45 | 45–50 | 50 | 55–60 (mediano grande) | 60–75 (grande–extra) |
| Corte estético | 25 | 30 | 35 | 40 (grande) | 50 (extra grande) |

| Adicional | Tarifa comunicada | Relación |
|---|---:|---|
| Baño medicado | +5–15 | Sobre Baño estético |
| Corte higiénico | +5–20 | Sobre Baño estético |
| Desparasitación | 5–30 | Adicional; base y condiciones por aclarar |

Los rangos son límites comerciales; OWNER/ADMIN eligen el importe final al preparar la cita. `LARGE` corresponde a «mediano grande» en los baños y `EXTRA_LARGE` a «grande–extra»; en Corte estético se muestran como Grande y Extra grande.

## Duraciones iniciales aprobadas

| Servicio | Toy | Pequeño | Mediano | Grande | Extra grande |
|---|---:|---:|---:|---:|---:|
| Baño estético | 45 min | 60 min | 75 min | 90 min | 120 min |
| Baño y corte | 90 min | 105 min | 120 min | 150 min | 180 min |
| Corte estético | 45 min | 60 min | 75 min | 90 min | 120 min |

Baño medicado añade 15 min; Corte higiénico añade 20 min y Desparasitación 15 min, también cuando se venden solas. Corte higiénico solo usa S/ 5–20, aprobado expresamente junto con el plan. Son valores iniciales configurables.

## Requisitos funcionales aprobados

| ID | Requisito y aceptación | Reglas |
|---|---|---|
| SPA-01 | Catálogo y agenda distinguen principal de adicional; una atención nueva elige un principal con adicionales compatibles, o Corte higiénico/Desparasitación solos. No se cambia el significado de citas históricas. | RN-03, RN-14, RN-19, RN-43 |
| SPA-02 | La cotización usa el tamaño de la mascota y muestra los importes fijos o límites del rango aplicable. OWNER/ADMIN seleccionan el precio final dentro del rango; el servidor valida y guarda importes exactos en PEN. | RN-04, RN-05, RN-11, RN-12, RN-13, RN-44 |
| SPA-03 | Baño medicado solo acompaña a Baño estético. Corte higiénico acompaña a Baño estético o se vende solo. Desparasitación acompaña a cualquiera de los principales o se vende sola. Ninguno se añade a Baño y corte salvo Desparasitación. | RN-07, RN-12, RN-43 |
| SPA-04 | Cada prestación y adicional ocupa sus minutos iniciales aprobados; el corte exige especialista. El total de minutos es la suma y las etapas siguen consecutivas. | RN-01, RN-03, RN-04, RN-05, RN-07, RN-10, RN-15, RN-44 |
| SPA-05 | Una venta derivada de cita conserva el detalle y precio guardado del principal y cada adicional, sin recalcular históricos ni duplicar cobros. | RN-09, RN-12, RN-18, RN-19, RN-45 |
| SPA-06 | OWNER/ADMIN gestionan catálogo, rangos y selección final; STAFF consulta; CLIENT ve solo oferta activa y visible según RLS. | RN-12, RN-13 |

## Decisión sobre servicios antiguos

Se eliminan físicamente los servicios obsoletos del seed (301–304, 306–309, 311–312) y los dos servicios ajenos «Servicio Duplex» y «Servicio Express» aprobados expresamente para este alcance. Se conservan los IDs 305 (Baño estético) y 310 (Desparasitación) si sus filas coinciden con el seed esperado. No se borran citas ni ventas históricas: primero se guardan nombre, precio y duración en sus líneas; si un dato no puede preservarse, la migración se detiene. La desparasitación comercial es distinta del antecedente en la ficha.

## Situación previa comprobada

Antes de esta implementación, `Pandas11.sql` definía `services` y `service_prices` con un precio exacto y duración positiva por tamaño; `appointment_items` guardaba un servicio y precio por fila y `sale_items` importaba esos items. El seed local tenía ocho servicios demo y dos servicios ajenos conservados por decisión anterior. El esquema remoto no se ha verificado.
