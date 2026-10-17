# Plan técnico — Fase 3

Estado: aprobado el 2026-10-17 e implementado incrementalmente en identity-dev.

## Contexto

Revisados skill, reglas, estructura de las cuatro tablas, servicios/página de empleados y referencias de agenda. Hay tres migraciones locales (identidad, clientes/mascotas y servicios/precios). Las tablas laborales del modelo son mayormente nullable y carecen de protección de solapamientos; Angular todavía permite elegir/cambiar perfil y consulta todos los perfiles.

## Secuencia aprobada

1. Preflight de solo lectura en identity-dev: tablas presentes, migraciones y perfiles seleccionables, sin imprimir información personal o claves. No reset ni importación completa de Pandas11.sql.
2. Crear migración con Supabase CLI: cuatro tablas/skill_level y relaciones/índices del modelo. UUID/timestamps con defaults; profile_id único/obligatorio, employee_id requerido en turnos y nullable en bloqueos globales; días/rangos/horas obligatorios y motivo no vacío. Documentar y reflejar endurecimiento en el modelo, sin convertirlo en parche remoto automático.
3. Implementar protección concurrente de turnos solapados mediante operaciones controladas que serialicen cambios por empleado/día (y globalmente para horario comercial), con lectura de conflicto bajo bloqueo antes de escribir. Revocar escritura directa que eluda el protocolo. Usar intervalos semiabiertos; no impedir coincidencias entre bloqueos, pero unirlos al calcular.
4. Helpers/RPC con search_path seguro y ejecución mínima; permisos/RLS de dominio según matriz. Leer nombre asociado de manera controlada sin conceder profiles.read global a STAFF. Creación/asociación no asigna roles. Impedir cambio de profile_id; autor del bloqueo desde auth.uid(), no payload.
5. Sembrar horario comercial confirmado, sin crear empleados/turnos ficticios persistentes. Aplicar nueva migración solo localmente y de forma incremental, preservando datos actuales; si el preflight detecta conflicto, presentar conciliación antes de aplicar.
6. RPC de ventanas y verificación de intervalo: fechas de negocio convertidas explícitamente en America/Lima, recurrencia por weekday, estado empleado/perfil y habilidad; resta de bloqueos globales/personales, unión de solapados y límites exactos. Separar cobertura laboral de permiso de nuevo inicio hasta 17:00. Exigir turno que cubra fin extendido; no usar 18:00 como corte absoluto de finalización.
7. Reutilizar EmpleadosComponent y servicios existentes con guardado asíncrono confirmado/paginación. Agregar sección de turnos, horario del local, bloqueos y consulta por fecha/intervalo. Indicar claramente que falta ocupación automática de citas/recojos; no adaptar AppointmentsService silenciosamente.
8. Alinear guard, sidebar y botones con permisos. STAFF consulta y no edita. Fuera del alcance: portal público de horarios, asignación de citas, precios de transporte, pagos o roles Auth.
9. Tests SQL/API con fixtures únicos y limpieza propia: solapamientos concurrentes, turnos partidos/consecutivos, bloqueos globales/personales/multidía, unión sin doble descuento, perfiles inactivos, habilidad, domingo/feriados/17:00 y fin después de18 con turno extendido. Angular: validación, límites y carga/error de disponibilidad. Repetir Fases 0–2, lint/tipos/build.
10. Actualizar arquitectura, baseline, roadmap, reglas confirmadas y README con evidencia y límites. No convertir disponibilidad laboral en disponibilidad real de agenda sin incorporar la fuente de ocupación.

## Impacto previsto

Pandas11.sql, nueva migración SQL, tests y script API; página/servicio de empleados, componentes laborales compartidos dentro de estructura existente, rutas/sidebar/permisos y documentos SDD. Sin dependencias NPM nuevas ni cambios en producción. No aplicar reglas horarias aún no confirmadas.

## Límite aprobado

La disponibilidad de esta fase es laboral menos bloqueos registrados. La UI declara la falta de ocupación automática de citas/recojos. Integrar esa fuente, reservar capacidad y resolver el contrato de agenda siguen fuera del alcance.

## Aprobación y decisiones de implementación

El usuario autorizó implementar mediante «Vamos implementala», incluidas las cuatro decisiones de requirements.md. No se reutiliza una autorización de otra fase.

- El mutex transaccional de turnos es global, también para turnos personales. Es una serialización más conservadora que empleado/día: cubre movimientos entre empleados/días y evita ordenaciones de locks. Se conserva concurrencia en lecturas. No se permiten escrituras directas por REST que lo eludan.
- Para esta fase se usan multirangos de PostgreSQL 17: unión de turnos/bloqueos, intersección comercial y resta sin doble descuento. Se conservan cierres intermedios; la extensión se aplica solo al turno que cubre el cierre comercial final.
- Las entradas de bloqueo son fechas/horas de pared sin offset y la conversión Lima se realiza en SQL. Se conserva precisión de segundos al editar.
- work_calendar devuelve JSON agregado de la configuración seleccionada; search_employees pagina y cuenta en servidor. No se concede lectura global de profiles a STAFF.
- Se adapta la tabla compartida únicamente con tipos nativos de hora/fecha-hora y total remoto correcto. Guardado confirmado y contratos anteriores se conservan.
- Sin empleados, turnos personales o bloqueos persistentes inventados. Solo se siembran los seis horarios comerciales confirmados.

Evidencia y límites en [validation.md](validation.md).
