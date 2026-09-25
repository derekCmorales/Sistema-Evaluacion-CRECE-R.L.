# Select

Lista desplegable nativa con el estilo de campo.

## Cuándo usarlo
Elegir 1 opción entre 5 o más (departamento, garantía, rol). Menos de 5 → RadioGroup o ChoiceCards.

## Variantes y estados
Con `placeholder`, `error`, `disabled`, `optional`.

## Móvil y otras plataformas
Usa el picker nativo (iOS wheel/menu, Android dropdown/bottom sheet).

## Accesibilidad
Select nativo: teclado y lector de pantalla gratis.

## Evita
No reemplaces por menús custom sin necesidad.

## Props (React)

```ts
{ label?: string; options: (string | [value, label])[]; value?; defaultValue?; onChange?: (v) => void; placeholder?: string; help?; error?; disabled? }
```
