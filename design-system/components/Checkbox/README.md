# Checkbox

Casilla de verificación con descripción opcional; animación de marca al marcar.

## Cuándo usarlo
Consentimientos, selección múltiple, confirmaciones.

## Variantes y estados
Con `description` (título + detalle).

## Móvil y otras plataformas
iOS no tiene checkbox nativo: usa este estilo o Toggle. Android: Checkbox. Objetivo 44/48.

## Accesibilidad
Todo el renglón es clicable (label).

## Evita
No uses checkbox para acciones inmediatas (usa Switch).

## Props (React)

```ts
{ label: ReactNode; description?: ReactNode; checked?; defaultChecked?; onChange?; disabled? }
```
