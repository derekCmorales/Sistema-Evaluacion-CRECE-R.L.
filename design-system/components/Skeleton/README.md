# Skeleton

Placeholder animado que imita la forma del contenido mientras carga.

## Cuándo usarlo
Cargas >300ms de listas, tarjetas y saldos.

## Variantes y estados
`circle`, `lines`, ancho/alto.

## Móvil y otras plataformas
Shimmer de 1.4s; respeta «reducir movimiento».

## Accesibilidad
Contenedor con `aria-busy="true"`.

## Evita
No uses spinner para listas; usa skeleton.

## Props (React)

```ts
{ width?; height?; circle?: boolean; lines?: number }
```
