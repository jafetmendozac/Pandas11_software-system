# Seed local — Fases 0 a 4

Fecha: 2026-10-18. Soporte de pruebas solicitado por el usuario; no cambia funcionalidades, esquema, políticas ni reglas de negocio aprobadas.

## Uso

Requiere Docker, Supabase CLI, `psql` y las dependencias ya instaladas. Desde la raíz:

```sh
supabase start
supabase migration up --local
npm run seed:local
npm run start:local
```

El seed rechaza otra URL de API o PostgreSQL distinta de `127.0.0.1:55321/55322` y comprueba las cinco migraciones antes de crear cuentas. No ejecuta migraciones, reset, link ni push. El comando de migración anterior aplica únicamente migraciones locales pendientes y es independiente del seed.

`supabase/seed.sql` mantiene el arranque automático sin cuentas demo. El seed completo es optativo mediante `scripts/seed-local.mjs`, porque crea cuentas confirmadas usando Auth Admin y citas usando las RPC reales, en lugar de insertar usuarios directamente en el esquema Auth. Las claves privilegiadas se obtienen de la CLI solo en Node y no se imprimen ni se incluyen en Angular.

## Cuentas ficticias

Contraseña inicial compartida, pública y exclusiva de estas cuentas locales: `Pandas11-Demo-2026!`.

| Email | Acceso para probar |
|---|---|
| `demo.fases.owner@example.test` | Seguridad, roles y gestión de las cinco fases |
| `demo.fases.admin@example.test` | Gestión operativa; también empleado de baño y corte |
| `demo.fases.staff@example.test` | Consulta operativa; también empleado asistente de baño |
| `demo.fases.client@example.test` | `/mis-datos`, `/catalogo` y perfil propio; sin panel interno |

Las habilidades laborales no conceden permisos de aplicación. Se mantienen las asignaciones CLIENT predeterminadas por el trigger de registro; OWNER/ADMIN/STAFF reciben además su rol correspondiente. No se modifican los permisos de los roles de sistema.

## Inventario y recorrido de prueba

Todos los nombres comienzan por DEMO. Precios, tiempos por tamaño/pelaje, direcciones y antecedentes son ficticios: **no son tarifas comerciales aprobadas**.

| Fase | Fixtures y comprobación manual |
|---|---|
| 0 | Cuatro usuarios confirmados y perfiles activos. OWNER administra seguridad; ADMIN gestiona; STAFF consulta; CLIENT accede solo a sus datos. Probar cada cuenta en una sesión separada |
| 1 | Tres clientes: Lucía vinculada a CLIENT, Mateo sin cuenta y un cliente retirado. Cuatro mascotas: Luna y Toby de Lucía, Rocky de Mateo y una mascota retirada. Dos vacunas, una vigente y otra vencida al crear el seed; notas internas de cliente y mascota separadas de notas comunicables |
| 2 | Baño, baño y corte, servicio interno no visible y servicio inactivo. Cuatro reglas de baño para probar exacta → tamaño → pelaje → general; baño y corte usa la base. El baño TOY dura30min como ejemplo ficticio; no cambia la regla general del negocio |
| 3 | Dos empleados: ADMIN especialista, STAFF asistente. Turnos lunes–sábado 07–19 y07–18 respectivamente; domingo sin turno. Un bloqueo de recojo manual el lunes11–12 para el asistente y una ausencia del especialista el martes13–14. No se modifica business_hours |
| 4 | Tres citas internas: dos mascotas con relevo, final después18 y cancelación con motivo. Todas con observaciones internas separadas, origen INTERNAL y adelanto obligatorio0. No se crean pagos |

La fecha se elige una vez: próximo lunes según America/Lima, guardado en metadata administrativa de la cuenta OWNER demo. En esta ejecución: **2026-10-19**. Las siguientes ejecuciones conservan esa fecha.

Agenda inicial de ese lunes:

| Cita | Detalle | Total ficticio |
|---|---|---|
| Dos mascotas y relevo | Luna: baño08–09 asistente → corte09–10 especialista; Toby: baño08–08:30 especialista | S/115.00 |
| Fin después18 | Rocky: baño y corte17–19 especialista, con turno explícito hasta19 | S/90.00 |
| Cancelada | Rocky: baño14–15 asistente, cancelada por OWNER con motivo; intervalo liberado | S/40.00 |

