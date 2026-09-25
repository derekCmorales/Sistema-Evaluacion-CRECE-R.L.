# TransactionItem

Movimiento con ícono, descripción, fecha y monto con signo.

## Cuándo usarlo
Listas de movimientos y estados de cuenta.

## Variantes y estados
Ingresos en verde con flecha entrante; egresos en tinta neutra.

## Móvil y otras plataformas
Alto 64; agrupa por día con encabezado caption.

## Accesibilidad
El signo +/− se lee; no dependas del color.

## Evita
No uses rojo para egresos normales.

## Props (React)

```ts
{ title: string; meta: string; amount: number; icon?: Icon; incoming?: boolean }
```
