# CurrencyField

Campo de monto en quetzales con cifra grande y separadores de miles.

## Cuándo usarlo
Captura de montos: préstamo, transferencia, meta de ahorro, pago.

## Variantes y estados
`currency` (Q por defecto).

## Móvil y otras plataformas
Teclado decimal (`inputMode="decimal"`). En pantallas de monto, centra la cifra y usa `amount-xl`.

## Accesibilidad
La etiqueta dice la moneda si el símbolo no basta («Monto en quetzales»).

## Evita
No aceptes letras; no muestres decimales si el producto no los usa.

## Props (React)

```ts
{ label?: string; value: number | ""; onChange: (n) => void; currency?: string; help?; error?; min?; max? }
```
