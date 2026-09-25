# Slider

Control deslizante con valor vivo y límites.

## Cuándo usarlo
Explorar un valor dentro de un rango: monto a simular, aporte mensual.

## Variantes y estados
`format` para moneda o unidades; `showLimits`.

## Móvil y otras plataformas
Pulgar de 26px (objetivo ampliado). Acompaña con un campo editable para precisión.

## Accesibilidad
Input range nativo con `output` asociado.

## Evita
No para valores exactos obligatorios.

## Props (React)

```ts
{ label: ReactNode; min; max; step?; value: number; onChange: (n) => void; format?: (n) => string; showLimits?: boolean }
```
