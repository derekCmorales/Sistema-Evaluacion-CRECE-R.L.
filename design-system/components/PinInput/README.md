# PinInput

Entrada de código OTP/PIN por dígitos con avance automático.

## Cuándo usarlo
Verificación por SMS, PIN de app, confirmación de operaciones.

## Variantes y estados
`masked` (PIN), `invalid` (sacude y marca en rojo), `length`.

## Móvil y otras plataformas
iOS: `textContentType .oneTimeCode` para autollenado. Android: SMS Retriever / autofill.

## Accesibilidad
Cada casilla etiquetada «Dígito n».

## Evita
No borres todo al primer error; permite corregir.

## Props (React)

```ts
{ length?: number; masked?: boolean; invalid?: boolean; onComplete?: (code) => void; label?: string }
```
