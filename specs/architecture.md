# Arquitectura actual

Fecha de referencia: 2026-10-15 (America/Lima).
Estado: descripción del código local y del modelo disponible; arquitectura remota desconocida.

## Estructura Angular

```text
src/main.ts → app.config.ts → app.routes.ts
                              ├─ Autenticación pública
                              ├─ AppLayout + authGuard
                              │   ├─ Páginas del negocio
                              │   └─ Páginas de demostración
                              └─ Página de error

Páginas → componentes compartidos → servicios de dominio
                                   → SupabaseService
                                       → supabase-js → Auth / tablas
```

- `pages/`: clientes, mascotas, servicios, tarifas, empleados, agenda, perfil, configuración y páginas heredadas de TailAdmin.
- `shared/layout/`: shell con header, sidebar, backdrop y router outlet; layouts de autenticación.
- `shared/components/`: UI, formularios, tablas configurables y componentes de dominio.
- `shared/services/`: persistencia y estado compartido.
- `shared/guards/auth.guard.ts`: guard de autenticación.
- `styles.css`: estilos globales y configuración de tema Tailwind.

La mayoría de las rutas importa directamente sus componentes. Configuración usa `loadComponent`. No se propone reorganizar carpetas en esta etapa.

## Flujo de autenticación

1. El formulario de acceso llama a `signInWithEmail`, que usa `signInWithPassword`.
2. Tras el acceso, navega al destino solicitado o a `/`.
3. El guard del layout obtiene la sesión y exige `email_confirmed_at`.
4. Si no cumple, redirige a `/signin` conservando el destino en un parámetro.
5. El registro envía nombres en metadata; si no obtiene sesión confirmada, cierra sesión y muestra la pantalla informativa de confirmación.
6. Perfil consulta el usuario autenticado y su fila en `profiles`; permite modificar nombres.
7. El cierre de sesión invoca Supabase Auth y navega al acceso.

No se identificó gestión centralizada mediante `onAuthStateChange`. El guard no verifica rol, permisos o `profiles.active`; no hay guards de permiso ni `canActivateChild` identificados. La autorización efectiva debe comprobarse mediante RLS.

Google, recuperación de contraseña, reenvío de confirmación y doble factor no tienen un flujo funcional completo identificado. El control visual de doble factor modifica estado local.

## Capas de servicios y dependencias

| Servicio | Responsabilidad observada |
|---|---|
| `SupabaseService` | Construcción del cliente, sesión y operaciones Auth |
| `ClientesService`, `MascotasService` | Fichas y bajas lógicas |
| `ServiciosService`, `TarifasService` | Catálogo, precios y duración |
| `EmpleadosService`, `ProfilesService` | Personal y perfiles |
| `RolesService` | Roles, catálogo de permisos y asignaciones rol–permiso |
| `AppointmentsService` | Citas, detalle y opciones de agenda |
| `ThemeService`, `SidebarService`, `ModalService` | Estado de interfaz |

El cliente Supabase se crea con la configuración del entorno y se expone a los servicios. No usa un tipo generado `Database`; existen interfaces manuales y conversiones de tipos.

Varios servicios importan `TableRow` desde la tabla configurable: dependencia de persistencia hacia presentación. Las páginas coordinan carga y escritura; no hay una capa de casos de uso separada identificada.

La tabla actualiza su estado antes de recibir confirmación remota. La gestión de errores de escritura varía entre páginas. Esto puede producir divergencia visual tras un fallo.

## Estado y formularios

Propiedades locales y signals guardan datos de pantalla. RxJS `BehaviorSubject` gestiona tema, sidebar y modales. Tema y dirección se conservan en el navegador. No se identificó un store global de negocio.

Los formularios usan principalmente `FormsModule` y validaciones manuales. La tabla no comprueba `form.valid` antes de guardar. `InputFieldComponent` no propaga `required` al input interno ni implementa `ControlValueAccessor`.

## Modelo Supabase documentado localmente

| Dominio | Tablas del SQL local |
|---|---|
| Identidad | `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles` |
| Personal y disponibilidad | `employees`, `employee_schedules`, `business_hours`, `time_blocks`, `business_settings` |
| Clientes y mascotas | `clients`, `pets`, `pet_vaccinations` |
| Información interna | `client_internal`, `pet_internal`, `appointment_internal` |
| Catálogo | `services`, `service_prices` |
| Citas | `appointments`, `appointment_items`, `appointment_item_staff` |
| Pagos y comprobantes | `payments`, `billing_documents`, `billing_document_items` |
| Comunicaciones y auditoría | `notifications`, `audit_log` |

