# Plan técnico

Estado: aprobado por el usuario mediante «Dale vamos con eso»; implementación y validación técnica completadas; revisión visual manual pendiente.

## Contexto comprobado

Revisados AGENTS.md, la habilidad sdd-feature, los documentos base de specs/, las reglas de negocio, el plan de inicio público, package.json, estilos globales y estilos de inicio. Angular 22 y Tailwind v4 según package.json. Los tokens brand globales aún son azules (#465fff en brand-500); inicio tiene una paleta turquesa independiente. Hay además valores de azul de marca literales en estilos globales que no cambiarían solo al actualizar tokens.

La documentación de identidad turquesa y la paleta azul del panel difieren actualmente; esta propuesta resuelve únicamente esa diferencia visual.

## Implementación propuesta

1. Definir una escala turquesa brand-25 a brand-950 en src/styles.css: tonos suaves para fondos, referencia aproximada #53BAC9 para acentos y tonos oscuros para controles con texto blanco. Elegir brand-500 con contraste suficiente para los botones existentes.
2. Revisar usos de azules literales en componentes, gráficos, SVG y estilos de terceros; vincular los que representen marca a tokens compartidos. Conservar colores con significado funcional y series diferenciadas.
3. Armonizar variables turquesa de src/app/pages/inicio/inicio.component.css con los tokens globales, manteniendo composición, fondos neutros y acentos secundarios.
4. Revisar contraste de acciones principales, enlaces y navegación en claro/oscuro, más estados interactivos, sin refactorizaciones ajenas al tema.
5. Compilar, ejecutar las pruebas Angular pertinentes disponibles y documentar evidencia y limitaciones en validation.md.

## Datos y seguridad

Consultado Pandas11.sql: entidades de identidad, clientes/mascotas, servicios/tarifas, empleados/disponibilidad, citas, pagos y auditoría. Ninguna tabla, relación, enum o restricción participa en la paleta visual. Las migraciones disponibles son de dominio y seguridad; no se propone modificar su contrato con Angular. Sin impacto en modelo, consultas, tipos de persistencia, RLS ni permisos; no se requiere migración ni acceso a Supabase remoto. Esta revisión no acredita el esquema desplegado.

## Protección del trabajo existente

Git registra una eliminación previa de angular-tailwind.png. Se conserva sin intervenir. No instalar dependencias ni modificar credenciales, producción o datos.

## Aprobación registrada

La Fase 3 de .agents/skills/sdd-feature/SKILL.md exige presentar el plan y esperar autorización antes de modificar código. La aprobación de este plan autoriza exclusivamente el alcance visual descrito.

El usuario aprobó explícitamente el plan mediante «Dale vamos con eso». Se implementó el alcance autorizado.
