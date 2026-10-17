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
