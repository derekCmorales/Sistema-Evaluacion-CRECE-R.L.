# AccountCard

Tarjeta de cuenta con saldo, número enmascarado y botón para ocultar.

## Cuándo usarlo
Encabezado de inicio móvil y web de banca.

## Variantes y estados
Azul de marca (defecto) o `light`. Esquina firma y anillos decorativos de marca.

## Móvil y otras plataformas
Ancho completo con margen 20; saldo `amount-xl`. Guarda preferencia de ocultar saldo.

## Accesibilidad
Botón ojo con label claro.

## Evita
No muestres el número de cuenta completo.

## Props (React)

```ts
{ label?: string; number?: string; balance: number; available?: number; light?: boolean; hidden?: boolean; onToggle?: (hidden) => void }
```
