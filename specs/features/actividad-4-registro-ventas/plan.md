# Plan — Registro visual de ventas

Fecha: 2026-10-22. Estado: aprobado mediante «Bamos con la implementación» el 2026-10-22; implementación local realizada; resultados y pendientes en validation.md.

## Propuesta técnica

1. Revisar permisos/roles del servicio de autorización y los selectores existentes de clientes/citas. Reutilizar consultas paginadas autorizadas. No usar consultas privilegiadas ni relajar RLS para llenar selectores; si falta contrato de consulta que requiera SQL, presentar ese cambio antes de ejecutarlo.
2. Crear componentes standalone bajo `src/app/pages/ventas/` y `src/app/pages/productos/`, siguiendo pagos y los componentes compartidos de tarjetas, breadcrumb y modal. Añadir rutas lazy y navegación condicionadas por permiso y rol activo OWNER/ADMIN. La autorización del servidor permanece obligatoria.
3. Conectar `SalesService` y `sale.models.ts`: listado/detalle, creación con selección paginada, confirmación restringida y anulación con motivo/versionado. Reutilizar validación y formato decimal existentes, sin usar coma flotante para sumar dinero. Mostrar cobros confirmados de cita por separado del total de venta.
4. Conectar catálogo simple por `saveProduct` y `products`; validar cantidades enteras, nombre/SKU y precio. Tras guardar, recargar datos persistidos. No ofrecer eliminación, existencias o modificación de líneas persistidas.
5. Conservar UUID/payload ante fallos de red ambiguos; permitir reintentar exactamente la creación enviada antes de modificarla. Manejar expiración de sesión, errores de permisos, conflictos, resultados vacíos y respuestas obsoletas; bloquear acciones durante envío y restaurar foco al cerrar modales.
6. Enlazar pagos de cita con el query param existente y permiso independiente. No modificar el registro/verificación de pagos ni inventar saldo cobrado de productos.
7. Ejecutar validación RV-01–RV-08 y documentar resultados. Actualizar matriz, anexo comercial, roadmap y estado de documentos de 4.1 para reflejar primera entrega de 4.2, manteniendo explícito lo pendiente.

## Modelo y seguridad

Referencia: `Pandas11.sql`, migraciones `20261021090000`, `20261021093000`, `20261021100000` y servicio Angular. Se conservan FK de cliente/cita/producto, captura de precio, unicidad por cita activa, estados, versión e idempotencia. RLS exige rol OWNER/ADMIN además de permisos; las RPC realizan escrituras y restricciones de confirmación/anulación. `payments` conserva su FK obligatoria a cita.

No se propone cambio de esquema ni migración para esta entrega. No se ejecutará el SQL raíz, reset o despliegue remoto. Sin nuevas dependencias, commits o pushes. Los cambios de carpetas se limitan a las dos páginas nuevas siguiendo la estructura actual; su creación forma parte del alcance a aprobar.

## Validación prevista

- Pruebas Angular de autorización/rutas, creación y reintento, productos no confirmables, cobros por referencia, anulación por rol, conflictos, errores y respuestas fuera de orden. Reutilizar pruebas de servicio existentes donde las haya y añadir cobertura pertinente de las operaciones conectadas.
- Tipos app/spec, suite Angular disponible y build de producción. Registrar por separado la advertencia previa de presupuesto CSS de inicio si persiste.
- SQL/RLS local: suite existente de ventas y regresión disponible con datos sintéticos; prueba API de las RPC conectadas para cubrir el límite PostgREST no acreditado por 4.1. No reset ni datos reales; limpiar únicamente fixtures propios.
- Recorrido local OWNER/ADMIN y acceso denegado STAFF/CLIENT; catálogo, cita completada, borrador mixto, confirmación de servicios, enlace a pagos y anulación. Revisar escritorio/móvil, oscuro/RTL y foco. Si una herramienta o entorno impide una verificación, registrar la limitación sin declararla aprobada.

El resultado no cerrará cobro de mostrador ni inventario. Requisitos y validación en [requirements.md](requirements.md) y [validation.md](validation.md).

Durante la validación se corrigió una carrera de restauración de sesión en AuthorizationService que impedía la recarga directa comercial. Se reconsulta una carga invalidada solo si existe identidad vigente, conservando la denegación tras salida; se añadió prueba de regresión. Sin cambio de permisos, SQL ni alcance de pagos.
