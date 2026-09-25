# Tooltip

Burbuja de ayuda breve al pasar el cursor o enfocar.

## Cuándo usarlo
Aclarar íconos o términos en web.

## Variantes y estados
`open` fuerza visible.

## Móvil y otras plataformas
No existe hover: en móvil usa texto de ayuda visible o un ícono Info que abre un sheet.

## Accesibilidad
`role="tooltip"`, también con foco.

## Evita
No pongas información esencial solo en tooltips.

## Props (React)

```ts
{ content: ReactNode; children: ReactNode; open?: boolean }
```
