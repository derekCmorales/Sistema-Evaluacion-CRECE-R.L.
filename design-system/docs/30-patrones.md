# Patrones

Composiciones recurrentes que resuelven problemas completos. Úsalas antes de inventar una nueva.

## Navegación por plataforma

| Contexto | Principal | Secundaria | Regresar |
|---|---|---|---|
| App móvil | `BottomNav` (3–5 destinos) | `Tabs fill`, `SegmentedControl` | `AppBar onBack` |
| Web app | `Sidebar` + `TopBar` | `Tabs`, `Breadcrumbs` | Migas / botón en `PageHeader` |
| Tablet | Rail o `Sidebar` colapsable | `Tabs` | `AppBar` |

## Formularios

- Etiqueta arriba siempre; ayuda debajo; error reemplaza a la ayuda y dice cómo corregir («El DPI debe tener 13 dígitos»).
- Valida al salir del campo y al enviar, nunca al primer carácter.
- Un paso = una pregunta principal en móvil. Flujos largos con `Steps` (máx. 5).
- CTA principal abajo: `Button block size="lg"` anclado sobre la safe area en móvil; alineado a la derecha en web.
- Montos con `CurrencyField` (teclado decimal, separador de miles); opciones visuales con `ChoiceCards`; ≥5 opciones con `Select`.
- Datos sensibles (DPI, contraseña, PIN) con máscaras y `autocomplete` correcto; nunca en logs ni en URLs.

## Carga, vacío y error

| Estado | Patrón |
|---|---|
| Cargando contenido | `Skeleton` con la forma final (listas, saldo, tarjetas) |
| Acción en curso | `Button loading` (bloquea doble envío) |
| Proceso largo | `ProgressBar` (determinado o `indeterminate`) |
| Sin datos | `EmptyState` con título esperanzador y una acción |
| Error recuperable | `Alert tone="danger"` en línea + reintentar |
| Sin conexión | `Alert banner tone="warning"` persistente arriba |
| Confirmación | `Toast` (4–6 s) o pantalla de éxito con `cr-anim-pop` |

## Acciones sensibles

1. **Confirmar** con `Dialog` (o `BottomSheet` en móvil) que resume qué pasará: monto, destino, cuenta.
2. **Verificar** identidad con `PinInput` o biometría para transferencias, cambios de datos y solicitudes.
3. **Informar** el resultado con pantalla de éxito + código de referencia, y dejar rastro en `Timeline`.
Botones destructivos con verbo explícito («Eliminar meta»), nunca «Aceptar».

## Mostrar dinero

- `Amount` siempre: moneda más pequeña, decimales reducidos, cifras tabulares.
- Saldo principal con `amount-xl` y botón para ocultar (preferencia persistente).
- Ingresos con `+` y `success`; egresos con `−` en tinta neutra.
- Tasas y cuotas simuladas siempre con disclaimer («Cálculo ilustrativo…»).
- En tablas, montos alineados a la derecha (`numeric`).

## Dashboards

Resumen antes que detalle: fila de `Stat` (con `Sparkline`) → 1–2 gráficas (`BarChart`, `DonutChart`) → tabla de lo accionable (`DataTable`). Un periodo global (`SegmentedControl`) arriba a la derecha. Máximo 4 KPIs.

## Seguimiento de trámites

`StatusTracker` con la etapa actual pulsando, texto de qué pasa ahora y cuándo se avisará. En la web interna, el mismo trámite muestra `Timeline` completo (bitácora) y un panel de decisión con justificación obligatoria.

## Onboarding y acceso

Splash con logo vertical blanco sobre `bg-brand-strong` → ingreso (DPI/usuario + contraseña, biometría como alternativa) → verificación con `PinInput` → inicio. Primera vez: 2–3 pantallas con `SignatureImage` y `display-sm`, siempre saltables.

## Ayuda

Acceso a ayuda visible en cada flujo (`IconButton Question` en `AppBar`, `Fab` de chat en pantallas de inicio). La ayuda humana («Hablar con mi asesora») siempre disponible en trámites.