Relaciones locales relevantes: `profiles.id` referencia `auth.users`; clientes y empleados enlazan perfiles; mascotas pertenecen a clientes; usuarios y permisos se relacionan con roles mediante tablas puente. Las claves compuestas del detalle de citas vinculan cita y mascota al mismo cliente. Personal se asigna al detalle; pagos y comprobantes se vinculan a citas.

No se afirma que estas 28 tablas existan en el entorno remoto.

## SQL, RLS y migraciones

`functions_triggers.sql` define triggers de `updated_at`, `has_permission(text)` y creación de perfil tras insertar un usuario Auth. `has_permission` considera roles activos, pero no el estado activo del perfil.

Solo se identificó activación de RLS para `roles` y `permissions`, sin sentencias `CREATE POLICY`. `policy.sql` y `seed.sql` están vacíos. No se encontraron migraciones versionadas ni implementaciones de Edge Functions.

La configuración CLI tiene `schema_paths = []` y apunta a un `supabase/seed.sql` inexistente. Los archivos SQL de la raíz no constituyen un historial verificable de despliegue.

## Discrepancias y riesgos

| Evidencia local | Consecuencia o incertidumbre |
|---|---|
| Angular usa `appointment_date`, horas separadas, mascota y empleado en cabecera, y `appointment_services` | SQL usa timestamps, `appointment_items` y `appointment_item_staff`; contrato incompatible |
| Angular envía `scheduled` | El enum SQL no contiene ese estado y utiliza mayúsculas |
| Agenda obtiene empleados desde `profiles` | No garantiza pertenencia a personal ni especialidad |
| Agenda utiliza precios base | No resuelve reglas de `service_prices` |
| Cita y detalle se escriben en solicitudes sucesivas | Riesgo de resultados parciales; no hay transacción conjunta identificada |
| Títulos interpolados en HTML del calendario | Posible inyección HTML/XSS; requiere prueba específica |
| Consultas de agenda sin filtro de bajas lógicas y sin control persistente de solapamientos identificado | Riesgo de seleccionar registros retirados o reservar horarios incompatibles |
| Construcción de horas según navegador | Zona horaria y cruces de medianoche pendientes de definir |
| `getClients()` de ejemplo consulta `clientes` | No coincide con `clients` del resto del código |
| SQL presenta literales `TOY` y `SMALL` sin coma y claves foráneas repetidas | Requiere revisión SQL antes de establecer una migración base |
| DBML no refleja todos los campos de roles y admite tarifas comodín que la UI no representa | No existe una única fuente de verdad acordada |
| Auth local apunta al puerto 3000 y desactiva confirmaciones | No coincide con el servidor Angular habitual en 4200 ni con la expectativa del guard |

## Decisiones pendientes

El usuario debe aprobar el modelo canónico de citas, estados, relación empleado–perfil, tarifas comodín, reglas horarias y matriz de permisos. También debe confirmar qué archivos reflejan el despliegue y la estrategia de migraciones. No se resuelve ninguna discrepancia mediante cambios de código en esta entrega.

Fuentes: [rutas](../src/app/app.routes.ts), [guard](../src/app/shared/guards/auth.guard.ts), [servicio de citas](../src/app/shared/services/appointments.service.ts), [SQL](../Pandas11.sql), [funciones](../functions_triggers.sql), DBML histórico (`database.md`, ausente en este checkout), [configuración Supabase](../supabase/config.toml).

## Actualización Fase 0 — 2026-10-17

Esta sección actualiza las observaciones históricas de identidad anteriores. `supabase/migrations/20261017152256_identity_foundation.sql` reproduce las cinco tablas de identidad del modelo local y añade catálogo, RLS, grants y funciones seguras. El resto del esquema sigue sin migrar en este entorno parcial.

`AuthorizationService` consulta usuario confirmado, perfil activo y `my_permissions`; guards comprueban `panel.access` en entrada y navegación hija. Cliente dispone de `/mi-perfil`; acceso denegado en `/access-denied`. Configuración distingue apariencia de seguridad. Owner gestiona roles personalizados, usuarios y asignaciones; no puede alterar owners/roles de sistema mediante API. Los perfiles no se insertan libremente desde Angular.

