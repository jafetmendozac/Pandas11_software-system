# Consultas del portal de cliente

Estado: alcance de experiencia aprobado por el usuario el 2026-11-02 («Vamos con lo que recomiendas»), después de la propuesta en conversación.

## Contexto y reglas

Las rutas `/mis-datos` y `/catalogo` ya existen bajo `profileGuard`. La primera reutiliza la tabla administrativa y la segunda presenta solo un simulador. `clients.profile_id` vincula como máximo una ficha al usuario; `pets.client_id` identifica sus mascotas. RLS de Fase 1 restringe cliente/mascota propios y Fase 2 restringe el catálogo visible para CLIENT. El SQL local es referencia; no acredita el esquema remoto.

F1-06/F1-09: el cliente consulta únicamente su ficha y mascotas, sin notas internas ni edición. F2-05 y RN-11/RN-12: el cliente ve servicios activos y visibles, y la cotización del servidor usa tamaño/pelaje y devuelve precio/duración sin reservar ni cobrar. Una cuenta sin ficha vinculada debe mostrar un estado explicativo. No inferir vínculo por email.

## Criterios de aceptación

| ID | Resultado esperado | Regla |
|---|---|---|
| PC-01 | Perfil presenta dos accesos claros e inmediatos a las consultas para toda cuenta autenticada, incluido personal con panel. La ficha propia sigue limitada a una vinculación `clients.profile_id`. | F0-07, F1-09 |
| PC-02 | `/mis-datos` presenta ficha propia y mascotas en tarjetas de lectura, con estados de carga, error, sin vínculo y sin mascotas. No muestra notas internas ni fichas ajenas. | F1-06, F1-09 |
| PC-03 | `/catalogo` presenta servicios activos/visibles en tarjetas y cotiza uno mediante la RPC existente. Elegir una mascota propia precarga tamaño y pelaje; también se pueden indicar dimensiones manualmente. El resultado muestra PEN y minutos, sin sugerir reserva. | F2-05, RN-11, RN-12 |
| PC-04 | Navegación entre Perfil, Mis datos y Catálogo funciona en móvil y teclado, con foco visible y texto legible en claro/oscuro. | F0-07 |
| PC-05 | Sin nuevos permisos, tablas, migraciones ni dependencias; servidor y RLS conservan la autorización. | F1-06, F2-05 |

## Límites

No se implementan autorreservas, edición de mascotas por CLIENT, precios personalizados por cuenta, fotos de mascota, historial clínico ni despliegue remoto. La selección de mascota solo completa dimensiones de cotización; no convierte la estimación en cita.

## Ajuste solicitado después de la primera entrega

El usuario comprobó que, con su cuenta de panel, no veía los accesos. Se elimina el filtro visual por `panel.access` y se ubican las dos tarjetas al inicio de Perfil. Esto cambia solo la navegación: `/mis-datos` sigue consultando exclusivamente la ficha vinculada a la cuenta y muestra un estado informativo cuando no existe.
