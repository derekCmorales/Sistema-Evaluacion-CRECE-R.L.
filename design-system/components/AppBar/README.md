# AppBar

Barra superior móvil con regresar, título y acciones.

## Cuándo usarlo
Encabezado de cada pantalla móvil.

## Variantes y estados
`variant="brand"` (azul de marca), `center`, `onBack`, `actions`.

## Móvil y otras plataformas
iOS NavigationBar (título grande opcional con headline-lg); Android TopAppBar. Alto 56 + safe area.

## Accesibilidad
Botón regresar con label «Regresar».

## Evita
Máx. 2 acciones; el resto en Menu.

## Props (React)

```ts
{ title: ReactNode; onBack?: () => void; actions?: ReactNode; variant?: 'brand'; center?: boolean }
```
