# Informe del modelo Pandas11.sql

Fecha: 2026-10-17. Revisión estática del archivo local; no ejecutado en PostgreSQL.

## Actualización — 2026-10-21

La tabla H-01 a H-23 y el dictamen siguientes describen el estado del 2026-10-17. Para el estado actual consultar la [conciliación individual](conciliation.md): las fases posteriores ya cubren varios controles y algunas ampliaciones siguen fuera del alcance operativo. H-01/H-02 tienen seguimiento en [validación](validation.md).

## Dictamen histórico

La estructura es una base útil, pero no está lista para convertirse directamente en una migración. Contiene un error de sintaxis, restricciones insuficientes y faltan mecanismos para reglas operativas confirmadas. El modelo remoto sigue desconocido.

## Elementos adecuados

- Perfil vinculado por FK a `auth.users` y relaciones rol–permiso/usuario–rol mediante claves compuestas.
- Clientes sin cuenta permitidos por `clients.profile_id` nullable, coherente con RN-09.
- Cita como cabecera y servicios por mascota como detalle; permite varios perros, pero el negocio aún debe confirmar el límite por cita.
- FKs compuestas del detalle aseguran que mascota y cita correspondan al mismo cliente.
- Precios y duraciones de detalle como snapshots, adecuados para conservar lo acordado.
- Tarifas por tamaño y pelaje con `NULLS NOT DISTINCT`, útil para evitar reglas comodín duplicadas.
- Timestamps con zona para citas y separación de notas internas.
- Recojo y transporte ya tienen campos iniciales en cabecera.
- `pet_size` ya incluye correctamente la coma después de `TOY`: el error histórico está corregido.

## Hallazgos y cambios recomendados

| ID | Prioridad | Evidencia actual | Cambio recomendado |
|---|---|---|---|
| H-01 | Bloqueante | `appointments.pickup_fee` termina con `;` dentro de CREATE TABLE, línea 326 de esta revisión | Sustituir por coma al implementar; impide ejecutar correctamente el CREATE TABLE |
| H-02 | Alta | Cuatro FKs de `user_roles`/`role_permissions` se declaran inline y otra vez al final | Conservar una definición por relación, con nombre y política de borrado acordada; las duplicadas no son un error sintáctico pero agregan restricciones redundantes y acciones diferentes |
| H-03 | Alta | `CHECK` de fechas/precios/duraciones con columnas nullable | Añadir NOT NULL donde sea obligatorio según estado y CHECK locales. CHECK no rechaza por sí mismo NULL. Permitir borradores solo mediante reglas explícitas |
| H-04 | Alta | Sin RLS/políticas/GRANT en este archivo; funciones externas solo cubren parte de identidad | Versionar seguridad de Fase 0, sin confundir modelo relacional con autorización. Después proteger también tablas del negocio |
| H-05 | Alta | `appointment_item_staff` solo registra pares item/empleado | Añadir intervalos y etapa del trabajo o entidad de asignaciones temporales; permitir baño seguido de corte por distinto trabajador, RN-03/RN-07/RN-10 |
| H-06 | Alta | No existe reserva temporal por trabajador para traslado | Modelar tarea de recojo, trabajador, inicio/fin y vínculo a cita; impedir que el mismo trabajador atienda mientras transporta, RN-06 |
| H-07 | Alta | Índices temporales no impiden solapamientos | Diseñar ocupación unificada de trabajador para servicio y traslado, con restricción de exclusión o operación transaccional serializada. Dos tablas con exclusiones independientes no impiden conflictos cruzados |
| H-08 | Alta | `skill_level` y `requires_specialist` existen, sin validación de asignación | Validar habilidad y actividad del empleado en escritura transaccional, no solo UI. El enum actual puede bastar para baño/corte; no es obligatorio introducir catálogo nuevo |
| H-09 | Alta | `source`, `deposit_required`, estado y pago no tienen regla conjunta | Para autorreserva, snapshot S/ 20 y confirmación solo tras pago verificado por owner; cita creada por personal sin adelanto obligatorio, RN-08/RN-09 |
| H-10 | Alta | `verified_by` es FK a cualquier perfil; falta `verified_at` | Registrar verificador/fecha y autorizar transición por owner; FK no acredita rol. Verificar origen, importe y estado del pago en operación atómica |
| H-11 | Alta | `allergies` ahora boolean; Angular lo trata como texto | Decidir booleano más detalle (`has_allergies`/descripción) o conservar texto. Adaptar contrato y migrar datos explícitamente sin perder información |
| H-12 | Alta | Agenda Angular consulta `appointment_services`, fecha/horas separadas y empleado como perfil; SQL usa items, timestamps y employees | Acordar modelo canónico y migrar contrato de forma coordinada. El estado `scheduled` de Angular tampoco existe en enum SQL |
| H-13 | Media | No hay representación separada de último inicio; horario de cierre puede confundirse con fin obligatorio | Configurar lunes–sábado, 07:00–18:00, último inicio 17:00; permitir finalización posterior y feriados sin cierre automático, RN-01. Confirmar zona horaria antes de validar |
| H-14 | Media | Tarifas permiten duración por tamaño, pero no hay resolución/prioridad implementada | Definir prioridad de coincidencias y snapshot por cita; no fijar una/dos horas universalmente, RN-04/RN-05 |
| H-15 | Media | Precio de recojo puede ser negativo/nulo; falta trazabilidad de cotización | CHECK no negativo, obligatoriedad condicionada, dirección válida si requiere recojo, cotizado por/fecha y duración estimada. Precio manual por hora/distancia, sin inventar fórmula; solo ida, RN-06 |
| H-16 | Media | Totales y snapshots aceptan valores arbitrarios | Validar total de servicios más transporte y montos no negativos; computar de forma confiable en transacción. Decidir qué hacer si total menor al adelanto de S/ 20 |
| H-17 | Media | UUIDs/timestamps en muchas tablas carecen de defaults; booleanos con DEFAULT admiten NULL | Proponer defaults de UUID/now y NOT NULL según dominio. No es error que el cliente genere UUID, pero los defaults facilitan otros consumidores |
| H-18 | Media | Datos de mascota/vacunas y precios base sin checks completos | Peso positivo cuando exista; muerte no anterior a nacimiento; vigencia no anterior a aplicación; precio base no negativo y duración positiva; nombres no vacíos donde sean obligatorios |
| H-19 | Media | `operation_code` solo tiene índice no único | No impide reutilizar comprobante. Acordar clave de idempotencia/proveedor y unicidad para pagos externos pertinentes; no imponer unicidad global que afecte efectivo o reembolsos |
| H-20 | Media | ENUM permite PLIN/CARD/TRANSFER además de YAPE/CASH | Restringir operaciones admitidas según RN-02; no eliminar valores de un enum remoto sin inventario y migración revisada |
| H-21 | Media | Índices de puentes favorecen solo primera columna de PK | Evaluar índices inversos `user_roles(role_id)` y `role_permissions(permission_id)`, y FKs de consultas habituales; evitar duplicar índices ya cubiertos |
| H-22 | Media | Borrado Auth CASCADE a profiles, pero otras FKs pueden impedirlo o eliminar asignaciones | Definir conservación de historial y desactivación. No asumir que borrar Auth siempre funcionará; probar la cadena completa |
| H-23 | Media | `audit_log` existe sin generación automática ni restricciones de escritura | Registrar cambios sensibles desde lógica confiable; impedir manipulación por cliente. Decidir alcance de auditoría para Fase 0 sin agregar tablas fuera de su plan por defecto |

