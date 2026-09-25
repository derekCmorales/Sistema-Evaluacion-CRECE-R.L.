# Badge

Etiqueta de estado; el tono se deduce de estados conocidos.

## Cuándo usarlo
Estado de solicitudes, pagos y documentos; etiquetas «Nuevo».

## Variantes y estados
Tonos `info` `success` `warning` `danger` `neutral`; `variant` `solid`/`accent`; `pill`; `dot`. Estados mapeados: Prospecto, Expediente, Evaluación, En revisión, En corrección, Aprobada, Rechazada, Pagado, Pendiente, Vencido, Activo.

## Móvil y otras plataformas
Alto 22, texto `label-sm`.

## Accesibilidad
Siempre con texto; el color nunca va solo.

## Evita
No uses badges como botones.

## Props (React)

```ts
{ children: string; tone?: 'info'|'success'|'warning'|'danger'|'neutral'; variant?: 'solid'|'accent'; pill?: boolean; dot?: boolean }
```
