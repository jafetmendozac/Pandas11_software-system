# Validación — Actividad 5.3

Fecha: 2026-10-29 (America/Lima). Estado: **implementado y validado en entorno local**, con límites indicados abajo. Plan aprobado mediante «Dale sigue»; requisitos en [requirements.md](requirements.md).

| Criterio | Estado | Evidencia pendiente |
|---|---|---|
| RC-01–RC-02 / RN-01, RN-37 | Validación local parcial | `contact_queue.test.sql` comprueba cita de mañana, seguimiento justo antes/al cumplir 30 días, exclusión por cita futura confirmada y reaparición tras `NO_SHOW`. La consulta filtra clientes retirados por SQL; no se ejecutó prueba aislada de reprogramación ni inspección con datos operativos. |
| RC-03 / RN-39 | Validado localmente | Pruebas de STAFF, OWNER, OWNER inactivo, CLIENT, anon, rol personalizado con permiso delegado, RLS de historial y escritura directa denegada. |
| RC-04 / RN-38 | Validado localmente | Valor legado `whatsapp_opt_in=true` no habilita WhatsApp; OWNER registra consentimiento, STAFF no puede; la revocación sincroniza el booleano y deshabilita la comprobación de WhatsApp. La UI solo ofrece enlace cuando la RPC autoriza. |
| RC-05 / RN-39 | Validado localmente | Registro, reintento con mismo `request_id`, ausencia de duplicado y cierre de oportunidad comprobados por SQL. Prueba Angular conserva ID ante error de red. Concurrencia entre dos operadores no se simuló con dos sesiones simultáneas. |
| RC-06 | Validación parcial | Pruebas DOM de candidato real, enlace condicionado y estado de reintento; compilación correcta. Inspección visual manual de móvil, oscuro, teclado y WhatsApp real pendiente. |
| RC-07 | Validación parcial | Suite SQL/Angular, tipos y build correctos; faltan los escenarios específicos mencionados arriba y aceptación operativa. |

## Cambios comprobados

- `20261029130000_contact_queue.sql` aplicado solo a Supabase local. Crea dos tablas, permisos `contacts.read/record/consent`, RLS y tres RPC públicas. La cola se calcula al consultar, sin scheduler ni envío. `Pandas11.sql` se actualizó como modelo previsto; `notifications` sigue sin migración operativa.
- `/por-contactar` usa `ContactQueueService`, lista paginada y formulario de intento. OWNER/ADMIN pueden registrar o revocar consentimiento; STAFF registra intentos. CLIENT/anon no reciben acceso. El contenido ficticio del dropdown se retiró del encabezado.
- Durante la primera prueba SQL, la política RLS reveló que faltaba `EXECUTE` de `private.contact_operator()` para `authenticated`. Se corrigió la migración y se alineó la instancia local. Una segunda revisión añadió bloqueo de la fila cliente al registrar intentos para serializar con la revocación de consentimiento; la función local se alineó con la versión final de la migración. No se hizo reset.

## Ejecución

- `supabase migration up --local`: aplicada una migración 5.3, sin reset.
- `supabase test db`: **342/342 correctas** en 12 archivos, incluidos 26 casos nuevos de `contact_queue.test.sql`.
- `npx ngc -p tsconfig.app.json --noEmit`: correcto.
- `npx tsc -p tsconfig.spec.json --noEmit`: correcto.
- `npm test -- --watch=false --browsers=ChromeHeadless`: **144/144 correctas**, tres casos nuevos de la página.
- `npm run build`: correcto fuera del sandbox restringido. El primer intento dentro del sandbox abortó con código 134 sin error de código. Persiste el aviso previo de presupuesto CSS de `src/app/pages/inicio/inicio.component.css` (1,46 kB), ajeno a 5.3.

Se usaron cuentas y fechas sintéticas en SQL con `ROLLBACK`. No se consultó Supabase remoto, no se desplegó ni se enviaron comunicaciones. La revisión visual y la aceptación del negocio siguen pendientes; el flujo manual no acredita entrega de WhatsApp ni cumplimiento legal del consentimiento.
