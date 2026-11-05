# Revisión del seed de servicios y retiro de tarifas por pelaje

Estado: alcance confirmado el 2026-11-05. El usuario solicitó rehacer el seed y confirmó conservar los dos servicios ajenos.

## Catálogo solicitado

El seed local debe presentar estos ocho servicios con ortografía normalizada:

1. Baño estético
2. Baño medicado para piel delicada
3. Baño medicado para parásitos externos
4. Corte de pelo simple
5. Corte de pelo de raza
6. Desparasitación
7. Cepillados
8. Corte de uñas

## Criterios de aceptación

- CS8-01 (RN-04, RN-05, RN-12): el catálogo activo **del seed** contiene exactamente esos ocho nombres; no se atribuyen al negocio precios reales no proporcionados. Los importes y duraciones son valores sintéticos para cumplir el esquema y probar el flujo comercial.
- CS8-02 (RN-11, RN-12): se retiran las tarifas de ejemplo antiguas y todas las reglas cuya dimensión sea `pet_coat_type`; la cotización sigue usando tamaño/raza/base. No se transforma una regla por pelaje en una regla por raza.
- CS8-03 (RN-19): las citas y ventas demo históricas conservan sus referencias y snapshots. Los servicios antiguos referenciados se archivan, sin borrado en cascada.
- CS8-04: la carga es repetible en 127.0.0.1:55321/55322; detecta colisiones y preserva registros ajenos al seed. Se validan SQL, API, seed repetido y catálogo visible.

## Aclaración de alcance

Hay dos servicios locales fuera del seed: «Servicio Duplex» y «Servicio Express». El usuario confirmó conservarlos. Por tanto, «solo estos servicios» se aplica a los registros del seed; el catálogo local completo también mostrará esos dos servicios ajenos mientras permanezcan activos.
