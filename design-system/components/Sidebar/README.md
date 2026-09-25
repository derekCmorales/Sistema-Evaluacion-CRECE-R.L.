# Sidebar

Navegación lateral de la web app con secciones, contadores y pie.

## Cuándo usarlo
Apps web de escritorio (sistema interno, banca en línea).

## Variantes y estados
Secciones (`{ section }`), `count`, `footer`, `brand`.

## Móvil y otras plataformas
En <1024px se vuelve drawer; en app nativa usa BottomNav.

## Accesibilidad
`nav` con label; `aria-current`.

## Evita
Máx. ~8 destinos principales.

## Props (React)

```ts
{ brand?: ReactNode; items: ({ id, label, icon, count? } | { section })[]; active; onNavigate?; footer?: ReactNode }
```
