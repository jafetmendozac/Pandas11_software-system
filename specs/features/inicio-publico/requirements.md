# Inicio público — Spa Boutique Pandas 11

Fecha: 2026-10-18. Estado: plan aprobado por el usuario mediante «Claro pero ten en cuenta que los colores de la empresa predomina el color turquessa»; implementado y validado localmente.

## Objetivo

Cualquier visitante, tenga o no cuenta, conoce el negocio, sus servicios y ubicación, y encuentra un acceso visible al inicio de sesión existente. Presentación comercial en español con diseño propio inspirado en sitios de spa/boutique canina, conservando la identidad de Pandas 11.

## Contexto comprobado durante el análisis

- Nombre proporcionado: **Spa Boutique Pandas 11**. Área/dependencia: Spa Boutique.
- Dirección proporcionada: **Calle General Urco Mz. C Lote 11, Urbanización Los Laureles, Trujillo, La Libertad**. El usuario confirma ciudad y región; no se han verificado coordenadas ni un punto exacto de mapa.
- WhatsApp publicable confirmado: **972 704 860**. Enlace propuesto para Perú: `https://wa.me/51972704860`. Abrir el enlace no confirma ni crea una cita en el sistema.
- Oferta confirmada por el usuario: baño, estilismo, corte higiénico, comercialización de champús, fragancias y complementos y orientación profesional, con enfoque en bienestar y embellecimiento canino.
- El usuario describe un local físico con recepción, espacio de grooming, exhibición de mercadería y unidad administrativa. No se dispone de fotografías verificadas del establecimiento.
- RN-04/05/06 confirman baño, baño y corte y recojo solo hacia el local; tarifa/duración dependen de la mascota y transporte de hora/distancia. No implican atención veterinaria ni entrega de regreso.
- RN-01: lunes–sábado incluidos feriados, domingo cerrado, primer inicio hasta17:00 y final posterior18 con cobertura laboral. El usuario confirma esta presentación pública: **«Separa tu cita. Atendemos de lunes a sábado, de 7 a. m. a 6 p. m.»**. Este texto no modifica la última hora de inicio ni impone terminar exactamente a18:00; la hora concreta de la cita se coordina con el personal.
- RN-02: Yape o efectivo. RN-08/09 distinguen autorreserva y citas internas; esta página no implementa reservas ni pagos.
- `/` es hoy el dashboard bajo AppLayoutComponent y authGuard. `/signin` y `/signup` existen. `/catalogo` exige perfil activo; no es un catálogo anónimo.
- El login vuelve por defecto a `/`; el sidebar y logos/breadcrumbs contienen enlaces a esa ruta. Hay que adaptar los destinos si la raíz pasa a ser pública.
- Existen logos PNG/SVG locales; fotografías propias, lista de productos concretos, stock y precios comerciales no están verificados. Los datos DEMO del seed no son contenido publicable del negocio.

## Alcance implementado

1. Inicio público en `/`, fuera del layout y guard privados, con navegación a Servicios, Nosotros y Ubicación y botón visible **Iniciar sesión** hacia `/signin`.
2. Portada con nombre, mensaje de cuidado y estética canina y acciones **Separa tu cita** (WhatsApp) y **Conocer servicios**. Diseño cálido, espacios amplios, tarjetas redondeadas y logotipo local; adaptable a móvil y escritorio.
3. Describir baño, estilismo/baño y corte, corte higiénico, orientación profesional y boutique de champús, fragancias y complementos. Incluir recojo coordinado según RN-06, aclarando que no incluye retorno y que precio/disponibilidad se coordinan. No publicar tarifas del seed, stock supuesto ni duraciones universales. Esta información comercial no crea servicios, productos o inventario en la base de datos.
4. Presentar negocio, dirección, horario con la frase aprobada y WhatsApp confirmado. El botón abre conversación con el negocio para coordinar; no confirma reservas. Puede incluirse enlace de búsqueda de la dirección en mapas, sin coordenadas o marcador exacto no verificados.
5. Mover el dashboard existente a `/panel`, con el mismo guard. Mantener rutas operativas y sus permisos. Tras login sin redirect explícito, personal con panel.access a `/panel`, cliente a `/mi-perfil`; respetar redirecciones internas existentes y sus guards.
6. La página es informativa: no anunciar reserva online como disponible, no crear citas ni cuentas automáticamente, no mostrar información operativa o personal.

## Criterios de aceptación

