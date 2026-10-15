# Plan técnico

Estado: aprobado por el usuario; implementación y validación técnica completadas.

## Contexto

Revisados los cinco documentos base, la página de configuración, el componente de roles y su servicio. Los textos propios están actualmente en inglés. La documentación registra una interfaz mixta y deja pendiente la política general de idiomas; esta solicitud acota el cambio a configuración.

## Cambios propuestos

1. Traducir literales visibles y accesibles de `src/app/pages/settings/settings.component.html` y mensajes propios de su `.ts`.
2. Traducir literales de `src/app/shared/components/settings/role-settings/role-settings.component.html` y mensajes propios de su `.ts`.
3. Traducir los dos errores propios de `src/app/shared/services/roles.service.ts`, conservando intactas las operaciones de persistencia.
4. Cambiar únicamente el título de la ruta `configuracion` en `src/app/app.routes.ts`.
5. Registrar resultados en `validation.md`.

Ejemplos: Settings → Configuración; Appearance → Apariencia; Roles & permissions → Roles y permisos; Save preferences → Guardar preferencias.

Conservar valores `light`, `dark`, `ltr`, `rtl`, claves de secciones, bindings, clases y datos almacenados. No introducir internacionalización dinámica.

## Validación prevista

- Revisar el diff para comprobar que los cambios funcionales se limitan a literales y título.
- Revisar literales restantes en los archivos afectados, incluidos estados y accesibilidad.
- Ejecutar comprobación TypeScript sin emisión y `npm run build` para validar plantillas.
- Registrar que no existen suites unitarias identificadas; no añadir pruebas que solo repliquen las traducciones.
- Revisar visualmente inicio de configuración y apariencia si hay herramientas disponibles. No ejecutar escrituras de roles contra una base real para probar textos; registrar como pendiente lo que no pueda validarse sin esas operaciones.

## Riesgos y límites

Los textos dinámicos y errores externos pueden estar en inglés. Los componentes globales no forman parte de esta traducción. No se modifica el esquema, Auth ni RLS, ya que no se añaden operaciones de datos.

## Aprobación

El usuario autorizó explícitamente la implementación del plan en la conversación: «Te doy autorización para implementarlo».
