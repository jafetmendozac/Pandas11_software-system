# Validación — Fase 4

Fecha: 2026-10-17 (America/Lima). Estado: implementación local validada tras autorización «Vamos procede». Sin despliegue remoto.

## Alcance y aprobación

El usuario confirmó OWNER/ADMIN gestionan, STAFF consulta; varias mascotas del mismo cliente según capacidad; etapas y relevo con tiempos definidos por recepción respetando el total del servicio. Después aprobó el plan y sus ampliaciones al modelo, estados, continuidad, snapshots y tratamiento manual de recojos.

Al iniciar la implementación estaban pendientes únicamente cambios documentales de esta misma fase: business-rules.md y el nuevo directorio de especificaciones. Se conservaron y continuaron. Preflight local de solo lectura confirmó ausencia de appointments, appointment_items, appointment_item_staff, appointment_internal, appointment_services y sus enums; había cuatro migraciones anteriores.

La migración `20261017220427_internal_appointments.sql` se creó con Supabase CLI y se aplicó mediante migration up --local, sin reset ni importación completa del SQL raíz. Pandas11.sql refleja las cuatro tablas y el endurecimiento/ampliaciones aprobados. No se modificaron las cuatro migraciones anteriores, dependencias ni entornos. No se sembraron citas, tarifas o turnos personales persistentes de ejemplo.

## Criterios y evidencia comprobada

| Criterio | Resultado |
|---|---|
| F4-01 | Quinta migración incremental, enums, defaults/NOT NULL, FKs compuestas, índices, minutos enteros por etapa, snapshot de habilidad y version; modelo actualizado y datos previos conservados |
| F4-02 | OWNER/ADMIN registran y modifican, STAFF lee, CLIENT/anon/inactivos denegados por RLS/RPC. Si se desactiva un administrador mientras espera el mutex, se vuelve a comprobar su permiso antes de escribir y no se crea la cita. Se prueban varias mascotas del mismo cliente y rechazo de mascota ajena |
| F4-03 | save_internal_appointment escribe cabecera/items/etapas dentro de una transacción; fallo del segundo item o edición inválida revierte y conserva el estado anterior completo |
| F4-04 | Tarifa por mascota en SQL, price/duration/requires_specialist_snapshot persistidos. Se prueba catálogo modificado después de reservar sin alterar snapshots/IDs al reprogramar, precio una sola vez por item y rechazo de importes/origen/autor enviados por cliente |
| F4-05 | SERVICE o BATH→CUT consecutivos; empleado distinto o mismo en ambas etapas; suma exacta al total y minutos positivos. Cada etapa exige un número entero positivo de minutos en SQL, incluso si un payload con segundos suma el total correcto. Asistente no corta ni puede recibir un servicio especializado disfrazado de solo baño. Conflictos de mascota dentro/fuera de la cita denegados |
| F4-06 | Peticiones simultáneas para mismo empleado dejan una reserva; misma mascota con empleados distintos también. Ediciones concurrentes con misma version dejan una actualización y rechazan otra. Diferentes personas/perros y límites adyacentes admitidos |
| F4-07 | America/Lima en servidor, Temporal y FullCalendar. Domingo y17:01 inicial rechazados; baño17→corte18→fin19 admitido con turno hasta20. Modelos reales convertidos bajo TZ Lima, Los Ángeles y Tokio con el mismo resultado. Vista real del calendario probada después18 |
| F4-08 | Alta INTERNAL/CONFIRMED con adelanto0; transiciones autorizadas por reloj/estado; motivo de cancelación obligatorio y actor servidor. CANCELLED/NO_SHOW liberan, COMPLETED conserva su intervalo histórico; no se reabre ni borra físicamente por API |
| F4-09 | Mutex compartido y validación de cambios laborales. Errores de configuración identifican cita y fecha Lima al personal con permiso de lectura; los demás reciben un mensaje sin detalles. Bloqueo/retiro de habilidad/desactivación de empleado/eliminación de turno que invalida cita rechazados. Carreras reales reserva↔bloqueo y reserva↔eliminación de turno dejan solo una operación. Desactivar perfil por seguridad sigue permitido y marca needs_attention |
| F4-10 | appointment_internal tiene permisos/RLS propios; notas no están en ficha ordinaria ni eventos. STAFF lee sin editar. Autor y timestamps de servidor; notas usan version de cita |
| F4-11 | search_appointments pagina rango/filtros y devuelve detalle agregado sin truncar hijos. API prueba1002 citas canceladas con items/etapas; servicio Angular prueba todas las páginas. Errores conservan formulario; doble envío y respuestas de disponibilidad/cotización antiguas controlados |
| F4-12 | FullCalendar real en ChromeHeadless muestra etapa después18, texto con HTML permanece texto. Guard exige appointments.read, menú filtra subItems y elimina grupo vacío; /calendar de demostración conservado. STAFF sin callbacks de escritura. No hay arrastre/resize que eluda RPC |
| F4-13 | Regresión SQL/API/Angular de fases anteriores correcta, lint limpio, TypeScript app/spec y build correctos; sin cambios remotos |

