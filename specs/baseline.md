# Línea base inicial

Fecha: 2026-10-15 (America/Lima).
Origen: auditoría aprobada y comprobaciones locales de esta entrega documental.

## Alcance y clasificación de evidencia

- **Comprobado:** observado en archivos, comandos locales o auditoría aprobada.
- **Deducción:** consecuencia probable expresamente indicada como tal.
- **Desconocido:** requiere evidencia o decisión adicional.

Esta entrega crea únicamente cinco documentos en `specs/`. No modifica código, SQL, configuración, dependencias ni base de datos. No establece conexiones con Supabase ni realiza commits o pushes.

## Estado inicial de Git

Antes de crear los documentos:

```text
Rama: chore/introducir-sdd
HEAD: 865864f

 M AGENTS.md
?? supabase/
```

Esos cambios son preexistentes y se conservan. `specs/` no existía al comenzar. El resultado documental previsto agrega únicamente los cinco archivos de esta carpeta.

La configuración de Supabase está disponible localmente pero su directorio no estaba versionado en esta instantánea. Esto limita la reproducibilidad del estado actual desde Git.

## Comandos disponibles

| Comando | Propósito | Observaciones |
|---|---|---|
| `npm start` | Servidor Angular de desarrollo | Habitualmente puerto 4200; no ejecutado |
| `npm run build` | Compilación de producción | Genera artefactos; no ejecutado |
| `npm run watch` | Compilación de desarrollo continua | Genera artefactos; no ejecutado |
| `npm test` | Karma/Jasmine | Configurado; sin suites identificadas |
| `npm run ng -- <argumentos>` | Angular CLI local | Script disponible |
| `node node_modules/typescript/bin/tsc --project tsconfig.app.json --noEmit --incremental false` | Comprobación de tipos sin emisión | Ejecutado en auditoría y repetido para esta entrega |
| `git diff --check` | Comprobación de espacios en cambios versionados | Complementar con revisión de archivos nuevos |

No hay scripts específicos de lint, E2E o pruebas SQL en `package.json`. No se presuponen servicios locales activos ni un entorno remoto autorizado para pruebas.

## Resultados iniciales

| Verificación | Momento y resultado |
|---|---|
| Revisión Angular, servicios, autenticación y SQL | Auditoría aprobada: realizada; hallazgos en `architecture.md` |
| TypeScript sin emisión | Auditoría: código de salida 0, sin diagnósticos |
| TypeScript sin emisión, repetición | Entrega documental: código de salida 0, sin diagnósticos |
| Versiones instaladas y Node/npm | Entrega documental: comprobadas; inventario en `tech-stack.md` |
| Git inicial | Entrega documental: rama, HEAD y cambios registrados arriba |
| Documentación previa | No existía `specs/` |
| Pruebas unitarias | No se encontraron archivos `*.spec.ts` en la auditoría |
| Integración, E2E y SQL/RLS | No se identificaron suites locales |
| Compilación Angular y pruebas en navegador | No ejecutadas en esta entrega, limitada a documentación |
| Esquema y políticas remotas | No verificados; ninguna conexión realizada |
| Revisión documental | Cinco archivos Markdown; enlaces locales válidos y sin espacios finales |
| Revisión de Git | `git diff --check` sin errores; estado final: cambios preexistentes y `?? specs/` |

TypeScript sin emisión no valida plantillas Angular, compatibilidad de consultas con PostgreSQL, autorización RLS ni comportamiento del navegador. No se declara que la aplicación compile o funcione de extremo a extremo.

## Hallazgos de referencia

- Código de mantenimiento para clientes, mascotas, servicios, tarifas, empleados, perfil y roles.
- Dashboard y facturas con datos de demostración.
- Agenda incompatible con el contrato SQL local disponible.
- Sin políticas `CREATE POLICY` identificadas; activación de RLS local solo en roles y permisos.
- `policy.sql` y `seed.sql` vacíos; sin `supabase/migrations/` identificado.
- Seed configurado en una ruta inexistente y configuración Auth local desalineada con Angular.
- Tipos de base de datos manuales; no hay un contrato generado `Database`.

## Pruebas pendientes

1. Autenticación, confirmación, cierre de sesión y autorización por usuario/rol.
2. RLS para lecturas y escrituras permitidas y denegadas, con datos sintéticos.
3. Citas: esquema, estados, atomicidad, tarifas, disponibilidad y zona horaria.
4. Formularios, valores inválidos y recuperación ante errores de persistencia.
5. Bajas lógicas y exclusión de registros retirados.
6. Escape del HTML de títulos del calendario.
7. Reproducción de esquema desde migraciones y compilación Angular.

Estas pruebas son propuestas para planes posteriores, no tareas autorizadas en esta entrega.

## Incertidumbres y aprobaciones

Se desconoce el esquema remoto completo, las políticas aplicadas, los roles reales, los triggers desplegados y qué flujos han sido comprobados por el usuario. No se infieren a partir del SQL local.

Las decisiones pendientes están centralizadas en [roadmap.md](roadmap.md). La revisión de estos documentos debe preceder a cualquier otra tarea. La aprobación de documentación no debe interpretarse como autorización automática para implementar, instalar paquetes o ejecutar migraciones.

