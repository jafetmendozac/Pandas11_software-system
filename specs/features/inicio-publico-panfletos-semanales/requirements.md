# Panfletos semanales en el inicio público — requisitos aprobados

Fecha: 2026-10-23 (America/Lima). Estado: **plan aprobado e implementación local validada**. Véase [validación](validation.md).

## Contexto comprobado

La portada `/` está implementada como `InicioComponent` sin consultas Supabase y usa contenido fijo, logo local y un CTA a WhatsApp. `Pandas11.sql` incluye identidad, permisos y `business_settings`, pero no una entidad de panfletos ni una relación con Storage. `supabase/config.toml` habilita Storage local; no hay bucket ni flujo Angular de carga de imágenes de la portada. La base remota no se ha inspeccionado.

El usuario aclaró que serán **siete panfletos en total, uno diferente para cada día de lunes a domingo**, y que **OWNER y ADMIN** podrán cambiarlos desde el panel. La configuración debe persistir sin volver a publicar la aplicación.

## Alcance funcional aprobado

| ID | Criterio de aceptación | Reglas relacionadas |
|---|---|---|
| PS-01 | La portada presenta los panfletos asignados al día actual según `America/Lima`; el cambio de día se refleja sin depender de la zona horaria del navegador. El domingo puede tener panfleto aunque el local esté cerrado; la pieza no cambia el horario publicado. | RN-01; IP-02, IP-09 |
| PS-02 | Hay una posición por día (siete en total). Si el día actual no tiene imagen publicada, la portada conserva el contenido existente de respaldo sin imagen rota ni datos de demostración. | RN-31; IP-02, IP-07 |
| PS-03 | OWNER y ADMIN pueden ver las siete posiciones, cargar/reemplazar una imagen, previsualizarla, dar texto alternativo y publicar o desactivar cada día. La configuración persiste entre dispositivos y no requiere redeploy. | RN-31; IP-03, IP-07, IP-10 |
| PS-04 | La portada anónima obtiene únicamente metadatos de la imagen publicada para el día. La escritura de configuración y archivos queda limitada en base y Storage por rol/permisos; no se exponen claves de servidor en Angular. | RN-31; IP-01, IP-06 |
| PS-05 | El editor valida formatos, tamaño, nombre accesible y errores de carga; una sustitución fallida conserva el panfleto publicado. No se publican imágenes de prueba ni material sin autorización de uso. | IP-03, IP-07 |
| PS-06 | En móvil, escritorio, oscuro y RTL el panfleto del día se ve completo, con zoom opcional operable por teclado. La portada evita transferir imágenes de otros días. | IP-03, IP-07, IP-10 |
| PS-07 | Tests verifican calendario semanal, permisos de lectura/escritura, carga/reemplazo y respaldo; build y revisión visual documentados en `validation.md`. | IP-08 |

## Decisiones

- **PS-D01 — cantidad, confirmada:** siete en total, una por cada día de la semana.
- **PS-D02 — administración, confirmada:** OWNER y ADMIN desde el panel.
- **PS-D03 — material, aprobado con el plan:** el negocio aportará/cargará sus imágenes; aceptar JPG/PNG/WebP de hasta 5 MiB, con vista previa y texto alternativo. Hasta cargarlas se conserva la portada actual.
- **PS-D04 — presentación, aprobado con el plan:** un bloque destacado con la imagen completa del día y opción de ampliarla; sin carrusel de otros días. La portada no afirma promociones, precios o servicios no aprobados solo por mostrar una imagen.

No se deduce de la solicitud un enlace comercial por pieza, fechas especiales, segmentación por visitante, notificaciones, edición gráfica dentro de la app ni automatización de ofertas.
