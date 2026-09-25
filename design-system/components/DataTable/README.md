# DataTable

Tabla de datos con columnas configurables, numéricas alineadas y fila clicable.

## Cuándo usarlo
Listados en web: solicitudes, pagos, asociados.

## Variantes y estados
`render` por columna, `numeric`, `onRowClick`, `caption`, `empty` (estado vacío).

## Móvil y otras plataformas
En móvil no uses tabla: convierte cada fila en ListItem o tarjeta.

## Accesibilidad
Cabeceras `<th>`, caption descriptivo, scroll horizontal contenido.

## Evita
No más de 6–7 columnas; no trunques montos.

## Props (React)

```ts
{ columns: { key, label, numeric?, width?, render?: (row) => ReactNode }[]; rows: object[]; caption?: string; onRowClick?: (row) => void; empty?: ReactNode }
```
