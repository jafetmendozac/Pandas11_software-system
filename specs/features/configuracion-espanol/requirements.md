# Configuración en español

Estado: alcance aprobado por el usuario en la conversación.

## Solicitud y alcance

Mostrar en español los textos propios de la página `/configuracion`, incluida su sección de roles y permisos. Se interpreta la solicitud como traducción fija de esta página, sin selector de idioma ni paquetes de traducción.

## Criterios de aceptación

- R-01: encabezados, tarjetas, botones, ayudas, placeholders, etiquetas accesibles y estados vacíos o de carga de configuración y roles aparecen en español.
- R-02: los mensajes propios de éxito, validación y error de esos componentes y los errores propios del servicio de roles se muestran en español. Los mensajes externos devueltos por Supabase pueden conservar su idioma original.
- R-03: el título de la ruta utiliza «Configuración». La ayuda de dirección explica que cambiar LTR/RTL no cambia el idioma, sin afirmar que la interfaz permanece en inglés.
- R-04: tema, dirección, navegación y operaciones de roles conservan su comportamiento, identificadores y valores técnicos.
- R-05: nombres, códigos y descripciones procedentes de la base de datos no se traducen ni modifican automáticamente.

## Límites

No incluye traducir perfil, header, sidebar o componentes globales compartidos, ni toda la aplicación. No incluye consultas nuevas, cambios de permisos, migraciones o dependencias. Las migas compartidas pueden conservar texto global fuera del título específico de la página.

## Decisión pendiente

Alcance y plan aprobados explícitamente por el usuario en la conversación.
