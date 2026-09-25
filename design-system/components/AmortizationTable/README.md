# AmortizationTable

Plan de pagos (mes, cuota, capital, interés, saldo).

## Cuándo usarlo
Detalle de simulación o de préstamo activo.

## Variantes y estados
`limit` filas.

## Móvil y otras plataformas
En móvil, lista de cuotas por mes en vez de tabla.

## Accesibilidad
Tabla con caption.

## Evita
—

## Props (React)

```ts
{ schedule: { month, payment, capital, interest, balance }[]; limit?: number }
```