## Evolución: Fase 0 — 2026-10-17

Identidad migrada y validada en instancia aislada identity-dev. 16 pruebas SQL y 26 comprobaciones API correctas, lint sin errores; tipos, build y pruebas Angular de autorización ejecutados. Las observaciones iniciales de ausencia de migraciones/pruebas ya no describen la identidad actual. El resto del modelo y la base remota no están validados. Resultados y límites en `features/fase-0-fundamentos-seguridad/validation.md`; instrucciones en `../supabase/README.md`. Instancia local activa, sin cuentas sintéticas persistentes tras los tests.

## Evolución: Fase 1 — 2026-10-17

Migración incremental local de clientes/mascotas y antecedentes aplicada preservando cuentas existentes. 30 pruebas SQL acumuladas y 42 comprobaciones API de Fase 1 correctas; UI integra consulta propia, vacunas y separación interna. El script adicional `node scripts/test-clients-pets-api.mjs` utiliza fixtures propios, incluyendo prueba de 1002 filas, y no requiere reset. Resultados Angular/build y límites en features/fase-1-clientes-mascotas/validation.md.

## Evolución Fase 2 — 2026-10-17

Nueva migración incremental de catálogo aplicada en identity-dev conservando datos actuales. 48 pruebas SQL, 50 comprobaciones API específicas y 28 pruebas Angular correctas; lint/build correctos. Nuevo script `scripts/test-services-prices-api.mjs`. Se calculan precios/duraciones por tarifa con resultado decimal seguro; no se declara integración con agenda ni despliegue remoto. Ver validación de la fase.

## Evolución Fase 3 — 2026-10-17

Inicio de implementación: rama `chore/introducir-sdd`, HEAD `3ded0a5`; únicamente el directorio de especificaciones de Fase 3 estaba sin seguimiento. Sin commits ni pushes de esta entrega.

Preflight local no encontró las cuatro tablas laborales. Nueva migración `20261017212614_employees_availability.sql` creada y aplicada con Supabase CLI mediante migration up --local, sin reset. Se conservan cuentas y datos anteriores; los tests limpian solo UUIDs/prefijos propios y las pruebas SQL hacen rollback. Sin dependencias nuevas ni cambios de entornos.

| Validación | Resultado |
|---|---|
| `supabase db lint --local` | Sin errores ni advertencias |
| `supabase test db` | 76/76: 48 previas +28 nuevas |
| `node scripts/test-identity-api.mjs` | 26 comprobaciones correctas |
| `node scripts/test-clients-pets-api.mjs` | 42 comprobaciones correctas |
| `node scripts/test-services-prices-api.mjs` | 50 comprobaciones correctas |
| `node scripts/test-employees-availability-api.mjs` | 72 comprobaciones correctas, incluida concurrencia y paginación >1000 |
| `npm test -- --watch=false --browsers=ChromeHeadless` | 43/43: 28 previas +15 nuevas |
| TypeScript app/spec sin emisión | Correctos |
| `npm run build` | Correcto; inicial 3,35 MB |
| Build en configuración development | Correcto |
| `git diff --check` | Sin errores |

Los comandos requieren CLI/Docker/Chrome locales. Sin E2E manual completo ni verificación remota. La consulta cubre disponibilidad laboral y bloqueos registrados, no ocupación automática de agenda. Detalle en [validación de Fase 3](features/fase-3-empleados-disponibilidad/validation.md).

## Evolución Fase 4 — 2026-10-17

Inicio: documentación de Fase4 pendiente en Git (`M specs/business-rules.md`, nuevo directorio de la fase), conservada y continuada tras aprobación. Preflight local sin tablas/enums de citas y con cuatro migraciones previas. Quinta migración `20261017220427_internal_appointments.sql` creada/aplicada con CLI, sin reset ni cambios remotos.

| Validación | Resultado final |
|---|---|
| `supabase test db` | 112/112: 36 nuevas +76 anteriores |
| `supabase db lint --local` | Sin errores ni advertencias |
| API Fases0/1/2/3/4 | 26 +42 +50 +72 +75 =265 comprobaciones correctas |
| Angular ChromeHeadless | 63/63: 20 nuevas +43 anteriores |
| TypeScript app/spec sin emisión | Correctos |
| Build development/producción | Correctos; producción inicial3,39 MB |
| Modelos temporales del código real bajo TZ Lima/Los Ángeles/Tokio | Correctos |
| `git diff --check`, archivos nuevos y enlaces | Correctos |

Nueva API y pruebas de citas conservan cuentas existentes y limpian sus datos. Concurrencia comprobada entre reservas y cambios de turno/bloqueo, snapshots preservados y paginación de1002 citas completas canceladas. FullCalendar real probado con etapa después18 y texto seguro. Sin pruebas E2E manuales completas ni reconstrucción desde cero. No se instalaron paquetes, modificaron entornos, hicieron commits/pushes o desplegaron cambios remotos. Detalle en [validación](features/fase-4-agenda-reservas-internas/validation.md).

## Seed de pruebas Fases 0–4 — 2026-10-18

