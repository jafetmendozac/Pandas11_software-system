# Mejora de la pantalla de acceso restringido

Fecha: 2026-10-26 (America/Lima). Solicitud del usuario: mejorar la página existente de acceso restringido. Es un ajuste de presentación del flujo de identidad ya aprobado en Fase 0, sin permisos ni operaciones nuevas.

## Contexto y reglas

`/access-denied` recibe redirecciones del guard del panel cuando falta `panel.access` o un permiso de ruta, cuando la cuenta no está activa o cuando no se puede comprobar la autorización. El guard comercial también puede redirigir allí. La pantalla anterior atribuía la denegación solo al panel o a una cuenta inactiva, mostraba «Mi perfil» siempre y no ofrecía una salida pública clara.

Se conserva F0-07/F0-09: Angular orienta, mientras que el guard y RLS mantienen la autorización. RN-13, RN-16, RN-21 y RN-27 muestran que los permisos dependen de la operación y del rol; la pantalla no debe prometer acceso ni deducir el motivo exacto de una denegación.

## Criterios

| ID | Criterio | Relación |
|---|---|---|
| AR-01 | Título y explicación indican que la sección no pudo abrirse, sin afirmar una causa que la pantalla no conoce ni mostrar códigos técnicos. | F0-07; RN-13, RN-16, RN-21, RN-27 |
| AR-02 | «Volver al inicio» siempre lleva a una ruta pública; «Ver mi perfil» aparece solo cuando la comprobación confirma una cuenta activa. | F0-07 |
| AR-03 | «Cambiar de cuenta» cierra sesión antes de ir a `/signin`; mientras procesa evita doble envío y, si falla, muestra un mensaje accesible sin navegar. | F0-07, F0-09 |
| AR-04 | La pantalla usa jerarquía clara, foco visible, texto legible, temas claro/oscuro, móvil y espaciado lógico para RTL. | F0-09 |

No se cambia el guard, `AuthorizationService`, RLS, esquema, roles ni el destino de otras páginas.
