# Actividad 6 — Calidad, despliegue y transferencia

Fecha de corte: 2026-10-20 (America/Lima). Anexo para los puntos 6.1–6.4 de la [matriz S1–S14](matriz-seguimiento.md). Resume evidencia técnica local y prepara el registro de aceptación. No acredita una sesión de capacitación, entrega formal ni despliegue remoto. La **Actividad 6 del cronograma** es distinta de la Fase 6 SDD de reservas online.

## Estado por punto del cronograma

| Punto | Estado | Evidencia disponible | Pendiente de cierre |
|---|---|---|---|
| **6.1 Pruebas integrales y corrección de errores** | **Parcial** | Las [validaciones de Fases 0–5](baseline.md) registran pruebas SQL, API y Angular, regresiones, compilaciones y correcciones. La [Fase 5](features/fase-5-pagos-adelantos/validation.md) consigna la última ejecución amplia conocida: 137/137 SQL acumuladas, 107 comprobaciones API específicas de pagos, regresiones API de fases previas, 90/90 Angular acumuladas y build correcto. | Ejecutar y registrar una aceptación **integral del alcance final** con datos sintéticos y roles reales de prueba; revisar incidencias y repetir las pruebas afectadas. Los módulos comerciales pendientes no pueden declararse probados. |
| **6.2 Manual de usuario y manual técnico** | **Parcial** | Hay [guía Supabase local](../supabase/README.md), [seed y recorrido de prueba](seed-local.md), [arquitectura](architecture.md), [stack](tech-stack.md) y requisitos/planes/validaciones por fase. El [README raíz](../README.md) sigue siendo principalmente el de TailAdmin. | Redactar, revisar y versionar dos manuales orientados a este producto, con alcance entregado, recorridos por rol, instalación/operación, solución de incidencias y capturas actualizadas. |
| **6.3 Capacitación al personal** | **Pendiente** | No se encontró acta, fecha, asistencia ni evaluación de una sesión de capacitación en los documentos revisados. | Preparar ejercicios por rol, realizar la sesión con personal autorizado y registrar fecha, asistentes, temas, incidencias y conformidad. |
| **6.4 Presentación, documentación y cierre** | **Pendiente** | Hay entregables parciales y esta matriz; no se identificó acta de presentación, inventario de entrega ni aceptación final. | Acordar versión/alcance entregable, presentar el sistema, entregar manuales y evidencias, registrar pendientes aceptados y obtener conformidad real. |

**Texto utilizable en el informe:** «La Actividad 6 presenta avances de calidad y documentación técnica local. Se han ejecutado pruebas por módulo y regresiones, pero aún faltan la aceptación integral del alcance final, los manuales formales, la capacitación del personal, el despliegue acordado y el acta de entrega».

## Alcance real de las pruebas registradas

| Tipo | Evidencia | Límite |
|---|---|---|
| Base de datos/RLS | Suites pgTAP en [supabase/tests/database](../supabase/tests/database/) y validaciones por fase. | Los totales 16 → 30 → 48 → 76 → 112 → 137 son **acumulativos**; no se suman como pruebas independientes. La última ejecución consignada corresponde a Fase 5, no a un cierre integral posterior. |
| API y concurrencia | [Scripts de prueba](../scripts/) para identidad, fichas, precios, disponibilidad, agenda y pagos; la validación Fase 5 registra 107 comprobaciones de pagos y regresiones anteriores. | Usan datos sintéticos y una instancia local. No prueban un esquema remoto ni módulos aún inexistentes. |
| Angular y compilación | Validación Fase 5 registra 90/90 pruebas Angular acumuladas y build de producción correcto. Hay [revisiones visuales locales de portada](features/inicio-publico/validation.md) y [pagos](features/fase-5-pagos-adelantos/validation.md). | No son un recorrido manual integral de todos los módulos ni una aceptación del personal. La [validación del tema](features/tema-turquesa/validation.md) mantiene revisión visual manual pendiente. |

