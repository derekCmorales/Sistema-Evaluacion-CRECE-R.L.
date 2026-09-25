# ListItem

Fila con elemento inicial, título, descripción, contenido final y chevron.

## Cuándo usarlo
Dentro de List. Con `onClick`/`href` se vuelve tocable.

## Variantes y estados
`icon` (cuadro tinte), `leading` libre (Avatar), `trailing` (monto, badge, switch), `chevron`.

## Móvil y otras plataformas
Alto mínimo 56. Chevron solo si navega.

## Accesibilidad
Una sola acción por fila.

## Evita
No más de 2 líneas de texto.

## Props (React)

```ts
{ title: ReactNode; description?: ReactNode; icon?: Icon; leading?: ReactNode; trailing?: ReactNode; chevron?: boolean; onClick?; href? }
```
