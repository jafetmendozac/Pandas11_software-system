# Catálogo de nueve servicios y cinco tamaños — plan aprobado

El usuario aprobó el 2026-11-20 las compatibilidades, la venta individual y los minutos propuestos. Solo entorno local.

1. Conciliar la fila actual de Baño medicado y los IDs nuevos; abortar si hay colisiones o tarifas adicionales intervenidas. Aplicar migración incremental que conserve sus citas mediante `service_name_snapshot`, agregue las nueve prestaciones, sus precios y minutos para cada tamaño, y siete nuevas relaciones permitidas. Mantener RLS y permisos existentes.
2. Mantener los cinco códigos del enum, mostrar los nombres comerciales exactos en mascotas, clientes, tarifas, simulador y catálogo. Exigir tamaño al cotizar una cita nueva en UI y RPC; conservar mascotas históricas sin tamaño sin inventar su clasificación.
3. Autocompletar el mínimo del rango en la agenda, permitir editarlo y mantener la validación del rango en el servidor. Actualizar el catálogo público y la portada a nueve servicios.
4. Actualizar reglas/documentación SDD. Verificar catálogo y tarifas locales, pruebas pertinentes de Angular y SQL/API para citas; compilar. No desplegar ni alterar datos remotos.

Ajuste de presentación solicitado después: simplificar las tarjetas de «Servicios incluidos» a nombre y «Precio final» con rango o importe fijo, manteniendo el campo editable cuando haya rango. Verificar el resultado con una prueba del componente de agenda y compilación.