El [modelo SQL local](../Pandas11.sql) incluye tablas previstas sin migración operativa, y las [Actividades 4](actividad-4-modulo-comercial.md) y [5](actividad-5-analitica-fidelizacion.md) siguen incompletas. Por ello, «pruebas integrales» solo puede cerrarse después de fijar qué funcionalidades forman parte de la versión entregable. Un build correcto tampoco demuestra que Supabase remoto tenga el mismo esquema o configuración.

## Paquete de aceptación propuesto

Este cuadro es una **plantilla de ejecución futura**, no un registro de pruebas ya realizadas.

| Flujo con datos sintéticos | Rol de prueba | Resultado a registrar |
|---|---|---|
| Registrar/confirmar cuenta, entrar y salir; comprobar denegación del panel al cliente | CLIENT | Fecha, versión, entorno, captura o log, aprobado/fallido |
| Crear cliente y mascota, consultar ficha/vacunas y comprobar separación de notas internas | OWNER/ADMIN y CLIENT vinculado | Fecha, versión, entorno, captura o log, aprobado/fallido |
| Configurar servicio/tarifa; cotizar por tamaño/pelaje | OWNER/ADMIN; STAFF solo lectura | Fecha, versión, entorno, precio esperado/obtenido, aprobado/fallido |
| Configurar trabajador/turno, crear cita con varias mascotas y relevo; rechazar un conflicto; cambiar estado y consultar antecedentes | OWNER/ADMIN; STAFF solo lectura | Fecha, versión, entorno, caso esperado/obtenido, aprobado/fallido |
| Registrar cobro de cita completada y verificarlo; comprobar saldo y denegación a STAFF | OWNER/ADMIN registra; OWNER verifica | Fecha, versión, entorno, importes esperados/obtenidos, aprobado/fallido |
| Revisar móvil, oscuro/RTL, navegación y contraste de pantallas entregadas | Usuario evaluador | Dispositivos/tamaños, observaciones, aprobado/fallido |

Las ventas, caja, inventario, dashboard real, recordatorios, reportes y reservas online solo se incorporarán a esta aceptación si se implementan y pasan sus propios planes/pruebas. No usar datos de clientes reales para fabricar evidencias.

## Contenido mínimo de los manuales

| Manual de usuario | Manual técnico |
|---|---|
| Alcance de la versión y roles; acceso, perfil, clientes/mascotas, servicios/tarifas, empleados, citas y pagos; pasos, validaciones, mensajes de error y límites; capturas actualizadas. | Arquitectura Angular/Supabase, versión y dependencias, configuración local, migraciones, RLS y roles, datos sintéticos, comandos de build/pruebas, respaldo/recuperación planificados, incidencias conocidas y procedimiento de despliegue **cuando se acuerde**. |

La [guía local](../supabase/README.md) aporta materia prima, pero está orientada al desarrollo y contiene cuentas ficticias. Un manual para el personal debe usar sus propias instrucciones y nunca presentar esas cuentas como usuarios de producción. El README raíz conserva texto de la plantilla, por lo que tampoco se debe anexar sin adaptación como manual del producto.

## Registro para capacitación y entrega

Completar **después** de cada acto; los espacios vacíos no representan aprobación:

| Campo | Capacitación | Entrega/cierre |
|---|---|---|
| Fecha, lugar o medio | Por registrar | Por registrar |
| Versión y entorno mostrados | Por registrar | Por registrar |
| Asistentes y roles | Por registrar | Por registrar |
| Temas/recorridos o entregables | Por registrar | Por registrar |
| Incidencias y responsables | Por registrar | Por registrar |
| Resultado y conformidad | Por registrar | Por registrar |

Antes de un despliegue deberá existir un plan de adopción del esquema remoto, revisión de configuración y permisos, versión identificada y pruebas del entorno de destino. El enlace al proyecto Supabase aportado por el usuario no demuestra que las migraciones locales estén aplicadas allí. No se ejecutó despliegue ni se modificaron datos o código para este anexo.
