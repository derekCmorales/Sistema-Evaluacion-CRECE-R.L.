# DonutChart

Proporciones de un total con leyenda y porcentajes.

## Cuándo usarlo
Composición de cartera, distribución de gastos (máx. 5 partes).

## Variantes y estados
`centerValue`, `centerLabel`.

## Móvil y otras plataformas
Leyenda debajo en pantallas estrechas.

## Accesibilidad
Porcentajes en texto en la leyenda.

## Evita
No para comparar valores cercanos (usa barras).

## Props (React)

```ts
{ data: { label, value }[]; size?; thickness?; format?; centerLabel?; centerValue? }
```
