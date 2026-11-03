# Patrones y casos de Pandas11

Estos ejemplos proceden de una revisión de código del 22 de octubre de 2026. Son puntos de partida para investigar, no un backlog aprobado ni resultados de pruebas con usuarios. Revalidar archivos, reglas y capacidades antes de aplicarlos.

## Inventario: registrar una entrada

Fuentes: `src/app/pages/productos/productos.component.html`, su componente TypeScript y `src/app/shared/services/inventory.service.ts`.

Observaciones iniciales: formulario de movimiento e historial comparten un diálogo largo; aparecen «versión», «delta positivo o negativo», «solo OWNER» y un filtro «Venta (UUID opcional)».

Propuestas a evaluar:

- Hacer visible el producto y stock actual; separar claramente «Registrar movimiento» de «Consultar historial». Elegir secciones o vistas distintas según el recorrido observado.
- Para entradas, pedir «Unidades que ingresan». Para ajustes, evaluar «Aumentar / Disminuir» y una cantidad positiva, conservando el signo correcto del delta enviado y las validaciones del servidor.
- Mostrar «Propietario» y explicar restricciones solo donde ayuden a decidir.
- Facilitar reconocimiento o selección de la venta mediante información ya accesible. Una búsqueda adicional requiere revisar API y permisos; no inventar un número de venta.
- Si se cambia «Hasta (sin incluir, Lima)» por «Hasta» inclusivo, convertir correctamente al límite exclusivo del día siguiente en Lima y probar los bordes. Cambiar solo la etiqueta alteraría la interpretación de los resultados.

Criterio de aceptación de ejemplo: un usuario autorizado registra 3 unidades, ve el nuevo saldo y el movimiento una sola vez; si se pierde la respuesta, puede resolver el mismo envío sin duplicarlo ni perder sus datos. El código actual conserva `pendingMovement`, `request_id` y `expected_version`: simplificar la presentación no autoriza eliminarlos.

Reglas a contrastar: RN-22 a RN-26; usar la escritura exacta de los IDs de la documentación vigente.

## Ventas: preparar un borrador

Fuentes: `src/app/pages/ventas/ventas.component.html`, su componente TypeScript y `src/app/shared/services/sales.service.ts`.

Observaciones iniciales: una búsqueda alterna entre clientes, citas y productos; la cita seleccionada se resume como «Con cita seleccionada»; varias acciones tienen apariencia similar.

Propuestas a evaluar:

- Mostrar secciones reconocibles para cliente, cita opcional y productos. Mantener visible lo seleccionado y permitir corregirlo sin empezar de nuevo.
- Identificar la cita con fecha y datos disponibles relevantes; usar el formateo local existente.
- Destacar «Guardar borrador» y mostrar un resumen antes de guardar si la API y los datos permiten calcularlo de manera fiable. No sustituir el total definitivo del servidor por una estimación.
- Separar la cancelación del recorrido principal y explicar sus consecuencias cuando el usuario la inicia.

Criterio de aceptación de ejemplo: antes de guardar se reconoce el cliente, la cita elegida y las cantidades; confirmar una venta se distingue del cobro. Cancelar una venta confirmada con productos mantiene una elección explícita entre devolver todo al stock y no devolver, sin opción preseleccionada.

Reglas a contrastar: RN-12, RN-19 a RN-26. Comprobar por separado las capacidades actuales de pagos; no ofrecer cobro de productos basándose solo en la existencia de ventas.

## Mensajes y estados

| Situación | Dirección de mejora | Verificación |
| --- | --- | --- |
| Error de campo | Indicar qué corregir junto al campo, conservando lo ingresado | Corregir un dato sin rellenar todo otra vez |
| Resultado de envío desconocido | Explicar que se está comprobando la operación y ofrecer el reintento permitido | Mantener la misma solicitud; no afirmar que falló definitivamente |
| Búsqueda vacía | Indicar que no hubo coincidencias y permitir limpiar filtros | Diferenciar filtros sin resultados de catálogo vacío |
| Acción restringida | Usar nombres de rol comprensibles y explicar el requisito cuando ayude | Servidor conserva la autorización aunque se fuerce la UI |
| Stock actualizado por otra persona | Explicar que cambió el saldo y guiar la revisión según el estado de la solicitud | No sobrescribir silenciosamente ni descartar un envío pendiente |

## Casos para comprobar la skill

- «Revisa inventario y dame ideas»: producir hallazgos sustentados y propuestas priorizadas; no editar pantallas.
- «Aplica los cambios de etiquetas del plan aprobado»: ajustar la presentación y verificar lo pertinente, sin pedir la misma aprobación otra vez.
- «Haz más sencilla la cancelación y deja marcada la devolución»: señalar la incompatibilidad con la decisión explícita requerida y proponer dos opciones claras sin preselección.
- «Añade un botón para cobrar productos»: reconocer que puede ser funcionalidad nueva; revisar soporte y preparar SDD antes de implementarla.
- «Se bloquea al perder conexión; borra la solicitud pendiente»: investigar el estado incierto y diseñar recuperación que conserve la protección contra duplicados.
