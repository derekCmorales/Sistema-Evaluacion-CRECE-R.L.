# Logo

El logotipo oficial como imagen, con versión blanca automática en tema oscuro.

## Cuándo usarlo
Encabezados de app y web, splash, pie, documentos. Usa los PNG del grupo Logos; nunca recompongas el símbolo ni el texto con tipografía.

## Variantes y estados
Horizontal (defecto) y vertical (espacios cuadrados, splash, avatar de app). Full color, blanco (sobre `bg-brand-strong` o foto), negro (una tinta).

## Móvil y otras plataformas
iOS/Android: asset vectorizado o PNG @2x/@3x; splash con vertical blanco sobre `crece-blue`. Ícono de app: símbolo sobre `crece-blue` con área de reserva.

## Accesibilidad
`alt="CRECE Guatemala R.L."`. Decorativo junto a texto con el nombre: `alt=""`.

## Evita
No rotar, distorsionar, cambiar proporción símbolo/texto, recolorear ni reordenar. Mínimo 10% de área de reserva por lado. Ancho mínimo 96px horizontal / 48px vertical.

## Props (React)

```ts
{ src: string; darkSrc?: string; alt?: string; width?: number }
```
