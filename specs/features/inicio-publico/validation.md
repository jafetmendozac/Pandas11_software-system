# Validación — Inicio público

Fecha: 2026-10-18. Estado: **implementado y validado localmente**, tras aprobación del usuario con identidad turquesa.

## Análisis previo (histórico)

- Árbol de rutas: raíz privada con dashboard; login/registro existentes y catálogo protegido.
- Destinos de login/registro y enlaces a raíz en shell/breadcrumb identificados para evitar regresión al introducir la portada.
- Modelo local y reglas de negocio consultados; no se conoce esquema remoto ni precios comerciales o stock.
- Oferta, WhatsApp972704860, Trujillo/La Libertad y texto del horario confirmados por el usuario mediante respuestas a las tres preguntas iniciales; incorporados a requirements.md/plan.md.
- Logos locales identificados; imágenes del establecimiento y coordenadas exactas sin verificar. No se atribuye un distrito o punto geográfico que el usuario no haya precisado.
- Referencias públicas consultadas y registradas en plan.md. No se descargan/copían sus recursos ni contenido comercial.
- Se crean únicamente requirements.md, plan.md y validation.md de esta funcionalidad. Sin cambios de código, dependencias, entornos, Auth o base de datos.

## Resultados por criterio

| Área | Evidencia obtenida |
|---|---|
| IP-01/06, público | RouterTestingHarness abre `/` sin invocar autorización ni construir Supabase/shell privado. Chrome sobre la build: cero peticiones a Supabase/Auth/REST y cero excepciones JavaScript |
| IP-04/05, separación | Pruebas con rutas reales deniegan `/panel` a anon/CLIENT y `/calendario` al personal sin appointments.read. Sidebar mantiene dashboard en `/panel` |
| IP-03/04, cuenta | Enlace de portada navega a signin; retorno dice «Volver al inicio». Login revalida permisos: personal a panel, CLIENT a perfil; redirect interno conservado y externo descartado. Fallo de Auth/identidad no navega |
| Registro | Alta ya confirmada llega al perfil protegido; sin confirmar se conserva cierre de sesión y confirm-email |
| IP-02/09, contenido | Servicios, artículos, dirección, teléfono y horario contrastados con respuestas del usuario y RN-01/02/04/05/06; sin datos DEMO o precios inventados |
| IP-03/07/10, diseño | Capturas reales a1440px y390px revisadas: turquesa dominante, acentos rosa/morado, logo local, modo oscuro; sin desborde horizontal en LTR o RTL. Menú móvil abre/cierra, Escape y navegación de anclas comprobados |
| IP-03/07, accesibilidad | H1 único, encabezados por sección, salto a contenido, foco visible, botones/enlaces con nombre y destino, alt del logo. Contraste comprobado para colores principales, no auditoría integral WCAG |
| IP-09, contacto | Enlaces a wa.me/51972704860; búsqueda de mapas por dirección y tel:+51972704860. No se pulsa WhatsApp ni se envían mensajes durante las pruebas |
| IP-07, recursos | Solo Logo.png ya existente, inspeccionado y coherente con las referencias enviadas. Sin fotografías, carteles con número distinto o material ajeno incorporado |
| IP-08, regresión | TypeScript app/spec sin emisión, build producción y77/77 pruebas Angular correctas; revisión de espacios/diff |

## Comandos y revisión en navegador

- `node node_modules/typescript/bin/tsc --project tsconfig.app.json --noEmit --incremental false` y equivalente spec: correctos.
- `npm run build`: correcto; inicial3,41MB. Portada en chunk lazy de aproximadamente24kB. El primer build señaló exceso del presupuesto de estilos de componente; se movió el layout a utilidades existentes y se redujeron las variables/estilos. Compilación final sin esa advertencia y sin modificar presupuestos.
- `npm test -- --watch=false --browsers=ChromeHeadless`:77/77 correctas, incluidas13 nuevas de portada/rutas/login/registro y64 anteriores. Los primeros dos fallos eran del proveedor de rutas del nuevo test de registro; corregidos usando Router real con métodos espiados, sin tocar el flujo de producción por ese fallo.
- Chrome headless con perfil temporal y servidor estático local de la build:1440×1050 y390×844, captura completa desktop y capturas móvil claro/oscuro; menú móvil, anclas, vínculos de contacto/cuenta, scrollWidth, RTL y ausencia de excepciones. No se reutiliza la sesión del navegador del usuario.
- Revisión temporal en `/private/tmp/pandas11-public-review-64KCdW/`: desktop.png, mobile.png y mobile-dark.png. No son assets de producción ni archivos necesarios para iniciar la aplicación.

