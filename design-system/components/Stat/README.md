# Stat

Indicador con etiqueta, cifra, variación y ayuda.

## Cuándo usarlo
KPIs de dashboards (web y móvil).

## Variantes y estados
`delta` positiva/negativa, `icon`, `help`.

## Móvil y otras plataformas
En móvil, 2 por fila o carrusel horizontal.

## Accesibilidad
La variación incluye ícono y signo, no solo color.

## Evita
No abras una pantalla con stats si no son el punto de la pantalla.

## Props (React)

```ts
{ label: ReactNode; value: ReactNode; icon?: Icon; delta?: number; deltaLabel?: string; help?: string }
```