## Comandos y resultados finales

| Comando | Resultado |
|---|---|
| `supabase migration new internal_appointments` | Creada por CLI |
| `supabase migration up --local` | Aplicada incrementalmente |
| `supabase db lint --local` | Sin errores ni advertencias |
| `supabase test db` | 112/112 PASS: 36 nuevas +76 anteriores |
| `node scripts/test-appointments-api.mjs` | 75 comprobaciones correctas |
| `node scripts/test-identity-api.mjs` | 26 comprobaciones correctas |
| `node scripts/test-clients-pets-api.mjs` | 42 comprobaciones correctas |
| `node scripts/test-services-prices-api.mjs` | 50 comprobaciones correctas |
| `node scripts/test-employees-availability-api.mjs` | 72 comprobaciones correctas |
| `npm test -- --watch=false --browsers=ChromeHeadless` | 63/63 PASS: 20 nuevas +43 anteriores |
| TypeScript sin emisión app/spec | Correctos |
| `npm run build -- --configuration development` | Correcto |
| `npm run build` | Correcto; bundle inicial3,39 MB |
| `node --check scripts/test-appointments-api.mjs` | Correcto |
| Verificación del modelo TS real en Node bajo TZ America/Lima, America/Los_Angeles y Asia/Tokyo | Tres zonas correctas: Lima19 = UTC00 del día siguiente y suma de minutos estable |
| `git diff --check` y revisión de archivos nuevos/enlaces | Sin errores |

Verificación final local: cinco migraciones aplicadas y cero usuarios/clientes de fixtures de agenda restantes.

Las 265 comprobaciones API acumuladas se ejecutaron con fixtures propios y limpieza por IDs/clientes sintéticos. Los ensayos concurrentes usan solicitudes independientes y comprueban persistencia. El script de agenda prepara registros propios de estados en el pasado mediante postgres para probar inicio/completada/no asistió sin permitir altas retroactivas en API. Sus1002 citas canceladas llevan detalle y etapas. No se borran tablas ni cuentas ajenas.

Las pruebas SQL se ejecutan con rollback. La suite laboral prepara su calendario temporal dentro de una transacción: desactiva únicamente el guard de citas durante esa preparación y lo reactiva antes de las aserciones; rollback restaura datos y metadata. La API de agenda ejecuta toda la suite SQL con una reserva propia vigente ajena a los fixtures SQL y comprueba que permanece intacta. Los tests de agenda prueban separadamente el rechazo de un cambio comercial conflictivo, sin desactivar ese guard. No usar estos scripts contra producción ni sustituir los fixtures por cuentas reales.

## Correcciones verificadas durante la implementación

El test SQL estricto detectó que el trigger compartido intentaba resolver un campo de time_blocks al procesar employees. Se separó esa rama y se repitieron SQL/API con éxito. La conversión ISO se declaró STABLE para eliminar la advertencia del linter. Se corrigieron la recarga redundante del mismo rango, el estado de consultas antiguas, la ficha fallida y la disponibilidad de observaciones tras crear una cita.

En pruebas Angular se espera la carga concreta de datos/microtareas de Forms, sin esperar a que se agoten los temporizadores propios del calendario. Se mantuvo FullCalendar real para comprobar render, zona Lima, finalización después18 y contenido seguro. El resultado final de todas las suites es correcto.

## Precisiones de operación

