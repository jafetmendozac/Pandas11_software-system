# Validación — Registro visual de ventas

Fecha: 2026-10-22. Plan aprobado mediante «Bamos con la implementación». Interfaz implementada y validada localmente con límites de cobertura descritos abajo.

## Entrega

`/ventas` y `/productos` son páginas standalone con rutas lazy, breadcrumb, tarjetas y permisos. El guard comercial consulta una RPC protegida que exige OWNER/ADMIN; el menú realiza la misma comprobación. Se reutilizan RLS y operaciones existentes: sin cambios de esquema, nuevas migraciones, dependencias ni despliegue remoto.

Ventas permite buscar/paginar, consultar detalle, crear borradores con cliente y cita completada opcional, seleccionar productos activos por unidad, confirmar únicamente servicios y anular con motivo/versionado. Los cobros de cita se muestran por referencia y el acceso a pagos exige permiso independiente. Catálogo permite alta/edición/desactivación. Los importes persistidos proceden del servidor; no se suman como números de coma flotante.

## Evidencia ejecutada

| Comprobación | Resultado |
|---|---|
| TypeScript app/spec sin emisión | Correcto |
| `npm test -- --watch=false --browsers=ChromeHeadless` | 100/100 correctas; seis nuevas pruebas de creación/reintento, bloqueo, productos, conflictos, cantidades y motivo, más una regresión de restauración de sesión |
| `supabase test db` | 171/171 correctas, siete suites |
| `node scripts/test-sales-api.mjs` | 26 comprobaciones correctas vía API local; catálogo, exactitud, borrador, idempotencia, detalle, listado, conflictos y roles |
| `npm run build` final | Correcto; advertencia previa CSS de inicio: 118 bytes sobre presupuesto |
| Build local temporal | Correcto, `/private/tmp/pandas11-sales-build` |
| `git diff --check` | Correcto |

Build/pruebas necesitaron ejecución fuera del sandbox: esbuild abortó con 134 y Supabase no pudo escribir telemetría dentro del sandbox. Las pruebas de menú necesitaron un proveedor simulado de SalesService tras incorporar la autorización comercial; se corrigieron y la suite final pasó. API usa exclusivamente 127.0.0.1:55321/55322, cuentas y fixtures propios y los elimina al finalizar; claves locales solo en memoria del script Node, nunca en Angular ni salida.

RV-01–RV-07: implementación y comprobación de contratos existentes; los recorridos UI específicos no cubiertos deben distinguirse de las pruebas SQL/API. RV-08: pruebas unitarias de reintento y conflictos, controles deshabilitados y trampa de foco CDK implementados; recorrido Chrome por menú completado (ver abajo).

## Límites

No hay stock, cobro de mostrador, saldo mixto, caja, edición de líneas persistidas, devolución ni documento tributario. Anulación con dinero exige OWNER en servidor; el botón permite solicitarla a ADMIN y el servidor informa la denegación. Selector de citas consulta páginas de citas completadas entre 2000 y 2100 y filtra por cliente en cada página, de modo que una página puede quedar vacía y debe avanzarse. Clientes/citas/productos requieren sus permisos propios; no se amplía RLS.

La revisión Chrome inicial falló al recargar productos durante el ensayo. Se añadió espera de autorización al guard y se corrigió AuthorizationService para reconsultar si una restauración de sesión invalida la carga en curso; no reintenta con usuario nulo tras SIGNED_OUT. La nueva prueba de restauración y las anteriores de cierre de sesión pasan. No se contabilizan intentos fallidos ni excepciones del script temporal como recorridos aprobados. No se verificó entorno remoto ni se hicieron commits/pushes.

## Recorrido Chrome

Build local y usuarios sintéticos: alta de producto desde formulario, elección de cliente y producto, creación de borrador desde UI y bloqueo de confirmación de artículos. OWNER/ADMIN acceden y STAFF recibe denegación. El foco inicial falló al apuntar a Cerrar deshabilitado durante el guardado: se mantiene enfocable con aria-disabled y el método impide cerrar durante envío. El recorrido posterior verificó foco dentro del diálogo. Vista 390px oscuro/RTL sin desborde, sin excepciones JavaScript de aplicación ni conexiones Supabase remotas. El harness es temporal, no una suite E2E versionada.

No se verificaron visualmente confirmación de servicios, anulación con cobro ni cada combinación de permisos: disponen de cobertura SQL/API parcial y controles existentes, pero no se presentan como recorridos humanos completos. Las recargas directas de productos fallaron inicialmente, incluso tras esperar autorización en el guard. Tras corregir la carga invalidada por restauración de sesión en AuthorizationService, el recorrido final incluyó navegación de menú y recarga directa de `/productos`, ambas correctas. No se declara 4.2 completa de punta a punta.

Capturas del recorrido final: `/private/tmp/pandas11-sales-review-Qcz2NO/desktop.png`, `products.png` y `mobile-dark-rtl.png`. Se inspeccionó visualmente la captura móvil oscuro/RTL del recorrido equivalente anterior NPItKi, con contraste correcto y sin desborde. Los artefactos son temporales.
