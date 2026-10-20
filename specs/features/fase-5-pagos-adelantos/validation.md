# Validación — Fase 5

Fecha: 2026-10-18. Estado: plan aprobado mediante «Si apruebo»; implementado localmente. Pruebas y revisión visual local completadas.

## Evidencia de preparación

- Revisados modelo local, cinco migraciones, reglas RN-02/RN-08/RN-09/RN-12/RN-13, contratos de agenda, rutas, scripts npm y configuración de Storage.
- Git antes de la documentación: limpio; HEAD `4b6c8a4` (`feat: pagina de inicio publico`). No acredita estado remoto ni resultados nuevos de pruebas.
- D5-01/D5-02/D5-03 respondidas e incorporadas: OWNER/ADMIN registran y solo OWNER verifica; operación/referencia sin archivos; cobro final sin adelanto interno. Plan aprobado posteriormente mediante «Si apruebo».
- La preparación fue exclusivamente documental. Después de la aprobación se implementaron Angular/modelo y dos migraciones aplicadas solo en Supabase local; sin dependencias nuevas ni cambios remotos.
- Revisión documental ejecutada: `git diff --check` correcto; los tres documentos nuevos sin espacios finales y con enlaces locales existentes. Nombres de scripts de regresión contrastados con `scripts/`. No se ejecutaron pruebas funcionales ni build porque todavía no hay cambios de implementación.
- Tras incorporar las respuestas, revisión repetida de los cinco documentos afectados: sin espacios finales ni enlaces locales ausentes; `git diff --check` correcto. RN-16/RN-17/RN-18 registran las decisiones confirmadas, separadas de las concreciones técnicas pendientes de aprobación.

## Matriz de validación ejecutada

| Requisitos | Pruebas y evidencia | Estado |
|---|---|---|
| F5-01/F5-05 | Defaults/FK/NOT NULL/constraints; importes vacíos, nulos, cero, negativos, NaN/infinito y exceso de decimales; tipo/método inválidos | Correctas: SQL/API/Angular según corresponda |
| F5-02/F5-03/F5-06 | Cinco métodos; pagos parciales/combinados; PENDING/FAILED sin descontar; PAID exacto; cero de cita sin pago artificial | Correctas: SQL/API/Angular según corresponda |
| F5-04/F5-10 | OWNER/ADMIN registran y consultan; solo OWNER verifica/rechaza; STAFF/CLIENT/anon/inactivos sin permiso; falsificación de actor/fecha/estado; accesos directos/RPC; fuga por agenda | Correctas: SQL/API/Angular según corresponda |
| F5-07 | Reintentos tras respuesta perdida; request_id repetido con payload idéntico/distinto; dos verificaciones o verificación/rechazo con versión vieja | Correctas: SQL/API/Angular según corresponda |
| F5-08 | Dos sesiones confirman importes cuya suma excede saldo; confirmar mientras se reduce total; rollback de agenda completo; no confiar solo en tests secuenciales | Correctas: SQL/API/Angular según corresponda |
| F5-09 | COMPLETED no permite cancelación en Fase 4. API prueba esa denegación; datos históricos sintéticos cancelados/no asistidos conservan recibidos y rechazan nuevas confirmaciones. No se inventa una transición para ensayar una carrera operativa inexistente | Correcto dentro del flujo actual; no se ensayó cancelación concurrente de COMPLETED como operación válida |
| F5-11 | Operación/referencia: límites, espacios/vacíos, efectivo sin operación; rechazar proof_url/archivos; sin cambios de Storage | Correctas: SQL/API/Angular según corresponda |
| F5-12 | Cobro interno solo al finalizar; DEPOSIT interno rechazado; sin vía ONLINE operativa ni obligación de S/20 en citas internas | Correctas: SQL/API/Angular según corresponda |
| F5-13 | Filtros y paginación estable con más de1000 fixtures; resumen de SQL independiente de página; búsquedas con respuesta obsoleta | Correctas: SQL/API/Angular según corresponda |
| F5-14 | Angular prueba modales, texto seguro, permisos, doble envío, errores y respuestas obsoletas. Revisión Chrome móvil/oscuro/RTL adicional | Correcto: Angular y Chrome local |
| F5-15 | Regresiones de identidad, fichas, tarifas, empleados y agenda; fechas America/Lima y snapshots conservados; Angular y build | Correctas: SQL/API/Angular según corresponda |

## Comandos de validación

```sh
supabase migration list --local
supabase db lint --local
supabase test db
node scripts/test-identity-api.mjs
node scripts/test-clients-pets-api.mjs
node scripts/test-services-prices-api.mjs
node scripts/test-employees-availability-api.mjs
node scripts/test-appointments-api.mjs
node scripts/test-payments-api.mjs
node node_modules/typescript/bin/tsc --project tsconfig.app.json --noEmit --incremental false
node node_modules/typescript/bin/tsc --project tsconfig.spec.json --noEmit --incremental false
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
git diff --check
```