Los estados terminales congelan horarios, items y transiciones. Las observaciones internas mantienen su edición independiente por permiso y version; no alteran la ocupación. La operación de reserva vuelve a comprobar permisos después de esperar el mutex para impedir escrituras de una cuenta desactivada durante esa espera.

## Archivos principales

- Pandas11.sql; nueva migración y `supabase/tests/database/appointments.test.sql`.
- `scripts/test-appointments-api.mjs`.
- AppointmentsService y nuevos modelos/funciones temporales en `appointment.models.ts`, con pruebas.
- CalendarioComponent TS/HTML y sus pruebas; rutas, guard y sidebar con pruebas de permiso/menú.
- Documentos de esta fase, business-rules, architecture, tech-stack, roadmap, baseline y supabase/README. Se marcaron en misión/arquitectura las referencias históricas al DBML ausente; no se inventó ni restauró un esquema alternativo.

## Límites y revisión del usuario

Se gestiona ocupación de reservas programadas y bloqueos registrados, no la ejecución física en tiempo real. Recojos y extensiones por demora requieren bloqueos manuales y resolver conflictos; no se generan/cotizan automáticamente ni se deduce ocupación indefinida de IN_PROGRESS. No hay pagos, adelantos online, autorreserva, espera entre etapas, cancelación durante atención ni reapertura de terminales.

No se hizo un recorrido manual completo con el backend en el navegador, inspección de todos los tamaños/temas ni reconstrucción de una instancia vacía. Hay pruebas de componentes con FullCalendar real, API real local y migración incremental preservando datos; no son un E2E manual completo. No se verificó ni modificó el esquema remoto.

Revisión sugerida: recargar app local, Citas → Calendario, crear cita con dos mascotas y relevo; probar un conflicto y cancelar con motivo. La siguiente fase y el despliegue remoto requieren su propio plan. Sin commits ni pushes en esta entrega.

## Restitución del estilo de plantilla — 2026-10-18

Cambio visual autorizado por el usuario: `/calendario` recupera tarjeta, flechas, título, selector mes/año/semana/día y apariencia de eventos basada en CalenderComponent. Las clases de celdas, franjas horarias y popovers se adaptan en `calendar-appearance.ts`, sin modificar la demostración `/calendar` ni los estilos globales. Cabecera y controles en Angular, textos en español, tema oscuro y espaciado lógico. La vista inicial vuelve a mes, como la plantilla.

Eventos siguen siendo etapas de trabajadores con su cita asociada; conservan nombre/servicio/etapa/trabajador/cliente/estado y aviso operativo. Colores de plantilla para confirmada, en atención/revisión, completada y cancelada/no asistió, siempre con estado escrito. Nombres y horas se insertan mediante nodos/textContent. No se publican notas internas ni se trasladan eventos de ejemplo. Selección de un día mensual/anual propone07:00 Lima para no enviar una fecha sin hora; la reserva continúa sujeta a validación del servidor.

| Verificación ejecutada | Resultado |
|---|---|
| TypeScript app y spec sin emisión | Correctos |
| `npm run build` | Correcto; inicial3,41MB |
| `npm test -- --watch=false --browsers=ChromeHeadless` | 64/64 correctas |
| FullCalendar real en prueba de componente | Mes → año → día → semana; título/selector sincronizados, navegación anterior/siguiente, apertura de cita al pulsar etapa y sin recargas repetidas |
| Selección mensual sin hora | Formulario recibe fecha local completa a07:00; no altera la zona America/Lima |
| Regresión de seguridad y tiempos | STAFF sin alta/guardado; texto HTML como nombre no crea elementos; etapa de18–19 renderizada con clase de tarjeta y ficha asociada |
| `git diff --check` y revisión del archivo nuevo | Correctos |

El primer recorrido de vistas detectó que el test comprobaba el select antes de la microtarea de ngModel; se corrigió la espera y se repitió la suite completa con éxito. Build/tests se ejecutaron fuera del sandbox por sus restricciones locales ya comprobadas.

Sin cambios de SQL, modelo, servicios, RLS, dependencias o base de datos. No se repitieron pruebas SQL/API: sus contratos no cambian y esta tarea no se conecta a Supabase. Pendiente revisión visual manual completa de tamaños/temas y recorrido con backend; la comprobación con FullCalendar real acredita interacción y renderizado, no una comparación de píxeles con la plantilla.