No se ejecutan SQL/migraciones ni se modifica la base. Los nuevos tests de login/registro usan servicios simulados; no se declara un recorrido completo de autenticación real con Supabase. La revisión de Chrome comprueba la portada pública y su renderizado; no se envían mensajes, no se reservan citas y no se despliega la página.

## Límites y decisiones conservadas

El WhatsApp972704860 confirmado por escrito prevalece sobre976079212 de los carteles de referencia. No se infiere una ubicación geográfica exacta ni se incrusta un mapa con marcador supuesto. Los horarios y oferta de la portada son contenido comercial aprobado: no se sincronizan automáticamente con business_hours, services o inventario. El logotipo es real; no se presentan fotografías genéricas como infraestructura o equipo propios.

La página no agrega autorreserva, adelantos, ecommerce, inventario o integración automática de transporte. Permanecen pendientes las funciones de negocio correspondientes y la adopción/despliegue remoto. Sin instalación de dependencias, commits o pushes.

## Ajuste de contacto: WhatsApp flotante — 2026-10-18

Solicitud implementada: número retirado del texto visible y de aria-label de la portada; bloque de llamada eliminado. El número se conserva en la URL del enlace de WhatsApp, sin prometer confidencialidad de ese destino. Nuevo botón circular de56px con icono y nombre accesible, foco visible, zona segura móvil y posición inferior izquierda. Los CTA existentes conservan textos sin cifras.

- Build producción correcto, sin advertencias nuevas; `git diff --check` correcto.
- `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/pages/inicio/inicio.component.spec.ts`:5/5 correctas, incluida ausencia del número/enlace tel y destino del contacto flotante. Las77 pruebas completas anteriores son evidencia histórica, no una nueva ejecución completa de este ajuste.
- Chrome sobre build actual a1440px y390px: botón fixed, ancho56px, left20px y bottom20px; número no visible, sin enlace tel, sin desbordes LTR/RTL, cero excepciones y cero solicitudes Supabase. Revisada captura móvil con botón visible en la esquina solicitada.
- Capturas actuales: `/private/tmp/pandas11-public-review-jFDkF1/`. Las capturas de la primera entrega registradas anteriormente son históricas y aún muestran el contacto anterior.

Sin cambios de servicios, datos, permisos o dependencias. No se pulsó el enlace de WhatsApp ni se envió ningún mensaje.

## Encabezado fijo al desplazarse — 2026-10-18

Header público cambiado de sticky a fixed, con espacio superior reservado81px en móvil/89px desde sm. La franja informativa queda debajo del header; se conserva margen para anclas y salto al contenido. Sin cambios a estilos globales de overflow, componentes internos o base de datos.

- `npm run build`: correcto, sin advertencias nuevas.
- Suite de portada con `--include=src/app/pages/inicio/inicio.component.spec.ts`:5/5 correctas; no se repite la suite completa histórica.
- Chrome sobre build a1440px y390px: header con position fixed y top0 en scroll0,650 y1800. Altura89px/81px respectivamente; inicio y sección Servicios sin quedar cubiertos. Menú móvil y anclas operativos, sin desbordes LTR/RTL ni excepciones; WhatsApp permanece en su posición anterior.
- Revisión temporal y capturas: `/private/tmp/pandas11-public-review-OxksCL/`. Cero solicitudes Supabase y ningún mensaje enviado.
- `git diff --check`: correcto.
