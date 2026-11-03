# Validación de configuración

Estado: implementación local completada el 2026-10-28 (America/Lima); comprobaciones de código y pruebas Angular correctas.

## Resultado por criterio

| Criterio | Evidencia |
|---|---|
| UX-C01 · panfletos | Selector visible «Elegir imagen», nombre del archivo en español y modal al elegir un archivo válido. Test comprueba apertura, cierre y devolución del foco. La vista actual también se puede ampliar; se conserva el reintento de carga existente. |
| UX-C02 · roles | Tres selecciones usan `app-custom-select`; test elige usuario y rol mediante sus opciones, comprueba que OWNER queda excluido de asignación y que los permisos se muestran por descripción española. Códigos y llamadas de servicio no cambiaron. |
| UX-C03 · apariencia | Tests comprueban que la vista previa oscura no persiste, Descartar restaura claro y Guardar persiste oscuro; un servicio recién creado lo restaura. Plantilla sin control de dirección; `app.component.ts` inicializa el servicio al arrancar. |
| UX-C04 · contraseña | Tests comprueban éxito sin cerrar sesión, confirmación distinta y error de Auth conservando el formulario. `SupabaseService` llama a `auth.updateUser({ password })`. |
| UX-C05 · 2FA | Retirados el control y el estado local de `ProfileComponent`; revisión estática sin referencia 2FA en esa pantalla. |

## Comandos

- `npx ngc -p tsconfig.app.json --noEmit`: correcto.
- `npx tsc -p tsconfig.spec.json --noEmit`: correcto.
- `npm run build`: correcto fuera del aislamiento; advertencia preexistente de presupuesto CSS de `inicio.component.css` (118 bytes).
- `npm test -- --watch=false --browsers=ChromeHeadless` fuera del aislamiento: **131/131 pruebas correctas**.
- Tests focalizados posteriores para interacción real del selector: **1/1 correcto**; antes, los cuatro archivos focalizados sumaron **10/10 correctas**.
- `git diff --check`: correcto.

En el aislamiento, build y Karma terminaron con código 134 antes de mostrar diagnóstico; al ejecutarse fuera, ambos pasaron. No se modificaron migraciones, RLS ni datos.

## Límites

No se probó el cambio real de contraseña contra Supabase Auth con una cuenta sintética local; los tests aíslan la llamada y sus resultados. Tampoco se hizo inspección visual manual de móvil/oscuro en un navegador con sesión. ChromeHeadless verificó interacciones de DOM y la suite general, no la apariencia visual ni la política específica de contraseña que pueda estar configurada en una instancia remota. No se utilizaron cuentas reales ni se hicieron cambios en un entorno remoto.
