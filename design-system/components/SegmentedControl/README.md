# SegmentedControl

Selector de 2–4 opciones excluyentes en una píldora.

## Cuándo usarlo
Cambiar vista o filtro inmediato: periodo (Semana/Mes/Año), tipo (Préstamo/Ahorro/Inversión).

## Variantes y estados
Relleno `brand` (defecto) o `soft` (superficie blanca). `block` ocupa el ancho. Íconos opcionales.

## Móvil y otras plataformas
iOS: UISegmentedControl/Picker(.segmented). Android: SegmentedButton.

## Accesibilidad
`role="radiogroup"`; cada opción `role="radio"`.

## Evita
Más de 4 opciones → Tabs o Select.

## Props (React)

```ts
{ options: (string | [value, label, Icon?])[]; value: string; onChange: (v) => void; block?: boolean; soft?: boolean }
```
