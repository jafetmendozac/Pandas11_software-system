# Estados de cita simplificados

Decisión del usuario: mostrar Programada, Atendida y Cancelada, y mantener el pago independiente. La inasistencia se registra como motivo de cancelación. La gestión conserva RN-13 y el historial de RN-14.

- CONFIRMED e IN_PROGRESS históricos se presentan como Programada; COMPLETED como Atendida; CANCELLED y NO_SHOW históricos como Cancelada, conservando su estado almacenado.
- Una cita CONFIRMED puede pasar directamente a COMPLETED sin modificar citas antiguas. El cambio requiere permiso de estado y no puede adelantarse al inicio programado.
- Una cita CONFIRMED puede cancelarse con motivo obligatorio; «No asistió» es un motivo posible, no un estado adicional de interfaz.
- IN_PROGRESS histórico puede completarse, preservando sus datos. Los estados finales no se reabren.
- Los filtros deben abarcar todos los estados internos correspondientes, sin omitir resultados ni truncar paginación. Pagos parciales o devoluciones no deben presentarse como pagados sin saldo realmente cubierto.
