# Chip

Píldora compacta para filtros, selección múltiple o entradas removibles.

## Cuándo usarlo
Filtros de listas (Todos/Pagos/Depósitos), etiquetas elegidas, sugerencias.

## Variantes y estados
Seleccionado (`selected`), con ícono, removible (`onRemove`).

## Móvil y otras plataformas
Android: FilterChip/InputChip. iOS: botón cápsula. Alto 32 con objetivo táctil ampliado a 44.

## Accesibilidad
`aria-pressed` refleja selección.

## Evita
No uses chips como botones de acción principal.

## Props (React)

```ts
{ children: ReactNode; selected?: boolean; onClick?: () => void; onRemove?: () => void; icon?: Icon }
```
