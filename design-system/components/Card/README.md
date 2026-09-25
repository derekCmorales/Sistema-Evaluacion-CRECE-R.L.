# Card

Contenedor de contenido con 6 variantes y opción interactiva.

## Cuándo usarlo
Agrupar información relacionada. Usa la variante mínima que separe: `default` (borde), `flat` (fondo suave), `tinted`, `elevated`, `brand` (bloque azul de marca), `signature` (esquina firma).

## Variantes y estados
`interactive` (se eleva al hover, es botón), `media` (imagen superior 16:9), `title` + `action`.

## Móvil y otras plataformas
Radio `radius-lg` 14, padding 16–20. En listas largas prefiere ListItem sobre tarjetas.

## Accesibilidad
Tarjeta interactiva es un solo botón; no anides botones dentro.

## Evita
No anides tarjetas dentro de tarjetas. No sombra + borde a la vez.

## Props (React)

```ts
{ title?: ReactNode; action?: ReactNode; variant?: 'default'|'flat'|'tinted'|'elevated'|'brand'; interactive?: boolean; signature?: boolean; media?: string; children }
```
