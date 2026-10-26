# Seed local para comprobar el flujo comercial completo

Fecha: 2026-10-25 (America/Lima). Estado: plan aprobado por el usuario mediante «Vamos entonces»; pidió además nombres de personas y artículos coherentes, sin etiquetas como «prueba» en los nombres visibles.

## Contexto

`scripts/seed-local.mjs` y `specs/seed-local.md` cubren identidad, clientes, mascotas, tarifas, personal y tres citas de Fases 0–4. No cargan pagos, productos, inventario, ventas ni caja. La fecha de las citas existentes queda fijada en metadata del OWNER y puede haber pasado; una instalación nueva elige el próximo lunes. El código local y las migraciones ya contienen los contratos comerciales. `Pandas11.sql` describe `payments`, `products`, `sales`, `sale_items`, `inventory_balances`, `inventory_movements`, `sale_payments`, `cash_sessions` y `cash_movements`; no acredita el estado de una base remota.

## Criterios de aceptación

| ID | Criterio | Reglas |
|---|---|---|
| SEED-C01 | Cargar solo en la instancia Supabase local configurada en 55321/55322, con datos ficticios identificables y sin reset, migración, cambio de esquema o credenciales en Angular. Detectar migraciones faltantes y marcadores ajenos antes de escribir. | RN-12, RN-16, RN-19, RN-22 |
| SEED-C02 | Presentar una cita interna completada con precio capturado, un pago de cita registrado y verificado, y una venta mixta que importe sus servicios sin duplicar ese cobro. El flujo debe mostrar saldos separados de servicios y artículos. | RN-09, RN-12, RN-16–RN-19, RN-27 |
| SEED-C03 | Presentar al menos un producto ficticio con mínimo, carga inicial, salida por venta y alerta por stock bajo; una venta de mostrador con artículos confirmados y cobro de producto verificado. | RN-19, RN-22–RN-24, RN-26, RN-27, RN-30 |
| SEED-C04 | Abrir una caja de demostración, registrar ingresos de pagos verificados por medio y cerrarla con contado/diferencia comprobables. Si existe una caja abierta que no pertenece al seed, detenerse sin cerrarla ni modificarla. | RN-16, RN-28, RN-29 |
| SEED-C05 | Repetir el comando sin duplicar cuentas, cobros, ventas, movimientos ni caja. Conservar cambios manuales del usuario; ante estado parcial o incompatible, detenerse con diagnóstico y pasos de recuperación, sin sobrescribir ni borrar. | RN-21, RN-24–RN-29 |
| SEED-C06 | Documentar cuentas, contraseña demo, navegación por pantallas, importes ficticios, orden de operaciones y resultados esperados. Comprobar por API/RLS los datos sembrados, saldos, stock y caja; registrar pruebas y límites. | RN-13, RN-16, RN-19, RN-22–RN-30 |

No incluye autorreserva, adelantos online, devoluciones, facturación, transporte automático, datos reales ni conexión remota. Los precios, cantidades y fechas son exclusivamente de prueba.
