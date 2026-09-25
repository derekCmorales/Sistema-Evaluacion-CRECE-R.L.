# Fab

Botón flotante para la acción principal de una pantalla móvil.

## Cuándo usarlo
Crear/añadir en listas móviles (nueva meta, nueva solicitud) o «Ayuda».

## Variantes y estados
Solo ícono (56px) o `extended` con texto; `accent` (defecto) o `brand`.

## Móvil y otras plataformas
Android: FloatingActionButton/ExtendedFAB. iOS: botón flotante propio, 16pt sobre la tab bar.

## Accesibilidad
Con solo ícono, `label` obligatorio.

## Evita
Uno por pantalla. No en web de escritorio.

## Props (React)

```ts
{ icon?: Icon; label: string; extended?: boolean; variant?: 'accent'|'brand' }
```
