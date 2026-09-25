# SignatureImage

Imagen con la esquina firma de CRECE (radio 100 abajo a la derecha) y marco naranja opcional.

## Cuándo usarlo
La imagen principal de una pantalla de marca: onboarding, portada de campaña, detalle de producto, perfil de meta. Una por pantalla.

## Variantes y estados
`frame` añade el contorno naranja desplazado detrás (60%×45%, opacidad 0.65).

## Móvil y otras plataformas
Clip con RoundedCornerShape(topStart=28, topEnd=28, bottomEnd=100, bottomStart=28) / UnevenRoundedRectangle en SwiftUI.

## Accesibilidad
Pasa `alt` descriptivo; si es decorativa, vacío.

## Evita
No la repitas en listas ni tarjetas pequeñas; pierde su valor de firma.

## Props (React)

```ts
{ src: string; alt?: string; frame?: boolean; height?: number }
```
