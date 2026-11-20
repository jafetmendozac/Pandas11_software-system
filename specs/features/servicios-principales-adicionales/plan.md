# Servicios principales y adicionales — plan técnico aprobado

Estado: aprobado por el usuario el 2026-11-19, tras confirmar las aclaraciones de [requirements.md](requirements.md). Solo entorno local; despliegue remoto fuera del alcance.

1. Registrar correspondencia de tamaños, duraciones y compatibilidad aprobadas. Actualizar RN-04/RN-05/RN-11/RN-12 con trazabilidad de esta decisión.
2. Hacer una migración incremental de catálogo y tarifas: identificar `MAIN`/`ADD_ON`, relación permitida con principales y límites mínimo/máximo del precio en PEN. Conservar precio fijo como mínimo=máximo; validar mínimo ≤ máximo y dos decimales. Añadir snapshots de nombre a items de cita, desacoplar referencias históricas y eliminar físicamente servicios obsoletos solo si la conciliación de IDs y nombres es exacta. Mantener `Pandas11.sql`, migraciones y RLS coherentes. No ejecutar el SQL raíz ni migraciones en producción.
3. Adaptar la cotización autoritativa para devolver rango y exigir precio final explícito cuando mínimo≠máximo; validar en servidor la selección y permisos. Guardar snapshots del principal y cada adicional. No recalcular ni modificar items históricos.
4. Adaptar `/servicios-y-tarifas`, simulador, catálogo propio y formulario de agenda: principal primero, adicionales compatibles después, desglose y total PEN, duración/etapas y trabajador habilitado. Mantener búsqueda, paginación, estados y controles de acceso existentes.
5. Revisar el flujo de ventas desde cita para mostrar cada línea y su snapshot sin alterar las reglas de cobro. Revisar la portada pública para que el texto comercial coincida con la oferta aprobada.
6. Conciliar el seed local con el catálogo nuevo. Eliminar los servicios obsoletos del seed y «Servicio Duplex»/«Servicio Express» después de conservar sus referencias históricas; abortar ante filas desconocidas o colisiones. El seed repetido no debe recrearlos.
7. Validar SQL/RLS y API con datos sintéticos: límites de rangos, sumas exactas, combinaciones permitidas, habilidad, duración, citas existentes, venta derivada, visibilidad por rol y seed repetible. Ejecutar pruebas Angular pertinentes, tipos y build; registrar resultados y limitaciones en `validation.md`.

## Diferencias y riesgos previos

- El esquema anterior exigía `price` y `duration_minutes` únicos por tamaño; no representaba rangos ni relaciones principal–adicional. El cambio de modelo fue aprobado.
- Las citas admitían varios servicios consecutivos pero no identificaban un principal; su RPC cotizaba cada servicio de forma independiente. Una relación meramente visual habría sido insuficiente.
- `sale_items` toma cada `appointment_item`; el desglose depende de conservar un item por prestación cobrada.
- Los valores previos del seed eran fixtures sintéticos. Las duraciones iniciales y la correspondencia de tamaños fueron aprobadas por el usuario para este catálogo.
- `Pandas11.sql` es referencia local; no acredita el esquema desplegado.

## Aprobación

El usuario aprobó las duraciones, Corte higiénico solo a S/ 5–20 y el borrado físico de los antiguos, incluidos Duplex y Express, mediante «Vamos con eso entonces».
