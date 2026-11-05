# Validación — ocho servicios y limpieza de pelaje

Fecha: 2026-11-05. Alcance: Supabase local 55321/55322, sin reset ni conexión remota.

## Resultado

- La migración 20261105000000 se aplicó incrementalmente: elimina reglas por pelaje, columnas de pelaje en mascotas/tarifas y el enum; mantiene unicidad por servicio, tamaño y raza.
- El seed local se ejecutó dos veces con éxito. Conservaron sus IDs las tres citas existentes. Hay ocho servicios activos del seed, cuatro antiguos archivados y cero tarifas asociadas a estos últimos.
- «Servicio Duplex» y «Servicio Express» permanecen activos fuera del seed, con sus dos tarifas; decisión explícita del usuario.
- El seed comercial se repitió: conserva la cita, dos ventas y la caja cerrada. La cita histórica existente sigue asociada al antiguo servicio; una carga nueva usa «Baño estético».
- Consulta agregada local: ocho servicios demo activos, cero antiguos activos, cero tarifas demo antiguas, dos servicios ajenos activos y enum de pelaje ausente.

| Verificación | Resultado |
|---|---|
| Pruebas SQL | 370/370 correctas |
| Análisis SQL local | Sin errores; advertencia previa de volatilidad en contact_queue |
| Verificación del seed local | 41/41 correctas |
| Verificación del seed comercial | 19/19 correctas |
| API agenda | 82/82 correctas |
| API servicios/precios | 50/50 correctas |
| API clientes/mascotas | 42/42 correctas |
| Sintaxis Node y revisión de espacios | Correctas |

No se cambió Angular ni dependencias; la compilación Angular no se repitió en esta tarea. Los importes y tiempos de los nuevos servicios son fixtures sintéticos y necesitan definición comercial antes de usarse como precios reales. Las pruebas SQL/API no sustituyen una reconstrucción de base vacía ni una revisión visual completa.
