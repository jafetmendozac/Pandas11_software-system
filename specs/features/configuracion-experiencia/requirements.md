# Correcciones de experiencia en configuración

Estado: requisitos y alcance aprobados mediante «Vamos con eso» el 2026-10-28, después de la propuesta exacta en la conversación.

| ID | Criterio de aceptación | Regla |
|---|---|---|
| UX-C01 | En el editor semanal, el control de archivo se presenta en español con el nombre de la imagen elegida; al elegir un archivo válido se abre una vista previa modal que se cierra con botón o Escape y devuelve el foco. | RN-31 |
| UX-C02 | «Asignar permisos» y «Usuarios y roles» utilizan el selector personalizado. En la presentación de permisos se leen descripciones en español; los códigos técnicos siguen siendo los mismos para consultas y escrituras. | F0-06/F0-07 |
| UX-C03 | La selección claro/oscuro se ve de inmediato. Guardar persiste el tema, Descartar lo restaura y la aplicación aplica el tema guardado al iniciar. Se retira el control «Dirección de lectura» únicamente de Apariencia. | UX-04 de configuración, sustituido en esta parte |
| UX-C04 | «Cambiar contraseña» abre un formulario de nueva contraseña y confirmación para la sesión autenticada; valida, actualiza con Supabase Auth y muestra éxito o error sin cerrar sesión. | Identidad Fase 0 |
| UX-C05 | Mi perfil deja de mostrar la opción 2FA que solo cambiaba estado local. | Identidad Fase 0 |

La dirección RTL disponible en el menú de idioma del encabezado queda fuera de este ajuste. El modelo `Pandas11.sql`, las políticas RLS y la migración de panfletos no cambian. No se introducen dependencias ni se ejecuta despliegue remoto.
