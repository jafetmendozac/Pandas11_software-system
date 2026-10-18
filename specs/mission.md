# Misión del proyecto

Fecha de referencia: 2026-10-15 (America/Lima).
Estado: documentación inicial basada en la auditoría aprobada; pendiente de revisión del usuario.

## Propósito

El proyecto existente adapta TailAdmin a Spa & Boutique Pandas 11. El código permite mantener información de clientes, mascotas, servicios, tarifas, empleados y cuentas, y contiene una agenda conectada a Supabase.

La deducción de negocio es facilitar la operación de un establecimiento de servicios para mascotas. El alcance comercial definitivo debe confirmarlo el usuario.

SDD se incorpora de manera gradual sobre esta aplicación, conservando su arquitectura. Esta documentación no autoriza cambios funcionales, de dependencias o de base de datos.

## Usuarios

| Usuario | Evidencia y estado |
|---|---|
| Persona con cuenta | Registro, inicio de sesión y perfil implementados en código |
| Personal operativo | Usuario deducido de las pantallas de clientes, mascotas y agenda; permisos pendientes de definir |
| Administrador o propietario | Usuario deducido del mantenimiento de empleados, roles y tarifas; privilegios pendientes de confirmar |
| Cliente con acceso público | Contemplado en el modelo local, pero sin portal funcional identificado |

Los nombres de roles del diseño no acreditan roles desplegados. Debe acordarse quién puede registrarse, acceder al panel y asignar roles.

## Funcionalidades existentes

“Implementado en código” significa que hay interfaz y lógica identificables. No equivale a funcionamiento remoto validado.

| Funcionalidad | Situación |
|---|---|
| Autenticación por correo y contraseña | Inicio, registro, cierre y consulta de sesión |
| Confirmación de correo | Pantalla informativa y comprobación en guard; flujo completo no validado |
| Clientes y mascotas | Consulta, creación, edición, baja lógica y asociación mascota–cliente |
| Servicios y empleados | Consulta, creación, edición y desactivación |
| Tarifas | Consulta, creación, edición y eliminación física |
| Perfil propio | Consulta y edición de nombres |
| Roles y permisos | Mantenimiento de roles y asignación de permisos a roles; sin asignación de usuarios identificada |
| Agenda | Integración implementada con discrepancias frente al SQL local |
| Apariencia | Tema y dirección persistidos en el navegador |
| Dashboard, gráficos y facturas | Interfaces con datos de demostración |

Pagos, notificaciones, vacunas, horarios, bloqueos y auditoría de negocio aparecen en el modelo SQL; no se consideran funcionalidades operativas completadas.

## Objetivos de adopción SDD

1. Registrar el comportamiento comprobado y sus límites en una línea base.
2. Acordar el contrato entre Angular y Supabase, especialmente para citas y autorización.
3. Definir requisitos y criterios de aceptación antes de cada nueva funcionalidad.
4. Implementar únicamente planes aprobados, de manera incremental y con validación pertinente.
5. Mantener trazabilidad entre requisito, cambio, evidencia y resultado.

## Incertidumbres y decisiones

- Confirmar si el objetivo inicial es exclusivamente operación interna.
- Confirmar perfiles de usuario y matriz de permisos.
- Determinar si el SQL local representa diseño futuro o esquema desplegado.
- Aprobar el alcance y la prioridad de cada etapa de [roadmap.md](roadmap.md).
- No asumir que pagos, portal público o facturación electrónica forman parte de la próxima entrega.

## Fuentes

- [Rutas Angular](../src/app/app.routes.ts).
- [Servicios Angular](../src/app/shared/services/supabase.service.ts).
- [Modelo SQL](../Pandas11.sql) y modelo DBML histórico (`database.md`, ausente en este checkout).
- Auditoría aprobada en la conversación; resultados reproducibles en [baseline.md](baseline.md).

## Ampliación confirmada: presentación pública — 2026-10-18

El usuario confirma que Spa Boutique Pandas11 se presenta al público como un centro de bienestar y embellecimiento canino: baño, estilismo, corte higiénico, artículos (champús, fragancias, complementos) y orientación profesional. Ubicación: Calle General Urco Mz.C Lote11, Urbanización Los Laureles, Trujillo, La Libertad. WhatsApp publicable:972704860; identidad predominantemente turquesa.

Se incorpora una portada pública en `/` para visitantes con o sin cuenta, con información del negocio y acceso al inicio de sesión. El panel interno permanece separado en `/panel`. El sitio informa y facilita coordinar por WhatsApp; no implementa autorreserva ni tienda online. Esta ampliación fue aprobada expresamente y se valida en [inicio público](features/inicio-publico/validation.md).
