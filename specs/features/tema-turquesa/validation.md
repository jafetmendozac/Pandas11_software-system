# Validación del tema turquesa

Fecha: 2026-10-20. Plan aprobado mediante «Dale vamos con eso».
Estado: implementación y validación técnica completadas; revisión visual manual pendiente.

## Resultado por requisito

| Requisito | Evidencia |
|---|---|
| R-01 | Escala global brand-25 a brand-950 turquesa, foco y selección Flatpickr vinculados a tokens. Búsqueda en src/ y public/ sin restos de los doce hexadecimales originales de marca en CSS, TypeScript, HTML y SVG. Los componentes existentes heredan el tema mediante sus utilidades brand. |
| R-02 | Portada usa tokens globales para acentos, fondos suaves, botones y sombra principal; conserva diseño y acentos secundarios. |
| R-03 | Contraste sRGB calculado: blanco/brand-500 (#087b85) 5.02:1; blanco/brand-600 6.23:1; brand-500/brand-50 4.67:1; brand-400/gris-900 7.80:1; brand-300/brand-950 9.39:1. Se conservan variantes dark y selectores hover/focus/disabled existentes. No equivale a una auditoría visual de todas las combinaciones de la aplicación. |
| R-04 | Diff conserva tokens de éxito, advertencia, error y colores semánticos de agenda. Series de gráficos sustituyen la antigua pareja azul por brand-500/brand-300; se mantiene su diferenciación. |
| R-05 | Cambios de aplicación limitados a colores, tokens y referencias de gráficos. Sin cambios de rutas, operaciones, dependencias o persistencia. RN-01 a RN-18 no requieren cambios; PN pendientes no condicionan esta entrega. |

## Comprobaciones ejecutadas

- `npm run build`: correcto, bundle inicial 3.42 MB. Advertencia: inicio.component.css ocupa 4.12 kB y supera en 118 bytes el presupuesto de aviso de 4 kB; no excede el límite de error. No se alteraron presupuestos.
- `npm test -- --watch=false --browsers=ChromeHeadless` con includes de inicio.component.spec.ts, app-sidebar.component.spec.ts, signin-form.component.spec.ts y signup-form.component.spec.ts: **15 pruebas correctas**, Chrome Headless 155. Verifican portada pública, separación del panel, menú móvil, navegación y autenticación con dobles de servicios.
- Ambas ejecuciones iniciales restringidas terminaron con código 134; se repitieron fuera del sandbox con autorización y finalizaron correctamente.
- `git diff --check`: correcto.
- Parseo XML de SVG de logos e ilustraciones: correcto.
- Revisado ApexCharts instalado: Utils.getThemeColor y Fill admiten referencias CSS var(...), usadas por las series actualizadas.
- Sin nuevas pruebas unitarias para valores cromáticos; se ejecutaron suites existentes pertinentes y cálculo de contraste.

## Archivos afectados

- src/styles.css: paleta global, sombra de foco y selección de fechas.
- src/app/pages/inicio/inicio.component.css: armonización de portada.
- Componentes de gráficos bar-chart-one, line-chart-one, monthly-sales-chart, monthly-target y statics-chart: referencias a tokens.
- public/images/logo/: cuatro SVG con acento de marca actualizado.
- public/images/error/: diez SVG con acentos turquesa para claro/oscuro, sin cambiar su geometría.
- requirements.md, plan.md y este documento: trazabilidad SDD.

## Límites y protección

No se realizó inspección visual manual ni capturas de todas las pantallas, estados interactivos o gráficos renderizados; las pruebas funcionales no acreditan esa revisión. No se ejecutaron pruebas de base de datos porque no hubo impacto SQL, RLS ni consultas nuevas. No se accedió a producción ni se modificaron datos. La eliminación previa de angular-tailwind.png se conservó sin intervenir. Sin commits ni pushes.
