# BarChart

Barras simples, agrupadas o apiladas con tooltip y paleta validada.

## Cuándo usarlo
Comparar magnitudes por categoría o periodo.

## Variantes y estados
`series` (varias claves), `stacked`, `format`.

## Móvil y otras plataformas
Máx. 6 barras visibles; scroll horizontal para más. Tooltips por toque.

## Accesibilidad
Leyenda + etiqueta aria; ofrece tabla para detalle.

## Evita
Un solo eje; sin 3D; más de 6 series → «Otros».

## Props (React)

```ts
{ data: { label, [key]: number }[]; series?: string[]; stacked?: boolean; height?: number; format?: (n) => string; label?: string }
```