Helpers SECURITY DEFINER con search_path vacío evitan recursión RLS. El registro crea perfil y CLIENT sin confiar roles a metadata. Perfil/rol inactivo deja de otorgar permisos. La rotación owner se reserva a administración privilegiada; por API se impide retirar o desactivar cualquier owner.

Desarrollo aislado `Pandas11-identity-dev`, configuración Angular `local`, puertos 553xx y confirmación por correo local. Ver `supabase/README.md`. No cambia el esquema remoto ni garantiza autorización de las otras tablas del negocio.

## Actualización Fase 1 — 2026-10-17

Nueva migración incremental instala clients, pets, pet_vaccinations, client_internal y pet_internal con dependencias y RLS. OWNER/ADMIN administran, STAFF consulta y CLIENT accede solo a su vínculo profile_id y mascotas; notas internas requieren permiso independiente. La propiedad de mascota no cambia por UPDATE. Retiro lógico oculta por relación sin eliminar antecedentes; archivo de personal es de lectura.

ClientesService y MascotasService usan RPC de búsqueda paginada en servidor; las RPC son invoker y respetan RLS. save_client y retiros son operaciones controladas con permisos explícitos. RecordsService mantiene vacunas y notas en consultas separadas. RecordDetailsComponent muestra ficha/antecedentes según permisos y marca cambios tras cargas asíncronas. La tabla compartida añade guardado asíncrono optativo y paginación remota conservando contratos legacy. /mis-datos ofrece consulta propia sin panel interno. Allergies boolean y tamaño TOY alineados con Pandas11.sql; fotos/adjuntos fuera del alcance.

## Actualización Fase 2 — 2026-10-17

services/service_prices migrados incrementalmente con RLS y permisos de dominio. quote_service es SQL autoritativo (invoker): exacta tamaño/pelaje → tamaño → pelaje → general → base, con regla completa y precio en texto decimal exacto. Dimensiones desconocidas solo admiten comodines. Nombre/importe/minutos obligatorios y validados; cero permitido, sin precios no finitos o redondeo coercitivo.

ServiciosService/TarifasService utilizan búsquedas paginadas y guardado confirmado; ServiceSimulatorComponent ofrece cálculo con protección frente a respuestas obsoletas. Catálogo de cliente en /catalogo, sin panel y solo servicios activos/visibles. STAFF consulta, OWNER/ADMIN gestionan. Agenda sigue usando su contrato previo: integrar este cálculo a citas requiere otra fase, sin modificar históricos automáticamente.

## Actualización Fase 3 — 2026-10-17

Migración incremental `20261017212614_employees_availability.sql`: employees, employee_schedules, business_hours, time_blocks y skill_level alineados con Pandas11.sql. Perfil único/obligatorio, días lunes–sábado, rangos válidos y timestamps/autor de servidor. Sin borrado de empleados por API; se desactivan. Solo se siembra horario comercial 07–18, sin turnos personales.

Flujo: `/empleados` + permiso employees.read → EmpleadosComponent → EmpleadosService / WorkCalendarComponent → WorkCalendarService → RPC Supabase. Menú y acciones filtran permisos; OWNER/ADMIN gestionan, STAFF lee y CLIENT/anon/inactivos no acceden. search_employees pagina en servidor y expone nombre de empleado mediante join controlado, sin profiles.read global para STAFF. La selección de perfil activo solo se ofrece al personal autorizado; la asociación no se puede cambiar ni concede roles Auth.

Las cuatro tablas tienen RLS de lectura y se revocan escrituras REST; save_employee, save_work_period/remove_work_period, save_time_block/remove_time_block son SECURITY DEFINER con search_path vacío y permisos explícitos. Las mutaciones de turnos y horarios comerciales toman el mismo advisory lock transaccional antes de leer conflictos. La serialización global es conservadora y evita solapamientos concurrentes o movimientos entre días que eludan el control. Operaciones privilegiadas fuera de la API deben respetar ese contrato.

employee_availability calcula en un snapshot de lectura: día recurrente en America/Lima, empleado/perfil activos, habilidad, intersección de turnos y horario comercial, extensión explícita del turno que cubre el cierre, unión de bloqueos y resta mediante multirangos PostgreSQL. Devuelve ventanas, interval_covered y can_start_service separados; el segundo exige inicio comercial hasta17. Intervalos semiabiertos; cierres intermedios conservados. work_calendar agrega la configuración seleccionada en JSON para evitar truncado de filas por REST.

