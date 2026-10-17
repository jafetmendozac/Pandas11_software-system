# Stack técnico

Fecha de verificación: 2026-10-15 (America/Lima).
Estado: inventario local; no acredita versiones desplegadas.

## Versiones verificadas

Versiones obtenidas de los paquetes instalados en `node_modules`, no únicamente de los rangos de `package.json`.

| Herramienta o librería | Versión local |
|---|---:|
| Node.js | 22.23.2 |
| npm | 10.9.8 |
| Angular Core | 22.1.4 |
| Angular CLI | 22.1.6 |
| Angular Build | 22.1.6 |
| TypeScript | 6.0.3 |
| supabase-js | 2.116.0 |
| RxJS | 7.8.2 |
| Tailwind CSS | 4.1.12 |
| FullCalendar / adaptador Angular | 7.0.2 / 7.0.2 |
| ApexCharts / ng-apexcharts | 7.1.0 / 3.1.0 |
| Flatpickr | 4.6.13 |
| Swiper | 14.2.0 |
| amCharts 5 / geodata | 5.13.5 / 5.1.5 |
| Karma | 6.4.4 |
| Jasmine Core | 5.6.0 |

`package-lock.json` existe. `package.json` declara además Angular CDK, Popper, Prism.js, ng-otp-input, temporal-polyfill, PostCSS, tslib, Zone.js y complementos de Karma. Su presencia no implica uso funcional en todos los flujos.

La versión de PostgreSQL remota y la versión instalada de Supabase CLI no fueron verificadas. El SQL contiene `NULLS NOT DISTINCT`, que exige PostgreSQL 15 o posterior para esa construcción.

## Configuración

- Aplicación `ng-tailadmin`, versión declarada 1.1.2.
- Bootstrap standalone mediante `bootstrapApplication`.
- Builder `@angular/build:application`; salida configurada en `dist/ng-tailadmin`.
- Desarrollo con mapas de fuentes y reemplazo de `environment.ts` por `environment.development.ts`.
- Producción como configuración predeterminada del build; desarrollo como predeterminada del servidor.
- TypeScript estricto, objetivo ES2022 y resolución de módulos `bundler`.
- Angular con `strictTemplates`, `strictInjectionParameters` y `strictInputAccessModifiers`.
- Zone.js y `provideZoneChangeDetection({ eventCoalescing: true })`.
- Tailwind v4 mediante PostCSS y tokens en `src/styles.css`.
- Presupuesto inicial: advertencia 4 MB, error 5 MB; estilos por componente: 4 kB y 8 kB.

## Servicios y herramientas

Supabase Auth y acceso a tablas mediante supabase-js están integrados en el frontend. No se identificó una API propia intermedia. La configuración CLI local habilita servicios adicionales, pero eso no demuestra uso por la aplicación ni despliegue remoto.

Los entornos reales están ignorados por Git. `environment.example.ts` documenta URL y clave pública de Supabase mediante placeholders. No se incluyen credenciales en estas especificaciones.

Los scripts y resultados de validación se documentan en [baseline.md](baseline.md).

## Convenciones observadas

- Componentes standalone organizados por páginas, componentes compartidos y layouts.
- Servicios singleton por dominio; consultas asíncronas con promesas.
- Formularios principalmente con `FormsModule`, `ngModel` y validación manual.
- Estado local, signals y `BehaviorSubject`; preferencias visuales en `localStorage`.
- Tipos de dominio manuales; cliente Supabase sin tipo generado `Database`.
- Textos existentes en español e inglés. No se establece una política nueva de traducción.

## Reglas vigentes

Conforme a [AGENTS.md](../AGENTS.md), sección activa Angular + Supabase:

- Leer las especificaciones y el código relacionado antes de intervenir.
- Respetar versión, estructura y patrones existentes; evitar `any` innecesario.
- Aprobar el plan antes de implementar funcionalidades nuevas.
- Justificar dependencias nuevas y solicitar aprobación para cambios de alcance.
- Verificar RLS y permisos; no usar claves secretas o `service_role` en Angular.
- Documentar cambios SQL mediante migraciones; no ejecutar cambios en producción.
- No sobrescribir cambios del usuario, borrar archivos, actualizar dependencias o hacer commits/pushes sin autorización.
- Utilizar datos sintéticos para pruebas y registrar resultados y limitaciones.

El bloque inicial de instrucciones TailAdmin está comentado en `AGENTS.md`; no se convierte aquí en una nueva política obligatoria. Sus convenciones visuales pueden contrastarse con el código cuando se apruebe una intervención de interfaz.

## Pendiente de aprobación

Definir política de idiomas, entorno reproducible de desarrollo, estrategia de tipos de base de datos y herramientas adicionales de pruebas. Ninguna instalación o actualización forma parte de esta entrega.

Fuentes: [package.json](../package.json), [angular.json](../angular.json), [tsconfig.json](../tsconfig.json), [configuración Supabase](../supabase/config.toml).

## Actualización Fase 0 — 2026-10-17

Supabase CLI utilizada para crear migración, iniciar/reconstruir instancia local, lint y pgTAP. Docker Server observado: 29.8.2. Se añadieron pruebas Jasmine/Karma de autorización y script API Node con supabase-js ya instalado, sin dependencias nuevas. `npm run start:local` genera un entorno ignorado con clave pública de la instancia 55321; los entornos previos no se sobrescriben.
