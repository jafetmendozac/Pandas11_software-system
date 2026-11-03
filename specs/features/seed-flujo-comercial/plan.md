# Plan — Seed local del flujo comercial

Fecha: 2026-10-25 (America/Lima). Estado: **aprobado por el usuario** mediante «Vamos entonces», con nombres visibles realistas y ficticios. Requisitos: [requirements.md](requirements.md).

## Contratos revisados

El seed actual usa Auth Admin solo para crear cuentas locales, SQL para fixtures base y RPC autenticadas para citas. Las migraciones posteriores añaden RPC de pagos, ventas, inventario y caja con RLS y permisos. `Pandas11.sql` y migraciones coinciden en la separación entre `payments` (cita) y `sale_payments` (artículos); una venta mixta referencia una cita completada. `confirm_sale` consume stock y `verify_payment`/`verify_sale_payment` requieren caja abierta. El esquema remoto no se ha consultado.

## Secuencia propuesta

1. Extender el seed optativo mediante un script comercial separado, invocado tras `npm run seed:local`. Verificar URL/API local, migraciones comerciales aplicadas, cuentas demo marcadas y ausencia de caja abierta ajena. Reutilizar las cuentas sintéticas existentes; no cambiar contraseñas ni roles de terceros.
2. Crear un escenario comercial propio con marcadores y claves de solicitud estables. Para la cita, escoger un lunes pasado con cobertura laboral válida, libre de cruces con las citas demo, y completar CONFIRMED → IN_PROGRESS → COMPLETED mediante RPC. No cambiar las tres citas del seed anterior. Guardar referencias para poder reanudar o detectar estado parcial.
3. Crear productos demo con SKU reservado y precio ficticio; fijar mínimo; cargar stock inicial mediante `record_inventory_movement`. Crear una venta mixta ligada a la cita y una venta de mostrador con artículos, confirmarlas y observar sus salidas de inventario. No tocar productos o saldos preexistentes ajenos.
4. Abrir una caja demo con fondo ficticio. Registrar pagos PENDING de cita y artículos mediante las cuentas ADMIN/OWNER, y verificarlos con OWNER. Comprobar que el pago de cita solo afecta el saldo de servicios y que cada verificación crea un ingreso único en caja. Cerrar la caja con un contado ficticio y diferencia explícita. Si hay caja OPEN ajena, abortar antes de crear transacciones comerciales.
5. Hacer la carga repetible: buscar cada entidad por marcador/SKU o `request_id`, comprobar su identidad, versión y estado, y continuar únicamente pasos inequívocos. No actualizar ni eliminar filas existentes. Si una intervención manual impide el recorrido, informar el punto exacto y parar.
6. Ampliar `specs/seed-local.md` y `supabase/README.md` con comando, cuentas, recorrido por `/agenda`, `/pagos`, `/ventas`, `/productos` y `/caja`, cifras esperadas, reintentos y límites. Añadir prueba de lectura/API del estado sembrado y `validation.md` con evidencia real.

La implementación utiliza las fichas existentes de Lucía Herrera y Mateo Ríos, el servicio de baño y los empleados ya sembrados. El seed base normaliza únicamente nombres antiguos intactos de sus propios UUID; los cambios manuales no se sobrescriben. Los productos son «Champú suave 250 ml» y «Pañuelo para mascota». Los correos y la contraseña conservan su identidad técnica local para no romper acceso o trazabilidad.

**Ajuste técnico observado en la ejecución:** `save_internal_appointment` rechaza una cita pasada. Para mostrar un cobro final sin alterar las tres citas previas, la nueva cita histórica se inserta una sola vez mediante SQL local privilegiado, bajo el mismo mutex de agenda y con `private.validate_appointment` dentro de la transacción. La transición a IN_PROGRESS y COMPLETED sí usa las RPC autenticadas. Esto no amplía el dominio ni cambia esquema/RLS; la validación real se registra en `validation.md`.

## Validación prevista

- Sintaxis Node y `git diff --check`.
- Primera ejecución, segunda ejecución sin duplicados, interrupción/reanudación controlada y protección de caja ajena en la instancia local.
- Comprobación API de cita, saldos separados, movimientos de inventario, alerta de mínimo, dos tipos de pago y cierre de caja; RLS de OWNER/ADMIN frente a STAFF/CLIENT.
- `supabase test db`, pruebas API comerciales pertinentes y build Angular solo si se toca código Angular (no está previsto).

No se propone migración, cambio de reglas, dependencias, reset, commit ni despliegue. Cualquier incompatibilidad del esquema local se documentará antes de resolverla.