Entradas locales de bloqueos se convierten en servidor con AT TIME ZONE America/Lima; no se interpretan según navegador. La UI muestra Lima con Intl y descarta respuestas obsoletas. La tabla espera persistencia y conserva formularios tras error; admite inputs nativos time/datetime-local.

Agenda sigue sin integración automática con employees, turnos o bloqueos. La consulta laboral no reserva ni valida ocupación no registrada: devuelve occupancy_verified=false y lo declara en pantalla. El esquema remoto no se ha verificado ni modificado.

## Actualización Fase 4 — 2026-10-17

El contrato de agenda anterior se sustituyó localmente por appointments → appointment_items → appointment_item_staff, con appointment_internal aparte. La migración `20261017220427_internal_appointments.sql` añade las cuatro tablas/enums, restricciones/FKs y RLS. Cada asignación tiene UUID, etapa SERVICE/BATH/CUT e intervalo; el mismo trabajador puede cubrir dos etapas del mismo item. Precio, minutos y habilidad se conservan como snapshots, con total/extremos de cabecera derivados en servidor.

Flujo: `/calendario` + appointments.read → CalendarioComponent → AppointmentsService → RPC. Modelos y conversiones en appointment.models.ts usan temporal-polyfill existente; FullCalendar7 con zona America/Lima representa eventos por etapa hasta el fin del día. Cotización SQL, opciones paginadas, guardado confirmado, control de respuestas antiguas y texto DOM seguro. /calendar de demo no se modificó.

save_internal_appointment realiza alta/edición completa en transacción; version impide sobrescrituras. change_appointment_status controla reloj, transición y cancelación. Notas internas tienen escritura y permisos separados; no forman parte de get/search ni del título del calendario. OWNER/ADMIN gestionan, STAFF consulta y CLIENT/anon/inactivo no acceden; escrituras REST revocadas.

La reserva toma mutex transaccional930003 antes de leer conflictos y exige Read Committed. Revalida permisos tras esperar para no ejecutar con permisos retirados durante la espera. Valida persona y mascota sin solapamientos, actividad, habilidad, turnos, horario local y bloqueos, incluso dentro de una solicitud multiperro. Las funciones laborales y triggers comparten el protocolo; un cambio que invalida citas CONFIRMED/IN_PROGRESS se revierte. La desactivación de perfil por seguridad permanece permitida y se informa mediante needs_attention.

appointment_availability suma ocupación de citas a las ventanas laborales; employee_availability mantiene su contrato laboral y aviso anterior. La consulta no reserva: se revalida al persistir. Se respetan límites [inicio,fin), primer inicio por perro hasta17 y continuaciones después17 con cobertura explícita. Canceladas/no asistidas liberan; completadas conservan intervalos programados. Retrasos/recojos no registrados y ejecución real por etapa siguen fuera del cálculo automático.

La discrepancia local con appointment_services/fecha-horas separadas queda resuelta para identity-dev. No se ha conciliado ni desplegado una base remota o datos heredados desconocidos. Validación y límites en features/fase-4-agenda-reservas-internas/validation.md.

## Inicio público — 2026-10-18

La ruta raíz `/` carga InicioComponent de forma diferida, antes del layout privado y con pathMatch full. No requiere cuenta, no construye servicios de datos ni consulta Supabase. Usa RouterLink, estado local para menú móvil y ThemeService para la preferencia visual existente. Logo local e identidad turquesa con variables CSS limitadas al componente.

El dashboard previo pasa a `/panel` dentro de AppLayoutComponent con los mismos guards. Rutas de clientes, mascotas, empleados, catálogo, configuración y agenda conservan sus permisos. Sidebar y logos internos apuntan a panel; breadcrumb lleva a panel al personal y al inicio público a CLIENT usando permisos ya cargados.

Flujo de cuenta: `/` → `/signin` → Supabase Auth → AuthorizationService.refresh → redirect interno explícito o destino por defecto (`/panel` con panel.access; `/mi-perfil` en otro perfil activo). Redirects externos/con barras invertidas se descartan; la ruta destino aplica su guard. Registro confirmado va al perfil; confirmación pendiente conserva confirm-email. No cambia esquema/RLS ni implementación de SupabaseService.

WhatsApp, teléfono y búsqueda de dirección son enlaces externos/de dispositivo; no crean reservas ni pagos. Oferta/horario públicos son contenido comercial aprobado, no una consulta anónima a services/business_hours. Evidencia y límites en [validación de inicio público](features/inicio-publico/validation.md).

## Actualización Fase 5 — Pagos y adelantos (2026-10-18)

