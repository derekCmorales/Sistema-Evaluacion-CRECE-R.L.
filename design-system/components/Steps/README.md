# Steps

Indicador de pasos de un flujo en barras.

## Cuándo usarlo
Formularios de varios pasos (solicitud, registro).

## Variantes y estados
—

## Móvil y otras plataformas
Arriba del contenido, bajo la AppBar; en pantallas estrechas muestra solo «Paso 2 de 3».

## Accesibilidad
`aria-current="step"`.

## Evita
Máx. 5 pasos.

## Props (React)

```ts
{ steps: string[]; current: number }
```
