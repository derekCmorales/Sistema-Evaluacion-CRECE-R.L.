# Stagger

Hace entrar a sus hijos en cascada (crecer hacia arriba, 60ms entre cada uno).

## Cuándo usarlo
Primera carga de listas, tarjetas de inicio, resultados.

## Variantes y estados
`as` para la etiqueta contenedora.

## Móvil y otras plataformas
Compose: AnimatedVisibility con delay por índice; SwiftUI: .transition + .animation(.delay(i*0.06)).

## Accesibilidad
Se desactiva con reducir movimiento; el contenido siempre queda visible.

## Evita
Solo en la primera aparición, no en cada re-render.

## Props (React)

```ts
{ children; as?: string; className?: string }
```
