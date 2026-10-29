# Plan técnico aprobado

El usuario aprobó el alcance exacto en la conversación del 2026-10-28 mediante «Vamos con eso».

1. En `home-flyers-settings.component.{ts,html}`, ofrecer botón y nombre de archivo en español. Usar el modal y la trampa de foco existentes para la vista previa tras elegir la imagen y permitir ampliar la imagen actual. Conservar validación, publicación y reintentos.
2. En `role-settings.component.{ts,html}`, sustituir los tres `<select>` nativos por `CustomSelectComponent`; adaptar ese componente para estado deshabilitado y Escape. Renderizar descripciones de permiso, traduciendo el marcador `OWNER` de la presentación a «Propietario»; no modificar códigos ni asignaciones.
3. En `settings.component.{ts,html}` y `theme.service.ts`, previsualizar el tema sin persistir hasta guardar; descartar restaura el valor almacenado. Inyectar `ThemeService` desde `app.component.ts` para aplicar el tema en toda ruta al iniciar. Retirar el control de dirección solo en Apariencia.
4. En `profile.component.{ts,html}` y `supabase.service.ts`, reemplazar la acción incorrecta de cerrar sesión por un formulario modal de contraseña y una llamada a `auth.updateUser({ password })`. Eliminar la interfaz 2FA.
5. Añadir o actualizar pruebas de los comportamientos relevantes, ejecutar compilación y pruebas pertinentes y registrar evidencia en `validation.md`.

No hay cambios de esquema, RLS, permisos, valores técnicos ni configuración de Supabase Auth. La documentación histórica de configuración en español se actualiza con la decisión posterior.
