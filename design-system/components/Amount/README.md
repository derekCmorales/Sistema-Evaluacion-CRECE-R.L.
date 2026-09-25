# Amount

Cifra monetaria con moneda, decimales reducidos, signo y ocultamiento.

## Cuándo usarlo
Todo monto: saldos, movimientos, cuotas. Siempre tabular.

## Variantes y estados
`sign` (+/−), `tone="positive"`, `hidden` (••••), `decimals`, `size`.

## Móvil y otras plataformas
iOS `.monospacedDigit()`, Android `fontFeatureSettings="tnum"`, Flutter `FontFeature.tabularFigures()`.

## Accesibilidad
Lectores leen el número completo; con `hidden`, anuncia «saldo oculto».

## Evita
No colorees en rojo los egresos normales; el rojo es solo para mora/error.

## Props (React)

```ts
{ value: number; currency?: string; size?: number|string; sign?: boolean; hidden?: boolean; tone?: 'positive'; decimals?: number }
```
