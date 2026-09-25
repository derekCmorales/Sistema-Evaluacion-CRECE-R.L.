# RadioGroup

Grupo de opciones excluyentes con descripción opcional.

## Cuándo usarlo
2–5 opciones que conviene ver todas a la vez.

## Variantes y estados
Vertical (defecto) o `row`. Cada opción admite descripción.

## Móvil y otras plataformas
Android: RadioButton. iOS: lista con checkmark o ChoiceCards.

## Accesibilidad
`role="radiogroup"` con `label`.

## Evita
Más de 5 → Select.

## Props (React)

```ts
{ options: (string | [value, label, description?])[]; value; onChange: (v) => void; row?: boolean; name?: string; label?: string }
```
