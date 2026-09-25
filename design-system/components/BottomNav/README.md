# BottomNav

Barra de navegación inferior móvil con 3–5 destinos.

## Cuándo usarlo
Navegación principal de la app móvil.

## Variantes y estados
Ícono relleno + píldora en activo; `count`.

## Móvil y otras plataformas
iOS TabView, Android NavigationBar. Alto 64 + safe area.

## Accesibilidad
`aria-current="page"`.

## Evita
Máx. 5 destinos; etiquetas de 1 palabra.

## Props (React)

```ts
{ items: { id, label, icon, count? }[]; active: string; onChange: (id) => void }
```
