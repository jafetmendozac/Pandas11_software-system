# Actividad 5 — Analítica y fidelización

Fecha de corte: 2026-10-20 (America/Lima). Anexo de seguimiento para los puntos 5.1–5.5 de la [matriz S1–S14](matriz-seguimiento.md). Las observaciones proceden del código, el modelo local y las validaciones ya registradas; no se consultó el proyecto Supabase remoto ni se ejecutaron pruebas funcionales nuevas.

## Estado por punto del cronograma

| Punto | Estado | Evidencia comprobada | Falta para cumplirlo |
|---|---|---|---|
| **5.1 Consultas SQL para KPIs** | **Pendiente** | Las migraciones de [citas](../supabase/migrations/20261017220427_internal_appointments.sql) y [pagos](../supabase/migrations/20261018225928_payments_advances.sql) contienen datos operativos y un resumen **por cita**. No se identificaron consultas de indicadores agregados conectadas al dashboard. | Acordar indicadores, fórmulas, filtros, periodos, zona horaria y permisos; crear consultas y probarlas contra casos sintéticos conocidos. |
| **5.2 Gráficos de ingresos, servicios y productos** | **Pendiente** | El [dashboard](../src/app/pages/dashboard/ecommerce/ecommerce.component.ts) reúne componentes de plantilla; el [gráfico mensual](../src/app/shared/components/ecommerce/monthly-sales-chart/monthly-sales-chart.component.ts) usa una serie numérica fija. La paleta ya es turquesa, pero los valores no provienen del negocio. | Conectar métricas reales, definir qué cuenta como ingreso y evitar doble conteo. Los gráficos de **productos** dependen del módulo comercial/inventario aún pendiente. |
| **5.3 Recordatorios y lista por contactar** | **Pendiente** | `notifications` aparece solo en el [modelo SQL de referencia](../Pandas11.sql), sin migración operativa identificada. El [menú de notificaciones](../src/app/shared/components/header/notification-dropdown/notification-dropdown.component.html) contiene nombres y mensajes de demostración; su [componente](../src/app/shared/components/header/notification-dropdown/notification-dropdown.component.ts) solo abre/cierra el menú. | Acordar evento, destinatarios, consentimiento, canal, frecuencia, responsable, lista de seguimiento y registro de contactos antes de crear envíos. |
| **5.4 Reportes exportables y retención** | **Pendiente** | No se identificó un reporte de negocio exportable ni cálculo de retención conectado a los datos operativos. El botón «Export» de la [lista de facturas de plantilla](../src/app/shared/components/invoice/invoice-list/invoice-list.component.html) carece de acción de exportación y esa lista contiene [facturas fijas](../src/app/shared/components/invoice/invoice-list/invoice-list.component.ts). | Definir reportes, columnas/filtros, formato, permisos y fórmula de retención; comprobar exactitud y protección de datos. |
| **5.5 Ajustes finales de interfaz y usabilidad** | **Parcial** | Se implementaron y validaron localmente la [portada pública](features/inicio-publico/validation.md), [configuración en español](features/configuracion-espanol/validation.md), [tema turquesa](features/tema-turquesa/validation.md) y mejoras del [calendario](features/fase-4-agenda-reservas-internas/validation.md). | Revisar la aplicación **completa** una vez que existan los módulos finales: consistencia, accesibilidad, móvil, oscuro/RTL y aceptación de usuarios. El tema turquesa conserva una revisión visual manual pendiente. |

**Texto utilizable en el informe:** «La Actividad 5 aún no cuenta con indicadores, reportes ni recordatorios operativos conectados a los datos del negocio. Existen citas y pagos locales que servirán de fuente para parte de la analítica; los gráficos y notificaciones actuales son componentes de plantilla. Se realizaron mejoras parciales de interfaz, incluida la identidad turquesa y la portada pública».

## Qué pueden significar los indicadores

