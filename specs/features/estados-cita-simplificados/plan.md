# Plan — Estados de cita simplificados

La propuesta de tres estados y pago independiente fue aceptada por el usuario. El esquema local conserva el enum y los datos históricos; se requiere una migración incremental para permitir CONFIRMED → COMPLETED con los permisos y controles existentes. No se modifica producción.

1. Revisar las dependencias de estado en agenda, pagos y ocupación y adaptar la transición transaccional sin pasos intermedios ni pérdida de historial.
2. Agrupar filtros de agenda para incluir los estados históricos correspondientes y conservar paginación completa.
3. Presentar las acciones Atendida y Cancelada, con motivo obligatorio, y actualizar los textos y estados de accesibilidad.
4. Conservar el cálculo de saldo real, distinguiendo pagos parciales y devoluciones cuando corresponda.
5. Probar transiciones, permisos, filtros históricos y pagos; compilar y documentar resultados.
