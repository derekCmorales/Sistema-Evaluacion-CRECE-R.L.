# Alert

Mensaje en línea informativo, de éxito, atención o error, con título y acciones.

## Cuándo usarlo
Avisos contextuales dentro de la pantalla.

## Variantes y estados
Tonos `info` `success` `warning` `danger`; `outline`; `banner` (a sangre); `actions`; `onClose`.

## Móvil y otras plataformas
Ancho completo dentro del contenido; banner arriba para avisos globales (sin conexión).

## Accesibilidad
`role="alert"` en error; `status` en el resto.

## Evita
Un alert por bloque. Errores: di qué pasó y cómo resolverlo, sin culpar.

## Props (React)

```ts
{ tone?: 'info'|'success'|'warning'|'danger'; title?: ReactNode; children; actions?: ReactNode; onClose?: () => void; outline?: boolean; banner?: boolean }
```
