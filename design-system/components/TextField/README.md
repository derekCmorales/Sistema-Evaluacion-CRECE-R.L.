# TextField

Campo de texto con etiqueta arriba, ayuda, error, ícono, prefijo/sufijo, contador, contraseña y multilínea.

## Cuándo usarlo
Toda captura de texto libre. La etiqueta siempre visible arriba (nunca solo placeholder).

## Variantes y estados
`multiline` (textarea), `type="password"` con mostrar/ocultar, `icon`, `prefix`/`suffix`, `maxLength` con contador, `optional`, `error`, `disabled`.

## Móvil y otras plataformas
Texto de input 16pt/sp (evita zoom iOS). Teclado según `type`/`inputMode` (numeric, email, tel). Android: OutlinedTextField con label fijo arriba. Flutter: TextField + InputDecoration(labelText arriba).

## Accesibilidad
Label enlazado por `htmlFor`; ayuda/error con `aria-describedby`; `aria-invalid` en error.

## Evita
No uses labels flotantes ni placeholders como única etiqueta. Errores específicos: di cómo corregir.

## Props (React)

```ts
{ label?: string; help?: string; error?: string; optional?: boolean; icon?: Icon; prefix?: string; suffix?: string; multiline?: boolean; rows?: number; maxLength?: number; type?: string; value?; defaultValue?; onChange?; disabled?: boolean }
```
