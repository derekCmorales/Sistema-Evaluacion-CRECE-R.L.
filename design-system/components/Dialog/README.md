# Dialog

Diálogo modal con título, ícono, cuerpo con scroll y pie de acciones.

## Cuándo usarlo
Confirmaciones, formularios cortos, detalles que requieren atención. Esc/clic fuera cierran.

## Variantes y estados
`size` sm/md/lg, `icon`, `tone="danger"`, `inline` (documentación).

## Móvil y otras plataformas
En móvil prefiere BottomSheet para formularios; diálogos solo para confirmar (iOS Alert, Android AlertDialog).

## Accesibilidad
`role="dialog"`, `aria-modal`, foco atrapado, Esc cierra.

## Evita
No encadenes diálogos. Botón destructivo con verbo explícito («Eliminar meta»).

## Props (React)

```ts
{ open?: boolean; title: ReactNode; children; footer?: ReactNode; onClose?: () => void; size?: 'sm'|'md'|'lg'; icon?: Icon; tone?: 'danger'; inline?: boolean }
```
