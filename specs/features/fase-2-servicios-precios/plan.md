# Plan técnico — Fase 2

Estado: aprobado por el usuario el 2026-10-17; implementado localmente.

1. Comprobar en modo lectura la instancia local y existencia de tablas antes de aplicar. Crear migración con Supabase CLI extrayendo únicamente services/service_prices de Pandas11.sql, dependientes de enums ya instalados por Fase 1. No ejecutar el SQL raíz completo.
2. Proponer y reflejar en modelo/migración: UUID/defaults y timestamps; nombre no vacío, base_price y price no nulos/no negativos con máximo dos decimales, base_duration_minutes/duration_minutes enteros positivos; service_id obligatorio; booleanos no nulos. No coaccionar silenciosamente precisión monetaria ni rellenar datos reales con ceros. Si existen datos incompatibles, presentar conciliación antes de endurecer restricciones.
3. Conservar NULL de tamaño/pelaje como comodín y unicidad NULLS NOT DISTINCT. Mantener FK/índice sin duplicarlos y sin eliminación física del servicio.
4. Crear permisos y RLS de catálogo según matriz, con grants de columnas, timestamps del servidor y controles de servicio padre para tarifas. Los CLIENT solo leen activos/visibles; STAFF consulta global con permiso. No alterar invariantes de identidad.
5. Implementar RPC de cálculo basada en una consulta ordenada por precedencia explícita, con SECURITY INVOKER y comprobación de servicio activo/accesible; sin combinación de campos y sin resultado silencioso cuando no hay servicio permitido. Precio calculado en PostgreSQL numeric, devolución decimal segura con origen. No confiar en datos enviados por cliente como precio autoritativo.
6. Adaptar servicios Angular existentes y formularios para nullabilidad, TOY y validación de decimales/minutos. Reutilizar callback asíncrono y paginación remota de PersonalizedTable; evitar desmontar formularios durante carga.
7. Añadir simulador reutilizable en la sección de tarifas y ruta de catálogo propio fuera del panel, con enlace desde perfil. Entrada explícita de dimensiones; sin acceso adicional a datos de mascotas. En rutas/menú/botones aplicar permisos de dominio.
8. Aplicar migración con `supabase migration up --local` únicamente sobre identity-dev existente, preservando cuentas/fixtures del usuario y SIN reset. Sin link/push/repair remoto. Documentar si preflight detecta esquema distinto.
9. Añadir pruebas SQL y API con fixtures aleatorios; verificar nivel de prioridad, desconocidos/NULL, duplicados, importes, roles y servicio oculto/desactivado. Angular: validación y persistencia con fallos, resultado/carga del simulador. Repetir Fases 0/1, lint, tipos y build.
10. Actualizar validación, arquitectura, baseline, roadmap y README local con evidencia y límites. Cambios en reglas de negocio se etiquetan como decisiones aprobadas solo después de autorización.

## Impacto

Modelo local, nueva migración y tests, services/tarifas existentes, nuevo simulador/catálogo, rutas/guard/sidebar/perfil y especificaciones. Sin dependencias nuevas ni cambio de estructura general. No modificar agenda ni appointments en esta fase; el cálculo queda disponible para su integración futura por plan independiente.

## Referencia y discrepancias

Los CHECK actuales permiten NULL y services carece de checks de precio/duración. Angular trata dimensiones como obligatorias y convierte vacíos a cero. Las correcciones se proponen aquí antes de implementarse. La prioridad se presenta como propuesta actual, no como una regla confirmada por el DBML histórico ausente.

## Aprobación

El usuario autorizó esta Fase 2 explícitamente («Claro dale»), después de presentar prioridad, tarifa completa, cero permitido y matriz. No se autoriza despliegue remoto.

## Concreción técnica

El cálculo retorna price como texto decimal exacto y duration_minutes como entero. Los formularios de precio usan texto con validación decimal (punto como separador) para no perder precisión mediante Number. La migración usa numeric sin escala coercitiva y CHECK de dos decimales/valor finito; no redondea silenciosamente una entrada inválida. Las reglas confirmadas se registran como RN-11/RN-12 en business-rules.md.