El script de pagos ya existe y se ejecutó únicamente contra55321. Supabase CLI, Docker, Chrome y pruebas locales se ejecutaron con la autorización del entorno tras la restricción inicial de sandbox. No se ejecutó reset ni pruebas contra producción.

## Trazabilidad y cierre pendiente

RN-02 requiere cinco métodos; RN-08 distingue registro de verificación y mantiene OWNER para adelanto de autorreserva, cuyo flujo ONLINE sigue fuera de alcance; RN-09 ratificada por D5-03 exige cobro final sin adelanto interno; RN-12 exige exactitud monetaria; RN-13 no concede automáticamente permisos de pagos. PN-05/PN-07 permanecen abiertas, sin devoluciones o vencimientos inventados.

## Resultados observados en esta implementación

| Verificación | Resultado |
|---|---|
| Preflight Supabase CLI + PostgreSQL local | Cinco migraciones anteriores aplicadas; payments no existía |
| Migraciones incrementales | 20261018225928 y20261018230255 aplicadas con migration up --local, sin reset; migraciones anteriores intactas |
| supabase db lint --local | Sin errores de esquema |
| supabase test db | 137/137, seis archivos; incluye25 nuevas pruebas de pagos |
| scripts/test-payments-api.mjs | 107 comprobaciones correctas; cinco métodos, roles, RLS, idempotencia, importes, exactitud, estados, concurrencia y paginación1003 pagos |
| API Fases 0–4, repetidas en secuencia | 26 +42 +50 +72 +75 =265 comprobaciones correctas |
| Tipos app/spec sin emisión | Correctos |
| Angular ChromeHeadless | 90/90 correctas tras la corrección de recuperación de errores; incluye13 pruebas nuevas respecto a77 anteriores |
| Producción | Build final de producción correcto,3.42MB, sin advertencias |
| Revisión documental | git diff --check correcto; nueve documentos revisados sin enlaces locales ausentes ni espacios finales |

Las pruebas API eliminan solo sus cuentas/UUIDs sintéticos. El test de concurrencia coordina conexiones reales usando el mutex; no simula dos llamadas secuenciales. Una sesión actualiza el total mientras la verificación espera y esta revalida después del bloqueo. La reducción por debajo de lo ya confirmado se rechaza y revierte.

## Límites

No se desplegó al esquema remoto. Sin autorreserva/adelanto operativo, devoluciones/correcciones, pasarelas ni adjuntos; estos límites fueron aprobados. El flujo actual no puede cancelar una cita COMPLETED ni cobrar una CONFIRMED, por lo que las alertas de pagos en canceladas se prueban con fixtures históricos privilegiados, sin ampliar estados públicos. La comprobación humana del dinero fuera del sistema no es automatizada.

## Revisión real en Chrome

Build con configuración local, generado en /private/tmp/pandas11-payments-build. Script CDP temporal fuera del repositorio; navegador con perfil temporal y cuentas/cliente/cita sintéticos propios, eliminados al terminar. No es una suite E2E incorporada al proyecto ni acredita funcionamiento remoto.

Resultado final correcto:

- Inicio de sesión por formulario Angular real y acceso OWNER a /pagos.
- Registro desde el modal: PENDING, sin descuento del saldo. Verificación desde la interfaz: PAID y saldo80.25 sobre total100.35 tras recibir20.10.
- ADMIN accede sin acciones de verificación; STAFF redirigido a /access-denied.
- Foco dentro del modal después de confirmar. Se corrigió la pérdida de foco al desaparecer la acción y se añadió la comprobación a la prueba Angular;90/90 correctas tras el cambio.
- Capturas1440×1050 y390×844; sin desborde horizontal en móvil ni RTL, también en oscuro; sin excepciones JavaScript ni conexiones Supabase remotas.
- Capturas finales inspeccionadas: /private/tmp/pandas11-payments-review-rI0Eaa/desktop.png y mobile-dark-rtl.png. Se generaron también owner-confirmed.png, mobile.png y mobile-detail.png. Son artefactos temporales, no archivos del producto.

Los primeros intentos del script no se contabilizan como éxito: la inyección directa de sesión recibió denegación y se sustituyó por el inicio de sesión real; otro intento pulsó antes de que terminara la carga del saldo y se ajustó la espera. El recorrido final usa controles habilitados y el flujo de acceso normal.

Para repetir manualmente: usar la configuración local, entrar como OWNER/ADMIN, completar una cita interna, registrar un cobro y comprobar que solo OWNER puede confirmarlo y reducir saldo. STAFF no debe entrar a pagos. Usar siempre datos de prueba.
