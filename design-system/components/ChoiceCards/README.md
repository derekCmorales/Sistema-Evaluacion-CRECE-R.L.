# ChoiceCards

Opciones excluyentes como tarjetas tocables, con ícono y descripción.

## Cuándo usarlo
Elecciones visuales importantes: plazo, tipo de producto, propósito del préstamo.

## Variantes y estados
`columns`; con o sin `icon`/`description`.

## Móvil y otras plataformas
Grilla 2–3 columnas en móvil; tarjeta ≥48 de alto.

## Accesibilidad
`role="radiogroup"` / `role="radio"`.

## Evita
Máx. 6 opciones.

## Props (React)

```ts
{ options: { value, title, description?, icon? }[]; value; onChange: (v) => void; columns?: number; label?: string }
```
