# Desparasitación en la ficha de mascotas — requisitos propuestos

Estado: aprobado con ampliación del usuario el 2026-11-13. Fecha: 2026-11-13 (America/Lima).

## Contexto comprobado

- El negocio ofrece desparasitación en la portada y en el catálogo de servicios, pero el antecedente editable de la ficha de mascota registra vacunas.
- `RecordDetailsComponent` consulta y edita `pet_vaccinations`; `/mis-datos` muestra esos mismos registros al cliente.
- `Pandas11.sql` y la migración local de Fase 1 contienen `pet_vaccinations` con `vaccine`, `applied_on` y `valid_until`. Hay permisos y RLS específicos para vacunas. El SQL local no prueba el estado remoto.
- El seed local incluye dos vacunas DEMO. No se deben transformar automáticamente en desparasitaciones.

## Alcance propuesto

- DM-01: La ficha operativa de mascota permitirá consultar, registrar y corregir desparasitaciones. Cada registro tendrá producto o tratamiento obligatorio, fecha de aplicación obligatoria y próxima fecha opcional, no anterior a la aplicación.
- DM-02: `/mis-datos` mostrará solo las desparasitaciones de las mascotas vinculadas al cliente, en lectura, con estados de carga, vacío y error coherentes.
- DM-03: OWNER y ADMIN podrán registrar y corregir; STAFF solo consultar; CLIENT solo consultar las mascotas propias. Se conservarán la baja lógica y la ficha archivada de solo lectura. La autorización se aplicará mediante grants y RLS, no solo mediante botones.
- DM-04: Eliminar la funcionalidad de vacunas, incluida la tabla `pet_vaccinations`, sus permisos y los datos que contiene, mediante migración incremental local. No convertir vacunas en desparasitaciones ni modificar la migración histórica aplicada.
- DM-05: La desparasitación registrada como antecedente no creará automáticamente una cita, venta, cobro, stock ni recordatorio. El servicio comercial de desparasitación seguirá siendo independiente.

## Reglas y criterios de aceptación

Las reglas RN-03, RN-04, RN-05 y RN-07 no cambian: el antecedente no modifica capacidad, duración ni habilidades de la agenda. RN-09 tampoco cambia el momento del cobro. La matriz de lectura propia y notas internas de Fase 1 se conserva. `specs/business-rules.md` no tiene actualmente una regla específica de desparasitación.

| Criterio | Requisito | Comprobación |
|---|---|---|
| DM-A01 | DM-01 | Guardar y corregir producto/tratamiento y fechas válidas en ficha activa; rechazar nombre vacío o próxima fecha anterior |
| DM-A02 | DM-02 | CLIENT ve solo antecedentes de sus mascotas y nunca controles de edición ni notas internas |
| DM-A03 | DM-03 | Pruebas RLS para OWNER, ADMIN, STAFF, dos CLIENT distintos y ficha archivada; no basta con ocultar controles |
| DM-A04 | DM-04 | No quedan tabla, permisos ni controles de vacunas tras la migración; ningún dato de vacuna se presenta como desparasitación |
| DM-A05 | DM-05 | Registrar un antecedente no crea citas, ventas, movimientos de inventario o pagos |

## Decisión del usuario

El usuario aclaró que el negocio no realiza vacunas y autorizó eliminarlas y proceder. Los campos propuestos son «Producto o tratamiento», «Fecha de aplicación» y «Próxima fecha» opcional. Esta aprobación alcanza la eliminación local de los datos de vacunas. El esquema remoto no fue inspeccionado ni se autoriza modificarlo.
