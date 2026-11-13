# Servicios y tarifas unificados

Fecha: 2026-11-13 (America/Lima). Estado: aprobado por el usuario mediante «Vamos entonces con esooo sip».

## Resultado esperado

Administrar cada servicio y sus precios por tamaño desde `/servicios-y-tarifas`, sin cambiar de pantalla y sin usar la raza como dimensión de precio. La raza permanece como dato de la mascota y catálogo independiente.

## Requisitos

- STU-01: `/servicios-y-tarifas` se presenta como «Servicios y tarifas» y conserva búsqueda, paginación, alta, edición y desactivación de servicios.
- STU-02: cada servicio ofrece «Ver tarifas». En un diálogo se muestran precio/duración base y los cinco tamaños; OWNER/ADMIN pueden crear, corregir o retirar una variación y STAFF solo consulta.
- STU-03: una variación exige tamaño, precio PEN no negativo con máximo dos decimales y duración entera positiva. Solo puede existir una variación por servicio y tamaño.
- STU-04: la cotización usa la variación exacta del tamaño cuando existe; en otro caso usa precio y duración base. Tamaño desconocido usa base. Precio y duración proceden siempre de la misma fuente.
- STU-05: raza deja de intervenir en `service_prices`, simulador, catálogo propio y cotización de agenda. No se elimina `pets.breed_id` ni el catálogo `pet_breeds`.
- STU-06: se retira «Tarifas» del menú; `/servicios` y `/tarifas` redirigen a `/servicios-y-tarifas` para conservar enlaces anteriores.
- STU-07: se mantienen permisos `services.read/manage` y `service_prices.read/manage`, RLS, visibilidad para CLIENT y snapshots históricos de citas.

## Reglas aplicables

- RN-04/RN-05: precio y duración pueden variar por tamaño; no se inventan valores comerciales.
- RN-07: `requires_specialist` sigue independiente del cálculo de tarifa.
- RN-11: se simplifica por decisión del usuario a tamaño exacto → valores base.
- RN-12: la regla ganadora aporta precio y duración completos; cero sigue siendo válido.
- RN-13: OWNER/ADMIN gestionan y STAFF consulta según permisos existentes.

## Criterios de aceptación

- STU-A01: desde una fila de servicio se abre su diálogo sin navegar a otra página y se reconoce el servicio y sus valores base.
- STU-A02: guardar una variación por tamaño actualiza la cotización; retirarla restablece los valores base.
- STU-A03: la UI, tipos, RPC y esquema no contienen raza como dimensión de `service_prices`; la agenda cotiza solo con servicio y tamaño.
- STU-A04: `/servicios` y `/tarifas` redirigen a `/servicios-y-tarifas`, y el menú muestra una sola entrada «Servicios y tarifas».
- STU-A05: OWNER/ADMIN escriben, STAFF consulta, CLIENT solo cotiza servicios activos/visibles y anon no accede.
- STU-A06: migración incremental local, pruebas SQL/API/Angular, tipos y build correctos; sin reset ni cambios remotos.

## Datos comprobados

La instancia local contiene dos filas de `service_prices`, ambas por tamaño y ninguna por raza ni general. No hay conflicto local al retirar `pet_breed_id`. El esquema remoto no fue inspeccionado.
