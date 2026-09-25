# LoanCalculator

Simulador de cuota: monto, plazo y cuota animada con desglose y CTA.

## Cuándo usarlo
Simular antes de solicitar, en app y web.

## Variantes y estados
`min` `max` `step` `rate` `terms` `defaultAmount` `defaultTerm` `ctaLabel`.

## Móvil y otras plataformas
Pantalla completa; CTA `lg` fijo abajo.

## Accesibilidad
Cuota con aria-live (AnimatedNumber).

## Evita
Siempre con disclaimer; nunca prometas aprobación.

## Props (React)

```ts
{ min?; max?; step?; rate?; terms?: number[]; defaultAmount?; defaultTerm?; onApply?: ({ amount, term, payment }) => void; ctaLabel?: string }
```
