# Actividad 5.4 — Reportes exportables y retención

Fecha de propuesta: 2026-10-30 (America/Lima). Estado: **aprobado e implementado localmente el 2026-10-31**.

## Contexto comprobado

El cronograma sitúa 5.4 después de los indicadores 5.1, gráficos 5.2 y contactos 5.3, implementados solo localmente. `dashboard_kpis(date)` y `dashboard_analytics(date)` ya definen cobros confirmados, citas completadas y series con meses de Lima. No existe una exportación operativa de reportes de negocio ni una definición aprobada de retención. El botón «Export» de facturas pertenece a una pantalla de plantilla y no constituye un reporte del negocio.

Fuentes: [roadmap](../../roadmap.md), [matriz](../../matriz-seguimiento.md), [reglas](../../business-rules.md), [modelo SQL](../../../Pandas11.sql) y [validación 5.3](../actividad-5-recordatorios-contactos/validation.md).

## Decisiones de negocio propuestas para esta aprobación

| ID | Definición propuesta |
|---|---|
| R54-D01 | Dos reportes mensuales agregados: **cobros y citas** y **retención de clientes**. Ambos se consultan en pantalla y se descargan como CSV UTF-8. No incluyen filas individuales, nombres, teléfonos, correos ni datos de mascotas. |
| R54-D02 | Intervalo inclusivo de 1 a 12 meses calendario, hasta el mes actual de `America/Lima`. Valor inicial: los 12 meses terminados en el actual. El mes actual se rotula **provisional** porque aún puede cambiar. |
| R54-D03 | Retención mensual = clientes distintos con al menos una cita `COMPLETED` programada en el mes anterior **y** otra en el mes medido, divididos entre clientes distintos con cita `COMPLETED` programada en el mes anterior. Se expresa como porcentaje con dos decimales; sin denominador se muestra «Sin base» y se exporta tasa vacía. Se cuentan clientes históricos aunque luego se hayan dado de baja, porque se mide actividad pasada. |
| R54-D04 | Consultan y exportan únicamente OWNER/ADMIN activos con `analytics.read`. STAFF, CLIENT, anon y roles personalizados con permiso delegado no acceden a la consulta ni a la exportación. |

El usuario aprobó estas cuatro decisiones y el plan mediante «Vamos» el 2026-10-30. La evidencia de implementación local se registra en [validation.md](validation.md).

## Requisitos y criterios de aceptación

| ID | Criterio verificable | Reglas relacionadas |
|---|---|---|
| RR-01 | Para cada mes elegido, el reporte de cobros y citas muestra mes, cobros de servicios, cobros de productos, total cobrado y citas completadas. Los valores coinciden exactamente con `dashboard_kpis` para ese mes, incluyendo meses vacíos y fronteras de año. El CSV conserva dos decimales y no suma caja ni duplica ventas mixtas. | RN-01, RN-12, RN-19, RN-27, RN-32, RN-33; R54-D01/D02 |
| RR-02 | El reporte de retención muestra mes, clientes del mes anterior, clientes que repitieron en el mes, y tasa. Un cliente con varias citas en un mismo mes cuenta una vez. Las citas `CANCELLED`, `NO_SHOW` o aún no completadas no cuentan. La tasa cumple R54-D03, incluso con denominador cero. | RN-01, RN-13, RN-14, RN-37; R54-D03 |
| RR-03 | Los dos reportes muestran el mismo intervalo y los mismos datos que sus CSV. Los archivos tienen encabezados estables en español, fechas `AAAA-MM`, codificación UTF-8, escape correcto de celdas para hojas de cálculo y nombre de archivo con tipo e intervalo. No incluyen identificadores ni datos personales. | RN-32–RN-36; R54-D01/D02 |
| RR-04 | La RPC comprueba en servidor el rol y permiso de R54-D04 y rechaza intervalos nulos, invertidos, futuros o mayores a 12 meses. La interfaz oculta acceso, tablas y exportación a roles no autorizados; no confía solo en ese ocultamiento. | RN-33, RN-36; R54-D04 |
| RR-05 | La página tiene estados de carga, sin datos y error recuperable; selector de intervalo accesible con teclado; tablas legibles en móvil y modo oscuro. Una respuesta anterior no reemplaza datos de un nuevo intervalo o rol. | R54-D01/D02/D04 |
| RR-06 | Las pruebas con datos sintéticos cubren meses límite de Lima, repetición, varias citas por cliente, bajas posteriores, ausencia de base, exactitud decimal, autorización y contenido CSV. Se documenta el resultado de la suite SQL, Angular, compilación y revisión visual pertinente. | RN-01, RN-32, RN-33, RN-36; R54-D01–D04 |

## Alcance y límites

Los reportes son agregados de actividad y cobros ya registrados; no son facturas, declaraciones tributarias, estados de caja ni ingresos devengados. La retención mide repetición entre meses consecutivos, no fidelidad a 30 días, cohortes desde el primer servicio, rentabilidad ni la lista de seguimiento de 5.3. No se envían correos, no se generan archivos en Supabase Storage y no se interviene el entorno remoto.

## Aclaración pendiente

R54-D01–D04 quedaron confirmadas para esta entrega. Otro formato, reportes de detalle, otra fórmula de retención o incluir STAFF requieren un plan de cambio propio.
