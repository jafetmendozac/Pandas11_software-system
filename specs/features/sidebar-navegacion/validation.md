# Validación del sidebar

Fecha: 2026-10-23.

| Criterio | Resultado |
| --- | --- |
| NAV-01; RN-13 y RN-21–RN-30 | Orden de páginas de trabajo comprobado por prueba; el filtrado de permisos previo se conserva. |
| NAV-02 y NAV-03 | Prueba de navegación sintética `/calendario` → `/clientes`: solo Citas queda activo en la primera ruta, luego se cierra; abrirlo manualmente no lo resalta. |
| NAV-04 | Enlaces con `aria-current="page"` y botones de grupo con `aria-expanded`/`aria-controls`; comprobación de plantilla mediante compilación. |

- `npm run build`: correcto. Advertencia preexistente: `inicio.component.css` supera el presupuesto por 118 bytes.
- `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/shared/layout/app-sidebar/app-sidebar.component.spec.ts`: 4 pruebas correctas.
- Primer intento de compilación/pruebas dentro del sandbox: esbuild terminó con código 134; ambas verificaciones se repitieron correctamente fuera de esa restricción.
- No se hizo inspección visual manual en navegador ni pruebas con usuarios. Móvil, oscuro y RTL conservan las clases existentes; queda pendiente confirmar su apariencia visual en esos modos.
