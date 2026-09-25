# Toast

Confirmación breve y temporal (snackbar) con acción opcional.

## Cuándo usarlo
Resultado de una acción: guardado, copiado, enviado. Se cierra sola en 4–6 s.

## Variantes y estados
`tone="success"`, `action` (Deshacer), `onClose`.

## Móvil y otras plataformas
Android: Snackbar. iOS: banner propio sobre la tab bar.

## Accesibilidad
`role="status"`; no roba foco.

## Evita
No para errores que requieren acción (usa Alert o Dialog).

## Props (React)

```ts
{ children; tone?: 'success'; action?: string; onAction?: () => void; onClose?: () => void }
```