| ID | Resultado verificable |
|---|---|
| IP-01 | Visitante sin sesión accede directamente a `/` y permanece en la página pública, sin panel/header/sidebar privados |
| IP-02 | Nombre y dirección coinciden con los datos aprobados; servicios/horarios no inventan ofertas, tarifas, certificaciones o testimonios |
| IP-03 | Enlaces de navegación y acceso a `/signin` funcionan por teclado y en móvil; imágenes con texto alternativo adecuado y títulos semánticos |
| IP-04 | Inicio de sesión conserva Auth existente, redirects internos y separación entre personal y cliente; no expone rutas protegidas |
| IP-05 | Dashboard sigue accesible en `/panel` solo con autorización; enlaces internos de inicio apuntan al destino correcto |
| IP-06 | Página pública no consulta tablas privadas, tarifas demo, notas internas ni habilita nuevas políticas de lectura anónima |
| IP-07 | Diseño original con identidad local, contraste, tema compatible y adaptación móvil; recursos autorizados o propios |
| IP-08 | Pruebas de rutas/acceso y login pertinentes, compilación y documentación de resultados/límites |
| IP-09 | «Separa tu cita» lleva a WhatsApp51972704860; el horario público usa la frase aprobada y no habilita una reserva automática o un inicio posterior17:00 |
| IP-10 | Turquesa predominante, rosa y morado como acentos inspirados en las imágenes de marca; logotipo Pandas11 local. Paleta limitada a la portada sin recolorear el panel |
| IP-11 | No mostrar el número en textos ni etiquetas accesibles de la portada. Contacto mediante botón de WhatsApp flotante en la esquina inferior izquierda, con nombre accesible y destino confirmado; sin bloque de llamada telefónica |
| IP-12 | Encabezado visible fijo arriba al desplazarse, con espacio reservado para no cubrir el inicio, anclas visibles y menú móvil operativo |

## Contenido y adaptación editorial

- Portada implementada: **Mucho cariño. Un nuevo look.**, con identificación de spa canino y boutique en Trujillo.
- Presentación: **En Spa Boutique Pandas 11 nos enfocamos en el bienestar y embellecimiento canino, con baño, estilismo, corte higiénico y orientación profesional.**
- Boutique: **Champús, fragancias y complementos para el cuidado de tu mascota. Consulta su disponibilidad en nuestro local.**
- Local: **Visítanos en la Urbanización Los Laureles, Trujillo. Contamos con recepción, espacio de grooming y exhibición de artículos para tu mascota.**
- Horario: **Separa tu cita. Atendemos de lunes a sábado, de 7 a. m. a 6 p. m.**
- Acción principal: **Separa tu cita** → WhatsApp **972 704 860**. Acción de cuenta: **Iniciar sesión** → `/signin`.

Los textos originales se adaptan editorialmente en la plantilla conservando la oferta, ubicación, contacto y horario confirmados. No se atribuyen credenciales sanitarias, consulta veterinaria, premios, testimonios o tratamientos no confirmados. Evidencia por criterio y límites en validation.md.

## Información y decisiones pendientes

- La separación `/` pública y `/panel` privado queda aprobada con el plan. Mantener las rutas operativas protegidas.
- El usuario aporta piezas gráficas como referencia de color e identidad. El logotipo turquesa ya está disponible en public/images/logo/Logo.png; no es necesario reproducir carteles completos o presentar imágenes genéricas como fotografías reales del local.
- Los carteles muestran976079212, distinto del WhatsApp972704860 confirmado por escrito. La nueva indicación trata del color: se conserva el número confirmado y no se utiliza la imagen del vehículo que contiene el número diferente.
- No hay ubicación geográfica exacta verificada; basta la dirección completa y un enlace de búsqueda, sin mapa embebido con un punto supuesto.

Las preguntas iniciales de servicios/contacto, ciudad/región y horario público quedan respondidas. No se requiere definir un catálogo transaccional de productos para esta página informativa. El diseño no copiará textos, marca, testimonios, premios ni fotografías de otras boutiques.

## Ajuste solicitado de contacto — 2026-10-18

El usuario pide retirar el número visible y utilizar un botón flotante de WhatsApp abajo a la izquierda. Se conserva el número confirmado exclusivamente como destino del enlace; su presencia en la URL de WhatsApp es necesaria y no se considera un mecanismo para mantenerlo secreto. Se elimina el bloque de llamada y las cifras de texto/aria-label. Los botones de coordinar cita/consultar servicio conservan etiquetas sin número.
