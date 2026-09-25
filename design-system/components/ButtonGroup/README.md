# ButtonGroup

Agrupa botones relacionados, separados o unidos.

## Cuándo usarlo
Pie de diálogos, barras de herramientas, alternativas de igual peso.

## Variantes y estados
`attached` une los bordes (acciones de un mismo control).

## Móvil y otras plataformas
En móvil apila verticalmente en diálogos: primario arriba (iOS) o a la derecha (Android).

## Accesibilidad
`role="group"`.

## Evita
Máx. 3 botones.

## Props (React)

```ts
{ children: ReactNode; attached?: boolean }
```
