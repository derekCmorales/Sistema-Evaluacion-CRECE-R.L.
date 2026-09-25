# NumberStepper

Contador con botones − / + para valores enteros pequeños.

## Cuándo usarlo
Cantidades, número de cuotas, integrantes.

## Variantes y estados
`format` para unidades.

## Móvil y otras plataformas
iOS: Stepper. Android: botones tonales. Objetivos 44/48.

## Accesibilidad
Valor con `aria-live`.

## Evita
Rangos grandes → Slider o campo.

## Props (React)

```ts
{ value: number; onChange: (n) => void; min?; max?; step?; format?; label? }
```
