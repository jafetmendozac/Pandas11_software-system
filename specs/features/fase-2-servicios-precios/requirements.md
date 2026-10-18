# Fase 2 — Servicios y precios

Fecha: 2026-10-17. Estado: aprobado por el usuario el 2026-10-17; implementado localmente.

## Objetivo

Configurar servicios, duración, precio base y tarifas por tamaño/pelaje. Resolver de manera determinista el costo y duración de un servicio, indicando la tarifa utilizada. Reutilizar las pantallas existentes.

Modelo de referencia: `services` y `service_prices` de Pandas11.sql, FK service_id, enums pet_size (incluido TOY) y pet_coat_type, índice único `uq_service_prices_rule` con NULLS NOT DISTINCT. No asumir esquema remoto.

## Situación comprobada

Hay CRUD de servicios y tarifas; tarifas omiten TOY y no representan NULL como comodín. Vacíos numéricos se convierten a cero. No hay resolución de tarifas identificada; agenda usa base_price/base_duration_minutes. Solo identidad/clientes/mascotas tienen migraciones locales. El DBML histórico database.md no está en el árbol actual y no se toma como evidencia vigente.

## Reglas aprobadas

- RN-04/RN-05: las referencias de 1/2 horas no son universales; configurar duraciones por tamaño, sin inventar importes o tiempos reales.
- RN-07: conservar requires_specialist; calcular duración/precio no asigna personal ni valida disponibilidad.
- RN-06: cotización manual de transporte queda fuera; el resultado de esta fase es solo el servicio.
- Prioridad propuesta: tamaño+pelaje exactos → solo tamaño → solo pelaje → regla general (ambos NULL) → valores base del servicio.
- NULL en tamaño/pelaje significa «todos», no una categoría adicional. Si la entrada de cálculo desconoce una dimensión (NULL), solo pueden aplicar reglas comodín de esa dimensión.
- La tarifa ganadora aporta precio y duración completos. No combinar precio de una regla con duración de otra. Propuesta: ambos importes base y de tarifa obligatorios; precio >= 0, máximo dos decimales, duración entera > 0 minutos. Sin tarifa específica, usar base, nunca cero implícito.
- Precio expresado en PEN; devolver importe decimal exacto (texto decimal o tipo decimal seguro) y minutos, evitando redondeo monetario binario en el cálculo autoritativo PostgreSQL.
- Servicio inactivo no se cotiza. Servicio no visible no se expone ni calcula para CLIENT. No anon. No reactivar servicios automáticamente.
- Desactivar servicio conserva sus tarifas; tarifas específicas pueden corregirse/eliminarse por personal autorizado. No hay snapshots de citas en esta fase; cambios no deben reescribir históricos futuros.

## Matriz aprobada

Permisos: `services.read`, `services.manage`, `service_prices.read`, `service_prices.manage`.

| Actor | Catálogo operativo y simulador | Gestión |
|---|---|---|
| OWNER/ADMIN | Todos los servicios/tarifas, incluido archivo | Crear/editar/desactivar servicios; crear/editar/eliminar tarifas |
| STAFF | Consulta y simulador, sin escritura | No |
| CLIENT activo | Solo servicios activos y visibles, sus tarifas y cálculo | No |
| Anon / perfil inactivo | Sin acceso | No |

Catálogo propio accesible fuera del panel; las pantallas administrativas requieren permiso de dominio además de panel.access. Asignaciones iniciales por migración privilegiada, manteniendo protección de roles de sistema.

## Criterios de aceptación

- F2-01: migración incremental de dos tablas, constraints/defaults/FK/índice único y RLS, sin reset ni alterar cuentas/datos actuales.
- F2-02: CRUD existente adaptado con validación frontend/SQL, guardado confirmado y error sin perder formulario; vacíos no se convierten a cero.
- F2-03: formularios admiten TOY y comodines NULL; impedir duplicados incluso en regla general o con una dimensión NULL.
- F2-04: función SQL autoritativa aplica los cinco niveles, acepta dimensiones opcionales y devuelve service_id, price, duration_minutes, regla/fuente y rule_id nullable.
- F2-05: simulador permite elegir servicio/tamaño/pelaje y muestra precio, minutos y procedencia; CLIENT solo calcula catálogo permitido. No consulta mascotas ajenas ni necesita IDs de mascota.
- F2-06: permisos/RLS aplican matriz, incluida consulta directa/RPC; no se filtran servicios ocultos/inactivos al cliente.
- F2-07: búsqueda/paginación estable en servidor evita truncar más de 1000 registros; carga/cálculo descarta respuestas obsoletas y notifica actualización de vista.
- F2-08: pruebas SQL/API cubren prioridades, NULL, cero válido, decimales, restricciones, duplicados, servicios ocultos/inactivos y roles; Angular prueba formularios/simulador y regresiones; build y lint correctos.

## Límites

No incorporar el cálculo a persistencia de citas hasta acordar su contrato; agenda actual sigue desalineada con SQL. No pagos, transporte, descuentos, impuestos, precios por peso, cálculo automático de tiempos por raza ni sumas de varias prestaciones. Valores reales los introduce el usuario; usar solo fixtures ficticios en pruebas.

## Decisiones aprobadas

El usuario aprobó prioridad tamaño antes que pelaje, tarifa completa sin mezclar campos, precio cero permitido y matriz. No se requieren precios reales para implementar el algoritmo, pero sin configurar tarifas no se puede afirmar adecuación comercial de los valores.

## Concreción técnica

El cálculo retorna price como texto decimal exacto y duration_minutes como entero. Los formularios de precio usan texto con validación decimal (punto como separador) para no perder precisión mediante Number. La migración usa numeric sin escala coercitiva y CHECK de dos decimales/valor finito; no redondea silenciosamente una entrada inválida. Las reglas confirmadas se registran como RN-11/RN-12 en business-rules.md.
