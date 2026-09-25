# ProgressBar

Barra de progreso con etiqueta y valor; entra creciendo.

## Cuándo usarlo
Avance de metas, completitud de perfil/expediente, cargas.

## Variantes y estados
`tone` accent/success, `indeterminate`, `valueLabel`.

## Móvil y otras plataformas
Alto 8, radio completo.

## Accesibilidad
`role="progressbar"` con valores.

## Evita
—

## Props (React)

```ts
{ value: number; max?: number; label?: string; valueLabel?: string; tone?: 'accent'|'success'; indeterminate?: boolean }
```
