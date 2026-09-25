# IconButton

Botón cuadrado de 44px solo con ícono, en 5 estilos.

## Cuándo usarlo
Cerrar, regresar, menú, notificaciones, más opciones, acciones de fila.

## Variantes y estados
`plain` (defecto), `outline`, `tonal`, `filled`, `danger`; `round`; `size="sm"` 36px; `badge` muestra punto naranja.

## Móvil y otras plataformas
Objetivo táctil ≥44pt/48dp aunque el ícono sea de 24.

## Accesibilidad
`label` obligatorio (aria-label + tooltip nativo).

## Evita
No uses íconos ambiguos sin label visible cerca para acciones críticas.

## Props (React)

```ts
{ icon: Icon; label: string; variant?: 'plain'|'outline'|'tonal'|'filled'|'danger'; size?: 'sm'|'md'; round?: boolean; badge?: boolean }
```
