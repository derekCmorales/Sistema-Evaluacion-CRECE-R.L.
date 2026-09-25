# Tabs

Pestañas subrayadas con contador opcional; el indicador crece al activar.

## Cuándo usarlo
Secciones hermanas de un mismo objeto (Resumen/Documentos/Bitácora).

## Variantes y estados
`fill` (ancho completo, típico en móvil), contador.

## Móvil y otras plataformas
iOS: segmented o tabs superiores; Android: TabRow.

## Accesibilidad
`role="tablist"/"tab"`, `aria-selected`.

## Evita
No para navegación principal (usa BottomNav/Sidebar).

## Props (React)

```ts
{ tabs: (string | [value, label, count?])[]; value; onChange: (v) => void; fill?: boolean }
```
