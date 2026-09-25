# Menu

Menú de acciones contextuales (dropdown).

## Cuándo usarlo
«Más opciones» en filas, tarjetas o barras.

## Variantes y estados
Separadores (`"-"`), íconos, acción `danger`.

## Móvil y otras plataformas
iOS context menu / action sheet; Android DropdownMenu o bottom sheet.

## Accesibilidad
`role="menu"/"menuitem"`.

## Evita
Máx. ~7 opciones.

## Props (React)

```ts
{ items: ({ label, icon?, danger?, onClick? } | '-')[] }
```
