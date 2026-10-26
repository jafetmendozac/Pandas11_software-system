# Validación — Seed local comercial

Fecha: 2026-10-25 (America/Lima). Estado: seed cargado y comprobado en Supabase local; recorrido visual manual pendiente.

## Alcance implementado

- `scripts/seed-local.mjs`: nombres visibles de personas, mascotas y servicios coherentes. Ajusta únicamente valores antiguos intactos de sus UUID y conserva cambios manuales; las cuentas técnicas y citas existentes mantienen identidad.
- `scripts/seed-commercial-local.mjs`: cita interna completada, dos productos con carga inicial y mínimo, venta mixta y de mostrador, pagos de cita y productos separados, y caja con cierre. La cita histórica es un fixture SQL local con `private.validate_appointment` transaccional; el resto del recorrido usa RPC autenticadas y marcadores estables. No hace reset ni usa datos reales.
- `scripts/test-commercial-seed.mjs`: comprobación de lectura de cita, saldos, stock, movimientos, alerta, caja y denegación STAFF/CLIENT.
- `package.json`, `specs/seed-local.md` y `supabase/README.md`: comando y recorrido manual.

## Evidencia

| Comprobación | Resultado |
|---|---|
| `node --check` de los cuatro scripts modificados o nuevos | Correcto |
| `git diff --check` | Correcto para archivos versionados |
| Revisión de espacios finales en archivos nuevos | Correcta |
| `npm pkg get scripts.seed:commercial` | Apunta al script comercial |
| `pg_isready -h 127.0.0.1 -p 55322` | PostgreSQL local aceptó conexiones tras habilitar acceso a Docker |
| `npm run seed:local` | Correcto; conservó las tres citas originales y normalizó nombres técnicos antiguos de sus fixtures |
| Primera carga `npm run seed:commercial` | Se detuvo sin crear la cita: la RPC prohíbe reservas pasadas; su transacción se revirtió. Se ajustó la creación histórica como fixture SQL local validado |
| Carga ajustada `npm run seed:commercial` | Correcta: cita del 2026-10-12, dos ventas y caja cerrada |
| Segunda ejecución `npm run seed:commercial` | Correcta; la prueba posterior mantuvo exactamente dos cargas, tres salidas de inventario y cinco movimientos de caja |
| `node scripts/test-local-seed.mjs` | 41 comprobaciones correctas; las tres citas iniciales permanecen |
| `node scripts/test-commercial-seed.mjs` | 19 comprobaciones correctas de nombres, cita, saldos separados, stock, mínimo, caja y RLS; repetidas tras la segunda carga |
| `supabase test db` | 272/272 pruebas correctas en nueve archivos con ambos seeds presentes |
| `node scripts/test-commercial-api.mjs` | Primer intento: error 504 transitorio de Auth durante limpieza; dos cuentas sintéticas residuales retiradas por Auth Admin. Repetición: 36 operaciones correctas, salida 0 y cero cuentas `commercial-%@example.test` |

Una consulta inicial de `supabase status` fue rechazada por la revisión automática porque el comando preparado habría mostrado `DB_URL`, que puede contener credenciales. Tras la autorización del usuario para Docker, los scripts existentes consultaron el estado internamente sin imprimir claves ni URLs. No se ejecutó el comando rechazado. La primera prueba API comercial falló únicamente al retirar cuentas por timeout de Auth; se comprobó la limpieza final sin borrar cuentas del seed.

## Trazabilidad y límites

SEED-C01: guarda local, migraciones y marcadores comprobados al ejecutar. SEED-C02–C04: cita, ventas, stock, pagos separados y caja verificados por API/RLS según RN-09, RN-12, RN-16–RN-19 y RN-22–RN-30. SEED-C05: segunda ejecución y recuentos de movimientos comprobados; la recuperación de toda interrupción posible no fue simulada. SEED-C06: documentación y prueba de lectura completadas; recorrido visual en navegador pendiente de aceptación del usuario.

No se modificó Angular, migraciones, modelo SQL ni producción. La compilación Angular no es pertinente a este cambio de scripts y documentación. No se comprobó visualmente el recorrido en navegador.
