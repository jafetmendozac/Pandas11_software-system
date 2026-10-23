# Plan aprobado — panfletos semanales del inicio público

Fecha: 2026-10-23 (America/Lima). Estado: **aprobado por el usuario e implementado localmente**. Véase [validación](validation.md).

## Preflight y discrepancia documental

`InicioComponent` sirve `/` sin sesión ni lecturas remotas. La gestión interna usa rutas protegidas, `AuthorizationService` y permisos de PostgreSQL. `Pandas11.sql` contiene `business_settings`, pero no tabla especializada para día/orden/imagen/estado/texto alternativo; no hay bucket de Storage ni migración de panfletos. La propuesta añade modelo nuevo solo si la edición se hará desde la aplicación. El SQL de referencia no demuestra el estado desplegado: antes de aplicar migraciones se contrastarán las migraciones locales y el entorno autorizado. No se ejecutará `Pandas11.sql` completo, `db reset`, ni cambios de producción.

## Diseño propuesto

1. **Calendario:** semana recurrente lunes–domingo; el día se calcula en `America/Lima`, independiente del navegador. La lectura pública devuelve como máximo la posición activa del día. Si la página permanece abierta durante el cambio de día, reconsultar sin alterar el reloj del sistema.
2. **Modelo y archivos:** añadir `public.home_flyers` con `weekday` (1–7, clave primaria), ruta de objeto, texto alternativo, publicado, versión y auditoría de actor/fecha. Crear bucket **privado** de Supabase Storage con tipos JPG/PNG/WebP y límite de 5 MiB. Reflejar tabla en `Pandas11.sql`, una migración incremental, tipos y servicio Angular. Crear permiso `home_flyers.manage` para OWNER/ADMIN activos. RLS permite a anon leer solo la fila publicada del día y a gestores consultar las siete; escritura de configuración mediante RPC versionada. La política de Storage permite a anon obtener una URL firmada corta solo para el objeto referenciado por la fila pública del día, y a gestores cargar/reemplazar archivos. Una URL ya emitida podrá durar hasta su vencimiento aunque la pieza se desactive; se propone cinco minutos. El archivo nuevo se carga con ruta aleatoria antes de actualizar la posición; si falla la publicación, conservar la posición anterior y limpiar el archivo nuevo. Evitar borrar archivos compartidos o ajenos. Se probará este contrato de Storage/RLS localmente antes de aplicar la migración.
3. **Portada:** insertar un bloque destacado para el panfleto del día en `InicioComponent`, sin modificar login/CTA/horario. Mostrar la imagen completa (sin recortar texto del cartel), texto alternativo y opción de ampliación accesible. Carga diferida y estados de carga/error/respaldo; si el día carece de pieza activa, la portada actual sigue funcional. No descargar imágenes de otros días.
4. **Editor:** colocar acceso bajo `/configuracion` o ruta protegida equivalente según los patrones actuales; mostrar lunes–domingo, vista previa, carga, texto alternativo y publicación/desactivación. OWNER/ADMIN pueden editar; STAFF/CLIENT/anon no. Conservar la selección ante errores recuperables. No usar `service_role` en Angular ni instalar paquetes nuevos.
5. **Contenido inicial:** no inventar siete promociones ni publicar los carteles de referencia que muestran un teléfono distinto al WhatsApp confirmado. Las siete posiciones quedan vacías hasta que el negocio cargue material autorizado; la portada conserva su sección actual como respaldo.

## Validación prevista

- Pruebas SQL/RLS/Storage para anon, CLIENT, STAFF, ADMIN y OWNER; comprobar que lectura pública no exponga filas desactivadas ni permita firmar sus objetos, que la escritura no se habilite con URL directa y que la URL previamente firmada caduque según lo previsto.
- Pruebas del servicio y componentes para zona `America/Lima`, domingo, cambio de día, orden, ausencia/fallo de imagen, reemplazo fallido y permisos.
- `npm test -- --watch=false --browsers=ChromeHeadless`, `npm run build`, lint SQL y prueba API local si se incorpora modelo.
- Recorrido Chrome de portada y editor a 390/1280 px, claro/oscuro/RTL y teclado, con imágenes sintéticas; limpieza delimitada. Registrar resultados y límites en `validation.md`.

## Aprobación recibida

El usuario confirmó PS-D01/PS-D02 y luego autorizó ejecutar este plan con «Vamos con eso»; solicitó aplicar además `pandas-ui-ux` a la interfaz. La migración solo se aplicó en el entorno local. No hay autorización de despliegue remoto ni de publicación de material comercial.
