# List

Lista de ítems con divisores, normal o en tarjeta (`inset`).

## Cuándo usarlo
Menús de ajustes, opciones, resultados, cualquier colección vertical.

## Variantes y estados
`inset` la envuelve en tarjeta.

## Móvil y otras plataformas
iOS: List(.insetGrouped). Android: LazyColumn con ListItem.

## Accesibilidad
`role="list"`.

## Evita
No mezcles alturas de ítem muy distintas.

## Props (React)

```ts
{ children: ListItem[]; inset?: boolean }
```