Las reglas entre filas, roles, sumas o reservas no deben implementarse con CHECK que consulte otras tablas: usar FKs, exclusiones y/o operaciones transaccionales apropiadas. Definir intervalos semiabiertos [inicio, fin) para permitir citas consecutivas sin conflicto. La capacidad de dos deriva de dos trabajadores disponibles; no imponer dos perros por hora ni un máximo permanente de dos empleados sin decisión adicional.

## Cambios recientes y documentación previa

`photo_url` está presente y Angular todavía no lo incluye en sus consultas de mascota. Su uso requiere definir Storage/acceso en una etapa separada; una URL no garantiza privacidad. `allergies` boolean y los campos de recojo son cambios del modelo actual que la documentación histórica de arquitectura no describe por completo. Este informe registra la diferencia; no modifica automáticamente el código.

## Decisiones pendientes

- ¿Conservar detalle de alergias además del indicador?
- ¿Adoptar este esquema por items como modelo objetivo y ajustar Angular después?
- ¿Aprobar agenda con etapas temporales y ocupación unificada de servicio/recojo?
- Siguen pendientes duraciones por tamaño, caducidad de reserva, cancelaciones, zona horaria y límite de perros por cita.
- Para Fase 0 siguen pendientes matriz de permisos y bootstrap del owner. No derivar permisos aprobados de este informe.

## Fuentes técnicas

- [PostgreSQL: restricciones](https://www.postgresql.org/docs/current/ddl-constraints.html): comportamiento de NULL, claves y límites de CHECK.
- [Supabase: RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): autorización de tablas expuestas.

## Seguimiento — 2026-10-17

H-01 y H-02 corregidos en el archivo local tras autorización: coma de pickup_fee y retirada de cuatro FKs redundantes. La tabla anterior describe el estado previo. No se aplicaron cambios a una base de datos; resto pendiente.
