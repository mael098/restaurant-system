# Prueba de Reutilización de Mesas

Este documento demuestra cómo las mesas pueden ser reutilizadas manteniendo el historial de pedidos.

## Flujo de Estados de Pedido

El sistema maneja los siguientes estados para los pedidos:

1. **PENDING** - Pedido creado, esperando confirmación
2. **CONFIRMED** - Pedido confirmado por el mesero
3. **PREPARING** - Pedido en preparación en cocina  
4. **READY** - Pedido listo para servir
5. **SERVED** - Pedido servido al cliente
6. **COMPLETED** - Pedido completado y pagado (mesa liberada)
7. **CANCELLED** - Pedido cancelado (mesa liberada)

## Lógica de Liberación de Mesas

- **Mesa OCUPADA**: Cuando se crea un pedido (`PENDING` a `READY`)
- **Mesa DISPONIBLE**: Cuando el pedido se marca como `SERVED` o `COMPLETED`

## Prueba del Flujo

### Paso 1: Verificar estado inicial
```
GET /api/debug/table-status
```

### Paso 2: Crear primer pedido en Mesa 1
```
POST /api/orders
{
  "tableId": "mesa-1-id",
  "waiterId": "mesero-id",
  "items": [...]
}
```
- Estado: Mesa 1 = OCCUPIED
- Pedido = PENDING

### Paso 3: Completar primer pedido
```
PATCH /api/orders/pedido-1-id
{
  "status": "COMPLETED"
}
```
- Estado: Mesa 1 = AVAILABLE
- Pedido = COMPLETED (se mantiene en historial)

### Paso 4: Crear segundo pedido en Mesa 1
```
POST /api/orders
{
  "tableId": "mesa-1-id", // Misma mesa
  "waiterId": "mesero-id", 
  "items": [...]
}
```
- Estado: Mesa 1 = OCCUPIED (reutilizada)
- Nuevo pedido = PENDING
- Pedido anterior sigue en historial como COMPLETED

## Verificación

El endpoint `/api/debug/table-status` muestra:
- Estado actual de todas las mesas
- Pedidos activos (no COMPLETED/CANCELLED)
- Permite verificar que las mesas se liberan correctamente

## Historial

Todos los pedidos se mantienen en la base de datos independientemente del estado de la mesa, permitiendo:
- Reportes de ventas
- Historial de clientes por mesa
- Análisis de rendimiento
- Auditoría completa
