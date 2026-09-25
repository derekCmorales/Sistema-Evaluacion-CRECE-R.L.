# Switch

Interruptor de efecto inmediato con etiqueta y descripción.

## Cuándo usarlo
Ajustes que se aplican al instante: notificaciones, biometría, ocultar saldo.

## Variantes y estados
Con `description`.

## Móvil y otras plataformas
iOS: Toggle/UISwitch. Android: Switch. Mismo alto de fila 44/48.

## Accesibilidad
`role="switch"`.

## Evita
No lo uses dentro de formularios con botón Guardar (usa Checkbox).

## Props (React)

```ts
{ label: ReactNode; description?: ReactNode; checked?; defaultChecked?; onChange?: (checked) => void }
```
