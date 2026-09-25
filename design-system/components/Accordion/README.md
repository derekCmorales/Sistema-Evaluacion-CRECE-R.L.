# Accordion

Secciones plegables (details nativo), exclusivas por defecto.

## Cuándo usarlo
Preguntas frecuentes, requisitos, detalles opcionales.

## Variantes y estados
`exclusive` (una abierta a la vez).

## Móvil y otras plataformas
Filas ≥48, chevron que rota.

## Accesibilidad
`<details>/<summary>` nativo.

## Evita
No escondas información crítica.

## Props (React)

```ts
{ items: { title, content, open? }[]; exclusive?: boolean }
```
