# Plan — Actividad 5.5

Fecha: 2026-10-31 (America/Lima). Estado: **aprobado mediante «Vamos» e implementado localmente**. Requisitos: [requirements.md](requirements.md). Validación: [validation.md](validation.md).

## Impacto de datos y arquitectura

`Pandas11.sql` define `products`, `inventory_balances`, `inventory_movements`, `sales`, `payments` y las tablas de citas/roles de las pantallas afectadas. El cambio es de presentación y de traducción del signo de `delta` en el formulario Angular; se conserva el contrato `InventoryInput` y la RPC actual. No se modifican tablas, columnas, enums, RLS, funciones ni migraciones. El esquema remoto sigue sin verificarse y no es necesario para este ajuste local. La visibilidad de botones no sustituye las comprobaciones de servidor existentes.

## Archivos y cambios exactos

1. `src/app/shared/layout/app-sidebar/app-sidebar.component.ts/.html` y sus pruebas: filtrar los enlaces de ejemplo y no renderizar la sección «Ejemplos», conservando enlaces operativos y estados de navegación. No borrar archivos o rutas de plantilla.
2. `src/app/shared/layout/app-header/app-header.component.ts/.html` y pruebas: retirar búsqueda/atajo sin resultado, hacer visible el selector de rol dentro del menú móvil, dar nombres españoles y `aria-expanded`/`aria-controls` a sus botones, y conservar el cambio de tema y el menú de usuario.
3. `src/app/pages/productos/productos.component.ts/.html` y pruebas: presentar saldo actual, ocultar versión técnica, separar historial en sección plegable y cambiar la entrada de ajustes a dirección más cantidad positiva. Construir el mismo `InventoryInput` firmado antes de llamar al servicio; si hay `pendingMovement`, conservar exactamente ese objeto y bloquear edición/cierre hasta resolverlo.
4. `src/app/pages/reportes/reportes.component.ts/.html` y pruebas pertinentes: derivar el estado «sin actividad» de los agregados recibidos y explicarlo sin ocultar tablas ni descarga; mejorar foco y lectura móvil/oscuro/RTL en los controles. Mantener el alcance agregado y el permiso de RN-40–RN-42.
5. Registrar resultados en `validation.md` y actualizar roadmap, matriz y anexo de Actividad 5 con el estado real. No alterar diagnósticos históricos.

## Validación

- Revisar `git status` antes y después; preservar cambios del usuario.
- Probar menú por rol, selector móvil, ajustes positivos/negativos, rechazo de fracciones, reintento idempotente, informe vacío y restricción de reportes.
- Ejecutar `npx ngc`, `npx tsc` de pruebas, `npm test` y `npm run build`. No se necesitan pruebas SQL nuevas: el contrato y las migraciones no cambian.
- Recorrer las rutas operativas accesibles con datos sintéticos si el navegador local está disponible. Registrar por separado comprobación DOM, inspección visual y aceptación del usuario; no confundirlas.

## Límites

No se crean nuevos flujos de búsqueda, stock, cobro o exportación. No se cambian dependencias, SQL, producción, cuentas reales, commits ni pushes. Si aparecen problemas fuera del alcance aprobado, se documentan para decidir otra intervención.