Plan aprobado; página lazy `/pagos` protegida por payments.read y acceso desde agenda por el mismo permiso. PaymentsService y modelos de dominio separan listado, selección paginada de citas completadas, ficha individual, resumen y escrituras RPC. Se reutilizan layout, tarjetas, modal y CDK para foco, sin dependencias nuevas ni alteración del calendario de plantilla.

Dos migraciones incrementales locales añaden payments y consultas: registro PENDING por OWNER/ADMIN, verificación/rechazo exclusivo OWNER; STAFF/CLIENT/anon no reciben acceso. RLS protege lecturas y no se conceden escrituras directas authenticated. Las RPC revalidan permisos tras el mutex930003, usado también por agenda; request_id impide reintentos duplicados y version impide decisiones obsoletas. Verificación requiere rol OWNER activo además del permiso, incluso ante delegación por rol personalizado.

PostgreSQL numeric calcula confirmado, pendiente de verificar y saldo; importes en texto decimal hacia Angular. PENDING/FAILED no descuentan deuda. Trigger de agenda impide bajar total bajo lo recibido sin cambiar su RPC. Comprobantes solo operación/referencia, sin Storage. Cobros internos solo BALANCE después de COMPLETED, sin pasarelas, devoluciones ni adelantos internos. Adelanto de autorreserva S/20 conserva RN-08 para una fase futura.

Evidencia y límites: [validación Fase 5](features/fase-5-pagos-adelantos/validation.md). No acredita adopción remota.

## Inventario — 2026-10-22

Productos y ventas conservan sus rutas/componentes. InventoryService conecta search_inventory, search_inventory_movements y record_inventory_movement; InventoryBalance/Movement/Input tipan cantidades enteras y filtros. Página de productos consulta saldos e historial, recibe/carga existencias y habilita ajustes según capacidad OWNER verificada en servidor. Modales CDK con foco/reintento y protección de respuestas antiguas.

inventory_balances mantiene saldo/version por producto; inventory_movements conserva deltas y saldo anterior/posterior. Trigger de alta crea balance cero y la migración inicializa productos existentes sin movimientos ficticios. RLS de lectura exige rol OWNER/ADMIN, sales.read e inventory.read; escrituras exclusivamente por RPC. inventory.receive habilita ingresos, inventory.adjust exige además OWNER activo. Historial sin permisos de edición/borrado para authenticated.

Confirmación y cancelación usan mutex930003, productos ordenados por UUID y bloqueo de saldo, con revalidación de permisos tras esperas. Confirmar productos inserta salida única por línea y actualiza venta/saldo atómicamente; se valida subtotal de servicios separado del total mixto. Cancelar conserva la salida original; solo RESTOCK añade entrada compensatoria. NO_RESTOCK conserva la reducción y queda trazado en sales.inventory_disposition; cancelled_by/at/reason identifican responsable/fecha/motivo. Se conserva firma pública con argumento opcional para ventas sin productos confirmados, sin vía para omitir disposición cuando aplica. Reintentos de entrada/confirmación/anulación no duplican efectos.

Dos migraciones locales: 20261022140000_inventory_movements y 20261022143000_inventory_permission_recheck. Pandas11.sql y contratos reflejan el modelo; no se inspeccionó ni migró el esquema remoto. Sin modificación de payments: saldo mixto/cobro de productos sigue fuera del sistema. Evidencia en [validación](features/actividad-4-inventario/validation.md).
## Cobros comerciales y caja — 2026-10-22

La arquitectura local añade `sale_payments` para el subtotal PRODUCT de ventas confirmadas; `payments` conserva la FK obligatoria a cita y su saldo de servicios. `private.sale_json` expone ambos importes por separado. La verificación OWNER de cualquiera de los dos tipos de cobro dispara una entrada única en `cash_movements`, exige una `cash_sessions` OPEN y se confirma en la misma transacción. Una sesión única registra fondo inicial, ingresos por medio, movimientos manuales de efectivo y cierre con diferencia. `products.minimum_stock` y `search_low_stock` calculan alertas informativas desde `inventory_balances`.

RLS limita lectura a OWNER/ADMIN con permisos; escrituras solo mediante RPC. Angular incorpora `CommercialService` y `/caja`, amplía `/ventas`, `/pagos` y `/productos`. `Pandas11.sql` mantiene el modelo previsto; migraciones incrementales acreditan únicamente el entorno Supabase local. Ver [validación](features/actividad-4-cobros-caja-alertas/validation.md).
