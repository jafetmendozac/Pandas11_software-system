# Plan — Inicio público

Fecha: 2026-10-18. **Aprobado por el usuario con indicación de turquesa predominante y referencias gráficas. Implementado y validado localmente.**

## Referencias y propuesta visual

Sitios oficiales consultados el2026-10-18:

- [LUAN DOG Spa & Boutique](https://luandog.com.co/): referencia de estructura con portada, presentación, servicios, ubicación/contacto e inicio de sesión.
- [BlissSpaw](https://blisspaw.pet/): referencia de organización de servicios y acciones de contacto.

Usar únicamente ideas generales de composición. Propuesta propia: cabecera limpia con logo Pandas11 y acceso de cuenta, portada con titular destacado y visual de mascota autorizado/ilustrativo, tarjetas para baño, estilismo y corte higiénico, bloque de boutique/orientación, recojo coordinado, presentación, ubicación/contacto y pie con información real. Reutilizar tokens Tailwind, tipografía y logos del proyecto; no copiar contenidos ni atribuir a Pandas 11 los servicios o logros de las referencias.

Información comercial recibida: WhatsApp972704860, Trujillo/La Libertad y oferta detallada de baño, estilismo, corte higiénico, champús, fragancias, complementos y orientación profesional. Usar el borrador de requirements.md y el horario solicitado «Separa tu cita. Atendemos de lunes a sábado, de 7 a. m. a 6 p. m.».

Aclaración de diseño aprobada: turquesa como color dominante, rosa y morado como acentos, tonos claros y motivos de huellas. Usar Logo.png ya disponible e inspeccionado, correspondiente al panda y aro turquesa de las piezas. Definir variables de color en el componente público para no cambiar los tokens administrativos. Conservar el teléfono confirmado por escrito: los números impresos en los carteles no sustituyen esa instrucción.

## Flujo propuesto

```text
Visitante → / (inicio público) → /signin (Auth existente)
                                  ├─ personal autorizado → /panel
                                  └─ cliente activo → /mi-perfil

Rutas internas existentes → guards/permisos existentes → Supabase con RLS existente
```

La portada es pública también para personas autenticadas. La presentación comercial no necesita sesión ni consultas Supabase; el acceso de cuenta utiliza el flujo de autenticación ya implementado. El catálogo calculado sigue protegido en `/catalogo`.

La acción comercial **Separa tu cita** abre `https://wa.me/51972704860` para coordinar con el personal; no crea una fila en appointments, confirma una reserva o solicita un adelanto automáticamente. La dirección puede enlazar a una búsqueda de mapas por texto, sin API key, mapa embebido ni coordenadas inferidas.

## Implementación después de aprobar

1. Utilizar las respuestas ya incorporadas en requirements.md y este plan. Conservar el horario operativo de RN-01 al presentar la franja comercial aprobada. Preparar recursos propios o ilustrativos si faltan fotografías, sin inventar imágenes reales del establecimiento ni enlaces de contacto adicionales.
2. Crear componente standalone dentro de `src/app/pages/inicio/`, con plantilla propia, RouterLink, control de navegación móvil y estilos con tokens existentes. Lazy load para la nueva página; no añadir paquetes, embeds de redes o formularios de contacto con backend.
3. Añadir ruta pública raíz con pathMatch full antes del layout protegido. Cambiar solo la ruta del dashboard a `/panel`, conservando AppLayoutComponent, authGuard, canActivateChild y permisos de las demás rutas.
4. Ajustar enlace de dashboard, logos del shell interno y breadcrumb al destino privado; los enlaces de retorno de las pantallas Auth vuelven al inicio público. Revisar enlaces a `/` por contexto, sin reemplazo global sobre páginas demo.
5. Adaptar destino por defecto tras autenticación: revalidar autorización con AuthorizationService; personal con panel.access a `/panel`, cliente activo a `/mi-perfil`. Conservar redirects internos explícitos y guards; ante error/inactividad no conceder acceso al panel. Mantener confirmación de correo y registro existentes.
6. Utilizar el logo local tras comprobar su variante adecuada. Preparar visual propio/autorizado si hace falta, sin representar fotos genéricas como local/equipo reales. No importar assets ajenos de las páginas de referencia.
7. Ejecutar las comprobaciones de validation.md, revisar enlaces y actualizar arquitectura/roadmap/baseline con el nuevo acceso público, resultados y límites.

## Modelo y seguridad

Pandas11.sql consultado: profiles/roles/permissions determinan acceso; services/service_prices son catálogo controlado; appointments y sus tablas hijas conservan el flujo interno. No se modifica ninguna tabla, enum, función, política o relación. business_hours no se lee anónimamente para la portada: contenido comercial aprobado en el componente, sin afirmar sincronización automática con turnos administrativos.

Sin cambios SQL, migraciones, Supabase CLI, keys o entornos. La presentación de artículos y servicios adicionales es informativa y no introduce inventario, ecommerce o nuevos registros de catálogo. La página no revela usuarios, disponibilidad de empleados, citas, tarifas de demostración, notas ni estadísticas del panel. RN-01/02/04/05/06 orientan el texto; RN-08/09 no autorizan autorreserva ni pagos en este alcance.

## Archivos previstos

- Nuevo componente en pages/inicio y recursos propios si se requieren.
- app.routes.ts; destinos de login/registro cuando corresponda; enlaces del shell y breadcrumb relacionados con dashboard/portada.
- Pruebas pertinentes de acceso público, rutas protegidas y destino tras login.
- Especificaciones de esta funcionalidad y actualización de documentos base tras implementar.

## Aprobación recibida

El usuario responde «Claro» a la petición de aprobación y añade la identidad turquesa mediante imágenes. Autoriza implementar la separación `/`–`/panel`, redirecciones y página informativa descritas, incorporando sus colores. No autoriza desplegar, modificar datos, registrar reservas o enviar mensajes.

## Concreción y cierre

- InicioComponent standalone lazy en `/`, sin guard privado ni dependencia de Auth/datos. Reutiliza Logo.png y ThemeService para restaurar preferencia local; no se generan fotos ni se alteran assets existentes.
- Variables turquesa/rosa/morado limitadas al CSS del componente; utilidades Tailwind existentes para estructura y espaciado. Sin cambios al tema administrativo ni dependencias.
- Dashboard en `/panel`; sidebar, logo del shell y breadcrumb ajustados. Breadcrumb usa permisos ya cargados: personal vuelve a `/panel`, cliente a `/`.
- Login revalida autorización, conserva redirect interno y descarta destinos externos/con barras invertidas. Sin redirect: panel para personal, perfil para cliente. Registro ya confirmado va al perfil; confirmación pendiente conserva su flujo previo.
- Todas las acciones comerciales abren WhatsApp972704860 o un enlace de dirección/teléfono; no se envía ningún mensaje ni se genera reserva desde la portada.
- Validación de rutas con RouterTestingHarness y casos de login/registro, más revisión de la build con Chrome sin sesión en escritorio/móvil, oscuro y RTL. Resultados y límites en validation.md.

## Ajuste solicitado de contacto — 2026-10-18

Retirar número visible/etiquetas y bloque tel de la portada. Mantener el destino WhatsApp existente y añadir un enlace fijo de56px con icono de conversación/teléfono, nombre accesible, foco visible y apertura segura en otra pestaña. Posición física inferior izquierda solicitada, incluidos RTL y márgenes de área segura móvil. Mantenerlo solo dentro de InicioComponent; sin modificar vistas internas, servicios o datos. Usar el color success existente para identificar WhatsApp, sin alterar la identidad turquesa del resto.

Actualizar la prueba existente de portada para comprobar ausencia de cifras/enlace tel y presencia del contacto flotante. Compilar y repetir las pruebas de esa pantalla; revisar posición en navegador si está disponible. La validación acumulada de77 pruebas anterior se conserva como histórica, sin atribuirla a una ejecución nueva completa.

## Encabezado que acompaña el desplazamiento — 2026-10-18

Solicitud de presentación del usuario: sustituir sticky por posición fixed respecto a la ventana, manteniendo logo, enlaces y menú móvil disponibles al bajar. Reservar81px en móvil y89px desde sm según las dimensiones existentes de logo/fila, para que el contenido no quede debajo; la franja informativa pasa a estar bajo el encabezado. Mantener margen de anclas y añadirlo al salto de contenido. No cambiar estilos globales de overflow ni el shell privado.

Validar compilación y pruebas existentes de portada; comprobar en Chrome que el rectángulo del header permanece en top0 al bajar a distintos puntos, que el menú móvil sigue abriendo/cerrando y que las anclas no quedan cubiertas. Sin cambios de datos o dependencias.
