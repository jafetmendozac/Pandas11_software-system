# Catálogo de nueve servicios y cinco tamaños — requisitos aprobados

Estado: aprobado por el usuario el 2026-11-20. Amplía el catálogo de tres principales aprobado el 2026-11-19; no cambia los snapshots de citas y ventas anteriores.

| ID | Criterio de aceptación | Reglas |
|---|---|---|
| CNS-01 | Hay nueve servicios activos: Baño estético, Corte estético, Corte higiénico, Baño y corte, Baño medicado para parásitos externos, Baño medicado para piel delicada, Cepillado, Corte de uñas y Desparasitación. Los principales siguen siendo los tres aprobados. | RN-43, RN-45 |
| CNS-02 | Ambos baños medicados cuestan S/ 5–15 adicionales a Baño estético y no se venden solos. Corte higiénico solo acompaña a Baño estético o se vende solo. Desparasitación, Cepillado y Corte de uñas acompañan a cualquiera de los principales o se venden solos. | RN-43, RN-44 |
| CNS-03 | Cepillado cuesta S/ 5/5/10/15/20 y dura 10/10/15/20/25 min por tamaño. Corte de uñas cuesta S/ 5 y dura 10 min en los cinco tamaños. Se conservan las demás tarifas y duraciones aprobadas. | RN-04, RN-05, RN-11, RN-12, RN-44 |
| CNS-04 | Las cinco etiquetas visibles, en este orden, son Toy, Pequeño, Mediano, Mediano grande y Grande - extra. Corresponden respectivamente a TOY, SMALL, MEDIUM, LARGE y EXTRA_LARGE, sin cambiar el enum ni recategorizar mascotas. Una cita nueva exige que la mascota tenga tamaño. | RN-11, RN-12, RN-44 |
| CNS-05 | Al elegir mascota y servicio en cita, el precio se autocompleta con el mínimo de su tarifa por tamaño; recepción puede modificarlo dentro del rango y el servidor valida el valor final. | RN-12, RN-44 |
| CNS-06 | En «Servicios incluidos», cada tarjeta muestra solo el nombre y «Precio final (S/ mínimo–máximo)» si hay rango, con el campo editable debajo; para precio fijo muestra «Precio final (S/ importe)». No repite duración, importe ni estado del precio dentro de la tarjeta. | RN-12, RN-44 |

`Pandas11.sql` ya contiene el enum de cinco valores, `services`, `service_prices`, compatibilidad y snapshots. El catálogo local previo tenía tres principales y tres adicionales; la migración incremental agrega tres filas, divide el baño medicado en dos prestaciones y añade tarifas por tamaño a los adicionales. El esquema remoto no se inspeccionó ni se modifica.
