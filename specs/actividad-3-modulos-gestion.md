# Actividad 3 — Módulos de gestión

Fecha de corte: 2026-10-20 (America/Lima). Anexo para los puntos 3.1–3.5 de la [matriz S1–S14](matriz-seguimiento.md). Se basa en el código y las migraciones del repositorio y en resultados de pruebas **locales ya documentados**. No acredita despliegue remoto, recorrido manual completo ni aceptación del negocio. Los criterios técnicos pertenecen a las fases SDD 1, 2 y 4; sus números no equivalen a los del cronograma.

## Correspondencia entre cronograma, reglas y evidencia

| Punto | Alcance comprobado | Reglas y criterios | Evidencia principal |
|---|---|---|---|
| **3.1 Clientes: CRUD y conexión** | Alta, búsqueda paginada, consulta, edición, vínculo controlado con perfil y baja lógica. Se admiten clientes sin cuenta. OWNER/ADMIN gestionan; STAFF consulta; CLIENT solo accede a su ficha vinculada. | RN-09; F1-02, F1-03, F1-07, F1-08, F1-09 | [Requisitos](features/fase-1-clientes-mascotas/requirements.md), [validación](features/fase-1-clientes-mascotas/validation.md), [servicio Angular](../src/app/shared/services/clientes.service.ts), [migración](../supabase/migrations/20261017201505_clients_pets.sql) |
| **3.2 Mascotas: CRUD, relaciones y ficha** | Mascotas asociadas a cliente; ficha con tamaño, alergias, vacunas y observaciones visibles; notas internas separadas. Alta/edición y baja lógica, archivo consultable por personal autorizado. CLIENT consulta sus mascotas vinculadas sin acceso a notas internas. | RN-03, RN-04, RN-05, RN-09; F1-04 a F1-09 | [Requisitos](features/fase-1-clientes-mascotas/requirements.md), [validación](features/fase-1-clientes-mascotas/validation.md), [servicio Angular](../src/app/shared/services/mascotas.service.ts), [vista propia](../src/app/pages/clientes/my-records.component.ts) |
| **3.3 Servicios: CRUD** | Alta, edición y desactivación de servicios; gestión de tarifas por tamaño y pelaje; simulador de cotización con prioridad de reglas y duración. STAFF consulta y CLIENT solo ve catálogo activo/visible. | RN-04, RN-05, RN-07, RN-11, RN-12; F2-02 a F2-08 | [Requisitos](features/fase-2-servicios-precios/requirements.md), [validación](features/fase-2-servicios-precios/validation.md), [servicios](../src/app/shared/services/servicios.service.ts), [tarifas](../src/app/shared/services/tarifas.service.ts), [migración](../supabase/migrations/20261017210343_services_prices.sql) |
| **3.4 Citas: agendamiento, estados y asignación** | Recepción registra citas internas con una o varias mascotas del mismo cliente y asigna trabajadores por servicio o etapas baño→corte. El servidor cotiza, valida habilidad, turnos, bloqueos y solapamientos; OWNER/ADMIN gestionan y STAFF consulta. | RN-01, RN-03 a RN-07, RN-09 a RN-15; F4-02 a F4-09, F4-12 | [Requisitos](features/fase-4-agenda-reservas-internas/requirements.md), [validación](features/fase-4-agenda-reservas-internas/validation.md), [servicio Angular](../src/app/shared/services/appointments.service.ts), [calendario](../src/app/pages/agenda/calendario.component.ts), [migración](../supabase/migrations/20261017220427_internal_appointments.sql) |
| **3.5 Citas: históricos y validaciones** | Se conservan citas canceladas/no asistidas/completadas y sus items, asignaciones, precios y duraciones capturados. Cancelar no borra físicamente; hay búsqueda paginada y control de versión. Pruebas locales cubren conflictos, concurrencia y permisos. | RN-01, RN-03, RN-07, RN-13 a RN-15; F4-03, F4-04, F4-06, F4-08, F4-11, F4-13 | [Validación](features/fase-4-agenda-reservas-internas/validation.md), [modelo](../Pandas11.sql), [pruebas SQL](../supabase/tests/database/appointments.test.sql), [pruebas API](../scripts/test-appointments-api.mjs) |

Los permisos de las tablas y funciones se detallan en el [anexo de seguridad](actividad-2-seguridad-auth.md). El modelo de referencia está en [Pandas11.sql](../Pandas11.sql): `clients` → `pets` → `pet_vaccinations`; `services` → `service_prices`; `appointments` → `appointment_items` → `appointment_item_staff`, con notas internas separadas. Las tres [migraciones](../supabase/migrations/) de estos dominios son la evidencia de implementación local; el SQL raíz por sí solo no acredita un esquema desplegado.