Cotizaciones iniciales de baño: SMALL/LONG S/55 y60min; TOY/LONG S/25 y30min (tamaño gana a pelaje); MEDIUM/LONG S/50 y60min; LARGE/SHORT S/40 y60min. Baño y corte: base S/90 y120min. Ejemplos relacionados con RN-01/03/04/05/07/09/10/13/14/15; no resuelven las preguntas pendientes del negocio.

## Repetición, conservación y recuperación

- Los UUIDs de fixtures usan el espacio reservado `d0400000-0000-4000-8000-*`. Se inserta con `ON CONFLICT ... DO NOTHING`, sin UPDATE ni DELETE de datos existentes. Se comprueban vínculos/marcas antes de reutilizar UUIDs. No renombrar las marcas de clientes/servicios si se quiere repetir sin una colisión de seguridad.
- Las cuentas existentes deben tener la marca administrativa `local_demo_seed=pandas11-phases-0-4-v1`. Una coincidencia de email sin esa marca aborta antes de conceder roles o crear cuentas. No se toman cuentas ajenas ni se restablecen contraseñas. Se completan asignaciones faltantes de los cuatro roles demo, conservando roles adicionales.
- Las citas existentes se reconocen por cliente y marcador en client_notes; se conservan con sus estados, versiones y notas. No retirar esos marcadores si se desea repetir el seed. No se desplazan automáticamente citas cuando pasa la fecha.
- Auth, fixtures SQL y cada RPC son pasos separados: una interrupción puede dejar datos parciales. SQL agrupa los fixtures en una transacción; las citas pasan por sus validaciones transaccionales reales. Corregir la causa y repetir; una cita ya creada se conserva, incluso si quedó sin nota o sin cancelar durante una interrupción, y debe revisarse manualmente.
- Si se cambiaron horarios, tarifas, contraseñas o perfiles demo, la carga puede detenerse por validación. No se fuerza disponibilidad ni se restauran cambios. Revisar la causa y los datos parciales. Si la fecha almacenada pasó y falta una cita, el script pide revisión en vez de fabricar reservas pasadas.
- No hay limpieza automática ni comando de borrado. No hace falta resetear la instancia para cargar o repetir el seed.

## Validación y límites

```sh
node --check scripts/seed-local.mjs
node scripts/test-local-seed.mjs
supabase test db
git diff --check
```

`test-local-seed.mjs` comprueba por lectura/login el estado inicial esperado, permisos, RLS, aislamiento de notas, las cinco prioridades de tarifa, relevo, ocupación, bloqueo, cancelación y fin19 Lima. Si se editan manualmente los ejemplos, sus comprobaciones iniciales pueden dejar de pasar. No sustituye las suites completas de cada fase.

No se falsea el reloj ni se fuerzan estados históricos: para iniciar/completar o marcar NO_SHOW hay que llegar al inicio programado o crear otra cita válida. Las pruebas API de Fase4 ya cubren esas transiciones con fixtures aislados. No se crean autorreservas, pagos, transporte automático ni tablas de fases futuras. No se conectó a una base remota. La experiencia visual en navegador requiere revisión manual del usuario.

Resultados comprobados el2026-10-18:

| Comprobación | Resultado |
|---|---|
| Primera carga `npm run seed:local` | Correcta; cuatro cuentas y fixtures de las cinco fases; citas para2026-10-19 |
| `node scripts/test-local-seed.mjs` | 41 comprobaciones correctas por login/API/RLS y disponibilidad |
| Repetición del seed con comparación de huellas antes/después | Las20 tablas públicas conservan exactamente sus filas; Auth conserva cuentas, contraseñas y metadata. Solo cambia la actividad normal de inicio de sesión |
| `supabase test db`, con seed persistente presente | 112/112 correctas en los cinco archivos de pruebas |
| Comprobación sintáctica de ambos scripts y espacios | Correcta |

No se repitieron build ni pruebas Angular porque no se cambió código de aplicación. Tampoco se presentan las ejecuciones API históricas de cada fase como nuevas pruebas de esta tarea. Revisión visual manual pendiente; sin commits, dependencias nuevas o migraciones adicionales.
