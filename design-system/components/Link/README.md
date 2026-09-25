# Link

Enlace de texto en `brand`, con flecha diagonal para enlaces externos.

## Cuándo usarlo
Navegación dentro de texto o acciones terciarias («Ver todos», «Términos»).

## Variantes y estados
`external` añade ↗ y abre en otra pestaña.

## Móvil y otras plataformas
Texto `brand` 650; objetivo táctil con padding ≥44pt.

## Accesibilidad
El texto debe tener sentido fuera de contexto (no «clic aquí»).

## Evita
No subrayes en reposo salvo dentro de párrafos largos.

## Props (React)

```ts
{ children: ReactNode; href?: string; external?: boolean; onClick?: () => void }
```
