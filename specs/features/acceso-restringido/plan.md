# Plan de implementación — Acceso restringido

Fecha: 2026-10-26. Autorizado por la solicitud directa «Mejora la página de que muestra el acceso restringido» con la skill `pandas-ui-ux`; se limita a una pantalla existente.

1. Sustituir el contenido mínimo de `AccessDeniedComponent` por una plantilla centrada, con lenguaje comprensible y salida pública prioritaria.
2. Reutilizar `AuthorizationService.refresh()` para mostrar el enlace al perfil únicamente si la cuenta activa puede abrirlo. Conservar `SupabaseService.signOut()` y añadir estado de espera/error para cambiar de cuenta.
3. Mantener ruta y guard actuales. Usar Tailwind y colores del proyecto, sin dependencias o cambios de datos.
4. Probar decisiones de navegación y error en Jasmine/ChromeHeadless; compilar Angular y revisar visualmente cuando las herramientas locales respondan.

No hay ampliación del modelo `Pandas11.sql`: identidad sigue usando `profiles`, `roles`, `permissions`, `user_roles` y `role_permissions`. Las migraciones/RLS existentes son la fuente operativa local; esta página no consulta tablas nuevas.