## Resultado verificable para el informe

**3.1.** «Se implementó el mantenimiento de clientes con búsqueda, registro, edición, relación opcional con cuenta y baja lógica. La interfaz Angular usa servicios conectados a funciones y tablas Supabase protegidas por permisos».

**3.2.** «Se implementó la ficha de mascotas vinculada a clientes, con vacunas, datos relevantes para la atención y notas internas de acceso restringido. La baja conserva los antecedentes sin mantenerlos en los listados operativos».

**3.3.** «Se implementó el mantenimiento de servicios y tarifas por tamaño/pelaje. La cotización selecciona una regla completa de precio y duración, y distingue el catálogo visible al cliente del catálogo administrativo».

**3.4.** «Se implementó la agenda interna para registrar, consultar, reprogramar y cambiar estados de citas con varias mascotas y asignación de trabajadores. El servidor valida disponibilidad, habilidades y conflictos al guardar, incluso ante solicitudes concurrentes».

**3.5.** «Se conservaron las citas y su detalle al terminar o cancelar, con búsqueda y controles de versión. Las pruebas locales verificaron estados, permisos, solapamientos y consistencia de reservas». Conviene describir este punto como **parcial** hasta acordar qué histórico exige el evaluador.

## Pruebas registradas y alcance

| Dominio | Resultados históricos consignados en `validation.md` | Qué respaldan |
|---|---|---|
| Clientes y mascotas | 42 comprobaciones API; 30/30 SQL y 20/20 Angular, **incluidas pruebas previas** | CRUD, vínculo, RLS, archivo, paginación, vacunas, notas y manejo de errores. |
| Servicios y tarifas | 50 comprobaciones API; 48/48 SQL y 28/28 Angular, **incluidas pruebas previas** | Cotización, restricciones, roles, búsqueda y formularios. |
| Agenda interna | 75 comprobaciones API; 112/112 SQL y 63/63 Angular, **incluidas pruebas previas** | Reservas, concurrencia, estados, disponibilidad y calendario. Una validación visual posterior del calendario registró 64/64 Angular. |

Los totales de SQL y Angular son acumulativos en cada fase y **no deben sumarse** como pruebas distintas. Los resultados proceden de [Fase 1](features/fase-1-clientes-mascotas/validation.md), [Fase 2](features/fase-2-servicios-precios/validation.md) y [Fase 4](features/fase-4-agenda-reservas-internas/validation.md), fechadas el 2026-10-17; el ajuste visual de agenda se registró el 2026-10-18. Este anexo no volvió a ejecutar suites, build ni migraciones.

## Límite de «históricos» en 3.5

El sistema conserva el **estado final y el detalle de cada cita** y permite consultar citas pasadas. `version` protege contra ediciones concurrentes; los snapshots preservan los valores de la reserva frente a cambios posteriores del catálogo. Eso no equivale a una bitácora inmutable de cada edición: no hay evidencia de que se pueda reconstruir quién cambió cada campo, cuál era su valor anterior y cuándo ocurrió cada versión. La tabla `audit_log` figura en [Pandas11.sql](../Pandas11.sql) como modelo previsto, sin migración operativa identificada en este corte.

Para cerrar 3.5, el evaluador debe definir si «históricos» significa **consulta de citas pasadas y canceladas** o **auditoría de todas las modificaciones**. La primera lectura está respaldada por la implementación local; la segunda requeriría requisitos, plan SDD y aprobación antes de desarrollar una funcionalidad nueva. Las reservas online de la Fase 6 SDD tampoco forman parte de esta agenda interna.

## Evidencia pendiente para cierre formal

1. Recorrido con datos sintéticos y capturas de alta/edición/baja lógica de cliente y mascota, ficha/vacunas, servicios/tarifas, cita con asignación y rechazo de conflicto.
2. Revisión por Alex y Caro o el evaluador de la ficha entregada, precios y duraciones reales del catálogo, y flujo de recepción. Las pruebas técnicas usan datos sintéticos y no sustituyen esa aceptación.
3. Definición verificable de «históricos» para 3.5 y constancia de aceptación o nueva especificación si se exige auditoría de cada modificación.
4. Salidas fechadas de ejecución y versión/entorno si el informe solicita anexos de pruebas originales. No se comprobó el proyecto Supabase remoto.

No se cambió código, esquema, datos ni funcionalidad para preparar este anexo.
