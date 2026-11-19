# Validación — ajuste del fin previsto

Implementado en Angular y Supabase local el 2026-11-18; sin despliegue remoto. La migración `20261118000000_adjust_appointment_planned_end.sql` se validó primero con rollback y luego se aplicó y registró en `supabase_migrations.schema_migrations` de la instancia local. No se ejecutó en producción.

## Evidencia focalizada

- RN-04/RN-05/RN-12/RN-15: la prueba SQL sintética `scripts/test-appointment-planned-end.sql` acorta y alarga el último fin, comprueba que precio y duración cotizada se conservan y revierte todo al finalizar. Correcta.
- RN-01/RN-03/RN-13: la misma prueba rechaza extensión fuera del turno, cruce con otra reserva, versión vencida y escritura de STAFF; comprueba que el rechazo no persiste. Correcta.
- RN-06/RN-09/RN-18: la RPC solo modifica el intervalo planificado y la versión; no toca pagos ni registra fin real. Revisado en SQL.
- `npx ngc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit`: correctos; dos advertencias de imports no usados en páginas ajenas.
- `npm run build -- --configuration development`: correcto fuera del sandbox. Dentro del sandbox terminó con código 134 sin diagnóstico.
- Prueba Angular de calendario: 23/23 correctas en ChromeHeadless, incluido el ajuste del fin previsto y la conservación de cambios sin guardar. Los tres fallos de la ejecución anterior se debían a expectativas antiguas de texto y consultas del filtro, y al nombre accesible anterior del selector de servicios; se actualizaron las pruebas al comportamiento vigente y se repitió la suite focalizada.
- `git diff --check`: correcto.

No se hizo recorrido visual manual ni comparación del esquema remoto.

## Creación con fin previsto elegido

El usuario mostró que el control faltaba en «Crear cita» y aprobó añadirlo ahí. El formulario muestra «Hora prevista de término» después de seleccionar un servicio; el valor inicial es el calculado y el resumen actualiza la duración prevista al cambiarlo. Se conservan precio y duración cotizada.

Se aplicaron y registraron en Supabase local dos migraciones incrementales: `20261118010000_create_appointment_with_planned_end.sql` y `20261118020000_create_with_direct_planned_end.sql`. La segunda hace que la reserva se valide directamente con el intervalo elegido. Esto permite acortar una cita incluso si el tramo sobrante ya pertenece a otra reserva; la primera versión de la operación podía rechazar ese caso. Cada migración se comprobó primero con rollback. No se ejecutaron en una base remota.

- `scripts/test-appointment-create-end.sql`: correcto con datos sintéticos y rollback. Comprueba una cita acortada cuyo tiempo cotizado se cruzaría con otra reserva, preservación del precio/duración cotizada y rechazo atómico de un conflicto real.
- `scripts/test-appointment-planned-end.sql`: correcto después de las migraciones nuevas; el ajuste de citas existentes sigue funcionando.
- Calendario Angular en ChromeHeadless: 24/24 correctas. La prueba nueva comprueba que el campo está visible en el formulario de creación, el payload de duración prevista y la conservación del formulario tras un rechazo.
- Tipos de aplicación y pruebas, compilación de desarrollo y `git diff --check`: correctos. La compilación solo informa dos imports no usados en páginas ajenas.

No se verificó manualmente la apariencia en el navegador con una cuenta real o sintética iniciada.