La [Fase 5 de pagos](features/fase-5-pagos-adelantos/validation.md) distingue un cobro registrado `PENDING` del dinero recibido `PAID`; solo este último reduce el saldo. La [agenda](features/fase-4-agenda-reservas-internas/validation.md) conserva importes de servicios por cita, pero una cita completada tampoco equivale automáticamente a dinero cobrado. Las [reglas RN-02, RN-09 y RN-16](business-rules.md) sostienen esa distinción. Por tanto, antes de usar la palabra «ingresos» en el dashboard debe decidirse si el indicador mostrará **cobros confirmados**, **valor de servicios atendidos** o **ventas registradas**. Son medidas distintas; la última aún no tiene módulo operativo.

Para periodos, la agenda usa **America/Lima** conforme a [RN-01](business-rules.md). El periodo de un cobro podría depender de `paid_at`, mientras el de una cita depende de su fecha programada; esa elección forma parte de la definición del KPI y no se resuelve con el gráfico de plantilla. Los productos y su rentabilidad requieren la [Actividad 4](actividad-4-modulo-comercial.md). No hay reglas aprobadas para tasa de retorno, ventana de retención, recordatorio, frecuencia o contacto automático; estos ejemplos son preguntas de diseño, no decisiones del negocio.

El modelo de [clientes](../Pandas11.sql) contiene `whatsapp_opt_in`, pero su presencia no autoriza mensajes ni define cómo se obtiene, registra o revoca el consentimiento. Una lista por contactar debe diferenciar candidatos de contactos realizados y respetar el permiso y canal acordados; no se declara un envío existente.

## Secuencia sugerida para un plan futuro

1. Definir un pequeño conjunto de KPIs verificables con Alex y Caro: nombre, fórmula, fuente, zona horaria, filtros, permisos y ejemplo calculado a mano. Empezar por citas y cobros disponibles; los de productos esperan ventas e inventario.
2. Conectar consultas agregadas al dashboard y sustituir valores de demostración, incluyendo estados sin datos y pruebas contra conjuntos sintéticos conocidos.
3. Definir recordatorios y lista por contactar con reglas de consentimiento, responsable y registro de resultados. Solo después seleccionar el mecanismo de envío.
4. Definir reportes y retención con las mismas fuentes/fórmulas del dashboard y controles de acceso; comprobar exportación y datos personales.
5. Realizar la revisión integral de interfaz cuando los módulos finales estén presentes y documentar observaciones/aceptación.

Esta secuencia orienta el seguimiento; no constituye requisitos ni un plan SDD aprobado. Ninguna nueva funcionalidad, migración o integración externa se inició para preparar el anexo.

## Actualización de 5.1 — 2026-10-29

El usuario aprobó [requisitos y plan](features/actividad-5-kpis/plan.md) para cuatro indicadores mensuales en `America/Lima`: cobros confirmados de servicios, cobros confirmados de productos, total cobrado y citas completadas por inicio programado. Se aplicó localmente una migración con RPC protegida para OWNER/ADMIN y pasaron [17/17 pruebas específicas y 289/289 SQL completas](features/actividad-5-kpis/validation.md). Los diagnósticos de 5.1 anteriores describen el corte 2026-10-20; el panel visual aún usa plantilla y corresponde a 5.2.

## Actualización de 5.2 — 2026-10-29

El usuario aprobó [requisitos y plan de gráficos](features/actividad-5-dashboard-graficos/plan.md). Una nueva RPC local agrega la serie de doce meses y los rankings de servicios completados y unidades de productos de ventas vigentes. El panel Angular muestra tarjetas, gráficos y equivalentes textuales con estados de carga, vacío y error; STAFF solo ve accesos permitidos. La implementación sustituye el renderizado de plantilla descrito en el diagnóstico del 2026-10-20. La evidencia y los límites están en [validación 5.2](features/actividad-5-dashboard-graficos/validation.md). Siguen pendientes 5.3–5.5 y el despliegue remoto.
