# Sparkline

Mini tendencia sin ejes, con área y punto final.

## Cuándo usarlo
Junto a KPIs o saldos para mostrar tendencia.

## Variantes y estados
`tone`, `area`.

## Móvil y otras plataformas
Igual.

## Accesibilidad
`aria-label` con inicio y fin.

## Evita
Sin ejes = no para valores exactos.

## Props (React)

```ts
{ data: number[]; width?; height?; tone?: string; area?: boolean }
```
