# Button

Botón de acción con 7 variantes, 3 tamaños, íconos, carga y bloque.

## Cuándo usarlo
`primary` para la acción principal (una por vista); `secondary` para alternativas; `tertiary` (tinte) para acciones de apoyo dentro de tarjetas; `ghost` en barras y filas; `accent` naranja para el CTA de marca más importante (máx. 1 por pantalla); `danger` para destruir; `link` en línea con texto.

## Variantes y estados
Tamaños `sm` 36 (solo web densa), `md` 44 (defecto), `lg` 52 (CTA móvil). `icon` antes del texto, `arrow`/`trailingIcon` después (la flecha avanza 3px en hover). `loading` muestra spinner y bloquea. `block` ocupa el ancho.

## Móvil y otras plataformas
iOS: `Button` con estilo propio, alto 44/52pt. Android/Compose: `Button`/`OutlinedButton`/`TextButton`, alto 48dp mínimo. Flutter: `FilledButton` con `CreceTheme`. En móvil el CTA principal va `block` y `lg`, anclado abajo sobre safe area.

## Accesibilidad
Texto que dice qué pasa («Solicitar préstamo»). Solo-ícono: usa IconButton con `label`. `aria-busy` durante carga.

## Evita
No pongas dos primarios lado a lado. No uses `accent` para acciones rutinarias. No uses blanco sobre naranja.

## Props (React)

```ts
{ variant?: 'primary'|'secondary'|'tertiary'|'ghost'|'accent'|'danger'|'link'; size?: 'sm'|'md'|'lg'; icon?: Icon; trailingIcon?: Icon; arrow?: boolean; loading?: boolean; block?: boolean; as?: 'button'|'a'; disabled?: boolean; onClick?: () => void }
```
