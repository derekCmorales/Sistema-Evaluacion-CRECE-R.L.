# AnimatedNumber

Cifra que cuenta hasta su nuevo valor (ease-out cúbico, 600ms).

## Cuándo usarlo
Saldos al cargar, cuota del simulador, KPIs.

## Variantes y estados
`duration`, `format`.

## Móvil y otras plataformas
Compose animateFloatAsState; SwiftUI .contentTransition(.numericText()).

## Accesibilidad
Con reducir movimiento salta directo al valor.

## Evita
No animes montos en tablas ni listas.

## Props (React)

```ts
{ value: number; duration?: number; format?: (n) => string }
```
