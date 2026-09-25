# Timeline

Secuencia vertical de eventos con estados done/current/pending/error.

## Cuándo usarlo
Historial (bitácora), seguimiento de trámites.

## Variantes y estados
Estado por ítem; ícono propio; `meta` y `description`. El ítem actual pulsa suavemente.

## Móvil y otras plataformas
Igual; ancho completo.

## Accesibilidad
El estado se lee en el texto, no solo en el ícono.

## Evita
No más de ~8 pasos visibles; colapsa el resto.

## Props (React)

```ts
{ items: { title, description?, meta?, state?: 'done'|'current'|'pending'|'error', icon? }[] }
```
