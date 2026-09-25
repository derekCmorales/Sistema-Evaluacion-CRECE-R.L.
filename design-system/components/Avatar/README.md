# Avatar

Iniciales o foto en círculo (o cuadrado), con estado y grupos.

## Cuándo usarlo
Personas: asociados, asesores, usuarios del sistema.

## Variantes y estados
Tamaños `sm` 32, `md` 40, `lg` 56; `square`; `online`; `AvatarGroup` para varias personas.

## Móvil y otras plataformas
Mismos tamaños en pt/dp.

## Accesibilidad
`aria-label` con el nombre.

## Evita
No uses fotos de stock.

## Props (React)

```ts
{ name: string; src?: string; size?: 'sm'|'md'|'lg'; square?: boolean; online?: boolean }
```
