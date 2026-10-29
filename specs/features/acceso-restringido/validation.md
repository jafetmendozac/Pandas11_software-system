# Validación — Acceso restringido

Fecha: 2026-10-26 (America/Lima). Estado: implementación local; sin despliegue.

## Cambios y criterios

- AR-01: mensaje y título de pestaña coherentes, sin causa inventada y con orientación para consultar con quien administra cuentas.
- AR-02: inicio público siempre visible; perfil solo tras `AuthorizationService.refresh()` correcto.
- AR-03: cambio de cuenta con estado de espera, protección contra doble envío y error con `role="alert"`.
- AR-04: plantilla con foco visible, espaciado lógico y variantes de tema; no se tocaron permisos.

## Evidencia

| Comprobación | Resultado |
|---|---|
| `npm run build` | Correcto con la plantilla final fuera del sandbox; advertencia preexistente: `inicio.component.css` supera el presupuesto por 118 bytes |
| `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/pages/auth-pages/access-denied/access-denied.component.spec.ts` | 3/3 correctas: perfil condicionado, cambio de cuenta y error de salida |
| `npm run start:local` | Compiló la pantalla; el servidor se detuvo tras la revisión |
| `tsc --project tsconfig.app.json --noEmit --incremental false` | Correcto tras el ajuste final del título de pestaña |
| Captura local de escritorio en ChromeHeadless | Se comprobó jerarquía, legibilidad y ubicación de acciones. Después se retiró un rótulo sin acción y se simplificó el texto; la compilación de desarrollo volvió a pasar |
| Captura móvil con ChromeHeadless | No se completó: el navegador se atascó con errores del servicio gráfico/red en los dos intentos; se canceló |
| `git diff --check` y espacios finales en archivos nuevos | Correctos |

La compilación inicial dentro del sandbox terminó con código 134; el build pasó al ejecutarse con acceso local autorizado. Una repetición posterior al ajuste del título de pestaña quedó sin avanzar y se canceló; TypeScript de la versión final pasó. No se verificaron visualmente móvil, tema oscuro, RTL ni teclado manual. No se ejecutaron pruebas SQL/API porque no cambió el contrato de datos ni las políticas.
