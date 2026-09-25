# FileDrop

Zona para arrastrar o seleccionar archivos.

## Cuándo usarlo
Subir documentos del expediente, comprobantes, fotos.

## Variantes y estados
Estado `drag` resaltado.

## Móvil y otras plataformas
En móvil muestra dos acciones: «Tomar foto» y «Elegir archivo» (cámara/galería/documentos).

## Accesibilidad
Input nativo accesible por teclado.

## Evita
Indica siempre formatos y tamaño máximo.

## Props (React)

```ts
{ title?: string; hint?: string; accept?: string; onFiles?: (files: File[]) => void }
```
