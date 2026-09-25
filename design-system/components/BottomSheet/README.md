# BottomSheet

Hoja inferior móvil con asa, título y contenido.

## Cuándo usarlo
Acciones y formularios breves en móvil: elegir cuenta, confirmar transferencia, filtros.

## Variantes y estados
—

## Móvil y otras plataformas
iOS .sheet(presentationDetents), Android ModalBottomSheet. Respeta safe area inferior.

## Accesibilidad
Foco al abrir; cierre por gesto y botón.

## Evita
No para contenido muy largo (usa pantalla completa).

## Props (React)

```ts
{ title?: ReactNode; children; onClose?: () => void }
```