Git limpio al inicio de esta tarea. Se incorpora `npm run seed:local`: carga explícita y aditiva de cuentas Auth ficticias y datos relacionados de las cinco fases en la instancia local55321/55322. No cambia el esquema ni las políticas, no ejecuta reset ni migraciones y conserva el horario comercial. El seed automático SQL continúa sin cuentas demo por defecto.

Primera carga correcta, con agenda de ejemplo para2026-10-19. `node scripts/test-local-seed.mjs`:41 comprobaciones correctas. Repetición del seed verificada comparando huellas de las20 tablas públicas antes/después y datos persistentes de cuentas Auth: sin cambios ni duplicados, salvo actividad normal de login. `supabase test db` con los fixtures presentes:112/112 correctas. Sintaxis Node y revisión de espacios correctas.

Sin cambios Angular: no se repitió compilación ni pruebas unitarias. Sin revisión visual completa, conexiones remotas, instalación de dependencias o commits. Cuentas, recorrido manual, decisiones y límites de recuperación en [seed local](seed-local.md).

## Inicio público — 2026-10-18

Al iniciar la implementación solo estaba sin seguimiento la propuesta documental `specs/features/inicio-publico/`; no había cambios de código pendientes. El usuario aprueba el plan y solicita turquesa predominante mediante referencias de marca. Se añade portada lazy en `/`, dashboard protegido en `/panel`, enlaces internos ajustados y destino de login por autorización; sin migraciones, cambios de base o dependencias.

| Validación | Resultado |
|---|---|
| TypeScript app/spec sin emisión | Correctos |
| Build producción | Correcto; inicial3,41MB, portada lazy aproximadamente24kB; sin modificar presupuestos |
| Angular ChromeHeadless | 77/77 correctas |
| Chrome sobre build local | Escritorio1440px y móvil390px; oscuro/RTL, menú y anclas, sin desbordes; cero llamadas Supabase y cero excepciones |
| Revisión de identidad | Logo existente, turquesa y acentos rosa/morado; no se altera tema del panel |
| Revisión Git/espacios | Correcta |

La primera compilación señaló presupuesto de estilos; se redujo CSS usando utilidades existentes. Dos pruebas nuevas de registro requerían proveedor de rutas y se corrigieron; ejecución final completa correcta. No se modificaron cuentas ni se envió WhatsApp. Pruebas de cuenta usan mocks; sin E2E real contra Auth. No se repiten SQL/API porque sus contratos no cambian. Detalle y capturas de revisión temporal en [validation.md](features/inicio-publico/validation.md).

## Validación Fase 5 — 2026-10-18

Antes del trabajo: HEAD4b6c8a4; cambios documentales de preparación de Fase5 sin commit. Usuario aprobó implementación mediante «Si apruebo». Nuevas migraciones locales20261018225928/20261018230255, sin reset ni modificación de las cinco anteriores; esquema remoto sin inspeccionar/desplegar.

Ejecutados: lint local sin errores; SQL137/137 (seis archivos); API de Fase5 107 comprobaciones; regresiones API0–4 repetidas:265; tipos app/spec correctos; Angular90/90 en ChromeHeadless. Build final de producción correcto3.42MB, sin advertencias. Recorrido real en Chrome correcto con registro/verificación OWNER, ADMIN sin verificación, STAFF denegado, foco y móvil/oscuro/RTL; sin errores JS ni conexiones remotas. Detalle vigente y límites en [validation.md](features/fase-5-pagos-adelantos/validation.md).

Se añadió scripts/test-payments-api.mjs; comandos npm existentes sin cambios. Sin dependencias, commits, pushes ni cambios de producción. Se generó el entorno local ignorado con el script existente para ensayar solo contra55321, sin mostrar claves ni sobrescribir otros entornos.

## Evolución de inventario — 2026-10-22

Plan y decisiones INV-D01–INV-D05 aprobados mediante «Añadelo entonces» con `$sdd-feature`. Inventario local por producto/unidad, saldo cero inicial, entradas OWNER/ADMIN, ajustes OWNER, historial y descuento de stock al confirmar ventas. Anulación de productos confirmados solo OWNER con elección RESTOCK/NO_RESTOCK; dinero conservado. Se habilita confirmación comercial de productos, sin afirmar cobro de mostrador.

Dos migraciones incrementales locales sin reset ni cambios remotos. Validación y límites en [inventario](features/actividad-4-inventario/validation.md). La restricción histórica de productos solo en borrador se sustituye para este nuevo alcance; caja, pagos de productos, mínimos/alertas y devoluciones parciales siguen pendientes.
## Evolución comercial 4.2, 4.3 y 4.6 — 2026-10-22

Tras aprobación «Vamos con eso», se implementaron localmente cobros de productos, caja única y mínimos por producto mediante seis migraciones incrementales. No se inspeccionó ni modificó base remota. Evidencia y límites en [validación comercial](features/actividad-4-cobros-caja-alertas/validation.md): 272 pruebas SQL, 36 operaciones API nuevas, 114 Angular, build y lint público correctos. Recorrido visual manual de los nuevos flujos pendiente.
