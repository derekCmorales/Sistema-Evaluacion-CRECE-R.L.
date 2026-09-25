# StatusTracker

Seguimiento de una solicitud por etapas (sobre Timeline).

## Cuándo usarlo
Pantalla «Estado de mi solicitud».

## Variantes y estados
`current`, `meta` por paso, `error` para devolución/rechazo.

## Móvil y otras plataformas
Ancho completo.

## Accesibilidad
Estado en texto.

## Evita
—

## Props (React)

```ts
{ steps?: string[]; current: number; meta?: Record<number, string>; error?: string }
```
