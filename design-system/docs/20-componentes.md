# Componentes

73 componentes en `window.Crece` (React web), cada uno con equivalente nativo documentado. Todos consumen solo tokens semánticos y funcionan en tema claro y oscuro. Guía completa, props y preview en vivo en la tarjeta de cada componente.

| Grupo | Componentes |
|---|---|
| Marca | `Logo`, `Overline`, `SignatureImage` |
| Acciones | `Button`, `IconButton`, `ButtonGroup`, `Fab`, `Link`, `SegmentedControl`, `Chip` |
| Formularios | `TextField`, `Select`, `CurrencyField`, `SearchField`, `Checkbox`, `RadioGroup`, `Radio`, `Switch`, `Slider`, `NumberStepper`, `PinInput`, `ChoiceCards`, `FileDrop` |
| Contenido | `Card`, `List`, `ListItem`, `Avatar`, `AvatarGroup`, `Badge`, `Count`, `Divider`, `Amount`, `Stat`, `DescriptionList`, `DataTable`, `Accordion`, `Tabs`, `Timeline`, `EmptyState`, `Skeleton`, `ProgressBar`, `ProgressRing`, `Tooltip` |
| Feedback | `Alert`, `Toast`, `Spinner`, `Dialog`, `BottomSheet` |
| Navegación | `AppBar`, `BottomNav`, `Sidebar`, `TopBar`, `Breadcrumbs`, `Pagination`, `Steps`, `Menu` |
| Layout | `AppShell`, `PageHeader`, `DeviceFrame`, `DeviceBody` |
| Movimiento | `Stagger`, `AnimatedNumber` |
| Finanzas | `AccountCard`, `QuickActions`, `TransactionItem`, `SavingsGoal`, `LoanCalculator`, `AmortizationTable`, `StatusTracker`, `DocumentChecklist` |
| Gráficas | `BarChart`, `DonutChart`, `Sparkline` |

## Marca

### Logo

El logotipo oficial como imagen, con versión blanca automática en tema oscuro.

- **Cuándo:** Encabezados de app y web, splash, pie, documentos. Usa los PNG del grupo Logos; nunca recompongas el símbolo ni el texto con tipografía.
- **Variantes:** Horizontal (defecto) y vertical (espacios cuadrados, splash, avatar de app). Full color, blanco (sobre `bg-brand-strong` o foto), negro (una tinta).
- **Móvil:** iOS/Android: asset vectorizado o PNG @2x/@3x; splash con vertical blanco sobre `crece-blue`. Ícono de app: símbolo sobre `crece-blue` con área de reserva.
- **Accesibilidad:** `alt="CRECE Guatemala R.L."`. Decorativo junto a texto con el nombre: `alt=""`.
- **Evita:** No rotar, distorsionar, cambiar proporción símbolo/texto, recolorear ni reordenar. Mínimo 10% de área de reserva por lado. Ancho mínimo 96px horizontal / 48px vertical.

```ts
Logo({ src: string; darkSrc?: string; alt?: string; width?: number })
```

### Overline

Antetítulo en mayúsculas espaciadas; con regla naranja opcional.

- **Cuándo:** Encima de títulos de página o sección para dar contexto («COOPERATIVA CRECE GUATEMALA», «PASO 2 DE 3»).
- **Variantes:** `rule` añade la regla naranja de 24×2px (gesto de marca).
- **Móvil:** Mismo estilo `overline` (11pt/sp, 700, tracking 0.14em).
- **Accesibilidad:** Es texto, no encabezado: no uses un h* solo para el overline.
- **Evita:** Una por bloque. Nunca como texto largo.

```ts
Overline({ children: ReactNode; rule?: boolean; as?: string })
```

### SignatureImage

Imagen con la esquina firma de CRECE (radio 100 abajo a la derecha) y marco naranja opcional.

- **Cuándo:** La imagen principal de una pantalla de marca: onboarding, portada de campaña, detalle de producto, perfil de meta. Una por pantalla.
- **Variantes:** `frame` añade el contorno naranja desplazado detrás (60%×45%, opacidad 0.65).
- **Móvil:** Clip con RoundedCornerShape(topStart=28, topEnd=28, bottomEnd=100, bottomStart=28) / UnevenRoundedRectangle en SwiftUI.
- **Accesibilidad:** Pasa `alt` descriptivo; si es decorativa, vacío.
- **Evita:** No la repitas en listas ni tarjetas pequeñas; pierde su valor de firma.

```ts
SignatureImage({ src: string; alt?: string; frame?: boolean; height?: number })
```

## Acciones

### Button

Botón de acción con 7 variantes, 3 tamaños, íconos, carga y bloque.

- **Cuándo:** `primary` para la acción principal (una por vista); `secondary` para alternativas; `tertiary` (tinte) para acciones de apoyo dentro de tarjetas; `ghost` en barras y filas; `accent` naranja para el CTA de marca más importante (máx. 1 por pantalla); `danger` para destruir; `link` en línea con texto.
- **Variantes:** Tamaños `sm` 36 (solo web densa), `md` 44 (defecto), `lg` 52 (CTA móvil). `icon` antes del texto, `arrow`/`trailingIcon` después (la flecha avanza 3px en hover). `loading` muestra spinner y bloquea. `block` ocupa el ancho.
- **Móvil:** iOS: `Button` con estilo propio, alto 44/52pt. Android/Compose: `Button`/`OutlinedButton`/`TextButton`, alto 48dp mínimo. Flutter: `FilledButton` con `CreceTheme`. En móvil el CTA principal va `block` y `lg`, anclado abajo sobre safe area.
- **Accesibilidad:** Texto que dice qué pasa («Solicitar préstamo»). Solo-ícono: usa IconButton con `label`. `aria-busy` durante carga.
- **Evita:** No pongas dos primarios lado a lado. No uses `accent` para acciones rutinarias. No uses blanco sobre naranja.

```ts
Button({ variant?: 'primary'|'secondary'|'tertiary'|'ghost'|'accent'|'danger'|'link'; size?: 'sm'|'md'|'lg'; icon?: Icon; trailingIcon?: Icon; arrow?: boolean; loading?: boolean; block?: boolean; as?: 'button'|'a'; disabled?: boolean; onClick?: () => void })
```

### IconButton

Botón cuadrado de 44px solo con ícono, en 5 estilos.

- **Cuándo:** Cerrar, regresar, menú, notificaciones, más opciones, acciones de fila.
- **Variantes:** `plain` (defecto), `outline`, `tonal`, `filled`, `danger`; `round`; `size="sm"` 36px; `badge` muestra punto naranja.
- **Móvil:** Objetivo táctil ≥44pt/48dp aunque el ícono sea de 24.
- **Accesibilidad:** `label` obligatorio (aria-label + tooltip nativo).
- **Evita:** No uses íconos ambiguos sin label visible cerca para acciones críticas.

```ts
IconButton({ icon: Icon; label: string; variant?: 'plain'|'outline'|'tonal'|'filled'|'danger'; size?: 'sm'|'md'; round?: boolean; badge?: boolean })
```

### ButtonGroup

Agrupa botones relacionados, separados o unidos.

- **Cuándo:** Pie de diálogos, barras de herramientas, alternativas de igual peso.
- **Variantes:** `attached` une los bordes (acciones de un mismo control).
- **Móvil:** En móvil apila verticalmente en diálogos: primario arriba (iOS) o a la derecha (Android).
- **Accesibilidad:** `role="group"`.
- **Evita:** Máx. 3 botones.

```ts
ButtonGroup({ children: ReactNode; attached?: boolean })
```

### Fab

Botón flotante para la acción principal de una pantalla móvil.

- **Cuándo:** Crear/añadir en listas móviles (nueva meta, nueva solicitud) o «Ayuda».
- **Variantes:** Solo ícono (56px) o `extended` con texto; `accent` (defecto) o `brand`.
- **Móvil:** Android: FloatingActionButton/ExtendedFAB. iOS: botón flotante propio, 16pt sobre la tab bar.
- **Accesibilidad:** Con solo ícono, `label` obligatorio.
- **Evita:** Uno por pantalla. No en web de escritorio.

```ts
Fab({ icon?: Icon; label: string; extended?: boolean; variant?: 'accent'|'brand' })
```

### Link

Enlace de texto en `brand`, con flecha diagonal para enlaces externos.

- **Cuándo:** Navegación dentro de texto o acciones terciarias («Ver todos», «Términos»).
- **Variantes:** `external` añade ↗ y abre en otra pestaña.
- **Móvil:** Texto `brand` 650; objetivo táctil con padding ≥44pt.
- **Accesibilidad:** El texto debe tener sentido fuera de contexto (no «clic aquí»).
- **Evita:** No subrayes en reposo salvo dentro de párrafos largos.

```ts
Link({ children: ReactNode; href?: string; external?: boolean; onClick?: () => void })
```

### SegmentedControl

Selector de 2–4 opciones excluyentes en una píldora.

- **Cuándo:** Cambiar vista o filtro inmediato: periodo (Semana/Mes/Año), tipo (Préstamo/Ahorro/Inversión).
- **Variantes:** Relleno `brand` (defecto) o `soft` (superficie blanca). `block` ocupa el ancho. Íconos opcionales.
- **Móvil:** iOS: UISegmentedControl/Picker(.segmented). Android: SegmentedButton.
- **Accesibilidad:** `role="radiogroup"`; cada opción `role="radio"`.
- **Evita:** Más de 4 opciones → Tabs o Select.

```ts
SegmentedControl({ options: (string | [value, label, Icon?])[]; value: string; onChange: (v) => void; block?: boolean; soft?: boolean })
```

### Chip

Píldora compacta para filtros, selección múltiple o entradas removibles.

- **Cuándo:** Filtros de listas (Todos/Pagos/Depósitos), etiquetas elegidas, sugerencias.
- **Variantes:** Seleccionado (`selected`), con ícono, removible (`onRemove`).
- **Móvil:** Android: FilterChip/InputChip. iOS: botón cápsula. Alto 32 con objetivo táctil ampliado a 44.
- **Accesibilidad:** `aria-pressed` refleja selección.
- **Evita:** No uses chips como botones de acción principal.

```ts
Chip({ children: ReactNode; selected?: boolean; onClick?: () => void; onRemove?: () => void; icon?: Icon })
```

## Formularios

### TextField

Campo de texto con etiqueta arriba, ayuda, error, ícono, prefijo/sufijo, contador, contraseña y multilínea.

- **Cuándo:** Toda captura de texto libre. La etiqueta siempre visible arriba (nunca solo placeholder).
- **Variantes:** `multiline` (textarea), `type="password"` con mostrar/ocultar, `icon`, `prefix`/`suffix`, `maxLength` con contador, `optional`, `error`, `disabled`.
- **Móvil:** Texto de input 16pt/sp (evita zoom iOS). Teclado según `type`/`inputMode` (numeric, email, tel). Android: OutlinedTextField con label fijo arriba. Flutter: TextField + InputDecoration(labelText arriba).
- **Accesibilidad:** Label enlazado por `htmlFor`; ayuda/error con `aria-describedby`; `aria-invalid` en error.
- **Evita:** No uses labels flotantes ni placeholders como única etiqueta. Errores específicos: di cómo corregir.

```ts
TextField({ label?: string; help?: string; error?: string; optional?: boolean; icon?: Icon; prefix?: string; suffix?: string; multiline?: boolean; rows?: number; maxLength?: number; type?: string; value?; defaultValue?; onChange?; disabled?: boolean })
```

### Select

Lista desplegable nativa con el estilo de campo.

- **Cuándo:** Elegir 1 opción entre 5 o más (departamento, garantía, rol). Menos de 5 → RadioGroup o ChoiceCards.
- **Variantes:** Con `placeholder`, `error`, `disabled`, `optional`.
- **Móvil:** Usa el picker nativo (iOS wheel/menu, Android dropdown/bottom sheet).
- **Accesibilidad:** Select nativo: teclado y lector de pantalla gratis.
- **Evita:** No reemplaces por menús custom sin necesidad.

```ts
Select({ label?: string; options: (string | [value, label])[]; value?; defaultValue?; onChange?: (v) => void; placeholder?: string; help?; error?; disabled? })
```

### CurrencyField

Campo de monto en quetzales con cifra grande y separadores de miles.

- **Cuándo:** Captura de montos: préstamo, transferencia, meta de ahorro, pago.
- **Variantes:** `currency` (Q por defecto).
- **Móvil:** Teclado decimal (`inputMode="decimal"`). En pantallas de monto, centra la cifra y usa `amount-xl`.
- **Accesibilidad:** La etiqueta dice la moneda si el símbolo no basta («Monto en quetzales»).
- **Evita:** No aceptes letras; no muestres decimales si el producto no los usa.

```ts
CurrencyField({ label?: string; value: number | ""; onChange: (n) => void; currency?: string; help?; error?; min?; max? })
```

### SearchField

Buscador en píldora con lupa.

- **Cuándo:** Filtrar listas y tablas en vivo.
- **Variantes:** —
- **Móvil:** iOS: UISearchBar / .searchable. Android: SearchBar.
- **Accesibilidad:** `type="search"`, `aria-label`.
- **Evita:** No pidas «Enter» si el filtro puede ser inmediato.

```ts
SearchField({ placeholder?: string; value?: string; onChange?: (v) => void; label?: string })
```

### Checkbox

Casilla de verificación con descripción opcional; animación de marca al marcar.

- **Cuándo:** Consentimientos, selección múltiple, confirmaciones.
- **Variantes:** Con `description` (título + detalle).
- **Móvil:** iOS no tiene checkbox nativo: usa este estilo o Toggle. Android: Checkbox. Objetivo 44/48.
- **Accesibilidad:** Todo el renglón es clicable (label).
- **Evita:** No uses checkbox para acciones inmediatas (usa Switch).

```ts
Checkbox({ label: ReactNode; description?: ReactNode; checked?; defaultChecked?; onChange?; disabled? })
```

### RadioGroup

Grupo de opciones excluyentes con descripción opcional.

- **Cuándo:** 2–5 opciones que conviene ver todas a la vez.
- **Variantes:** Vertical (defecto) o `row`. Cada opción admite descripción.
- **Móvil:** Android: RadioButton. iOS: lista con checkmark o ChoiceCards.
- **Accesibilidad:** `role="radiogroup"` con `label`.
- **Evita:** Más de 5 → Select.

```ts
RadioGroup({ options: (string | [value, label, description?])[]; value; onChange: (v) => void; row?: boolean; name?: string; label?: string })
```

### Radio

Botón de radio individual (usa RadioGroup en la mayoría de casos).

- **Cuándo:** Composiciones propias de radios.
- **Variantes:** —
- **Móvil:** Ver RadioGroup.
- **Accesibilidad:** Comparte `name` con su grupo.
- **Evita:** —

```ts
Radio({ label: ReactNode; description?: ReactNode; name?; checked?; onChange? })
```

### Switch

Interruptor de efecto inmediato con etiqueta y descripción.

- **Cuándo:** Ajustes que se aplican al instante: notificaciones, biometría, ocultar saldo.
- **Variantes:** Con `description`.
- **Móvil:** iOS: Toggle/UISwitch. Android: Switch. Mismo alto de fila 44/48.
- **Accesibilidad:** `role="switch"`.
- **Evita:** No lo uses dentro de formularios con botón Guardar (usa Checkbox).

```ts
Switch({ label: ReactNode; description?: ReactNode; checked?; defaultChecked?; onChange?: (checked) => void })
```

### Slider

Control deslizante con valor vivo y límites.

- **Cuándo:** Explorar un valor dentro de un rango: monto a simular, aporte mensual.
- **Variantes:** `format` para moneda o unidades; `showLimits`.
- **Móvil:** Pulgar de 26px (objetivo ampliado). Acompaña con un campo editable para precisión.
- **Accesibilidad:** Input range nativo con `output` asociado.
- **Evita:** No para valores exactos obligatorios.

```ts
Slider({ label: ReactNode; min; max; step?; value: number; onChange: (n) => void; format?: (n) => string; showLimits?: boolean })
```

### NumberStepper

Contador con botones − / + para valores enteros pequeños.

- **Cuándo:** Cantidades, número de cuotas, integrantes.
- **Variantes:** `format` para unidades.
- **Móvil:** iOS: Stepper. Android: botones tonales. Objetivos 44/48.
- **Accesibilidad:** Valor con `aria-live`.
- **Evita:** Rangos grandes → Slider o campo.

```ts
NumberStepper({ value: number; onChange: (n) => void; min?; max?; step?; format?; label? })
```

### PinInput

Entrada de código OTP/PIN por dígitos con avance automático.

- **Cuándo:** Verificación por SMS, PIN de app, confirmación de operaciones.
- **Variantes:** `masked` (PIN), `invalid` (sacude y marca en rojo), `length`.
- **Móvil:** iOS: `textContentType .oneTimeCode` para autollenado. Android: SMS Retriever / autofill.
- **Accesibilidad:** Cada casilla etiquetada «Dígito n».
- **Evita:** No borres todo al primer error; permite corregir.

```ts
PinInput({ length?: number; masked?: boolean; invalid?: boolean; onComplete?: (code) => void; label?: string })
```

### ChoiceCards

Opciones excluyentes como tarjetas tocables, con ícono y descripción.

- **Cuándo:** Elecciones visuales importantes: plazo, tipo de producto, propósito del préstamo.
- **Variantes:** `columns`; con o sin `icon`/`description`.
- **Móvil:** Grilla 2–3 columnas en móvil; tarjeta ≥48 de alto.
- **Accesibilidad:** `role="radiogroup"` / `role="radio"`.
- **Evita:** Máx. 6 opciones.

```ts
ChoiceCards({ options: { value, title, description?, icon? }[]; value; onChange: (v) => void; columns?: number; label?: string })
```

### FileDrop

Zona para arrastrar o seleccionar archivos.

- **Cuándo:** Subir documentos del expediente, comprobantes, fotos.
- **Variantes:** Estado `drag` resaltado.
- **Móvil:** En móvil muestra dos acciones: «Tomar foto» y «Elegir archivo» (cámara/galería/documentos).
- **Accesibilidad:** Input nativo accesible por teclado.
- **Evita:** Indica siempre formatos y tamaño máximo.

```ts
FileDrop({ title?: string; hint?: string; accept?: string; onFiles?: (files: File[]) => void })
```

## Contenido

### Card

Contenedor de contenido con 6 variantes y opción interactiva.

- **Cuándo:** Agrupar información relacionada. Usa la variante mínima que separe: `default` (borde), `flat` (fondo suave), `tinted`, `elevated`, `brand` (bloque azul de marca), `signature` (esquina firma).
- **Variantes:** `interactive` (se eleva al hover, es botón), `media` (imagen superior 16:9), `title` + `action`.
- **Móvil:** Radio `radius-lg` 14, padding 16–20. En listas largas prefiere ListItem sobre tarjetas.
- **Accesibilidad:** Tarjeta interactiva es un solo botón; no anides botones dentro.
- **Evita:** No anides tarjetas dentro de tarjetas. No sombra + borde a la vez.

```ts
Card({ title?: ReactNode; action?: ReactNode; variant?: 'default'|'flat'|'tinted'|'elevated'|'brand'; interactive?: boolean; signature?: boolean; media?: string; children })
```

### List

Lista de ítems con divisores, normal o en tarjeta (`inset`).

- **Cuándo:** Menús de ajustes, opciones, resultados, cualquier colección vertical.
- **Variantes:** `inset` la envuelve en tarjeta.
- **Móvil:** iOS: List(.insetGrouped). Android: LazyColumn con ListItem.
- **Accesibilidad:** `role="list"`.
- **Evita:** No mezcles alturas de ítem muy distintas.

```ts
List({ children: ListItem[]; inset?: boolean })
```

### ListItem

Fila con elemento inicial, título, descripción, contenido final y chevron.

- **Cuándo:** Dentro de List. Con `onClick`/`href` se vuelve tocable.
- **Variantes:** `icon` (cuadro tinte), `leading` libre (Avatar), `trailing` (monto, badge, switch), `chevron`.
- **Móvil:** Alto mínimo 56. Chevron solo si navega.
- **Accesibilidad:** Una sola acción por fila.
- **Evita:** No más de 2 líneas de texto.

```ts
ListItem({ title: ReactNode; description?: ReactNode; icon?: Icon; leading?: ReactNode; trailing?: ReactNode; chevron?: boolean; onClick?; href? })
```

### Avatar

Iniciales o foto en círculo (o cuadrado), con estado y grupos.

- **Cuándo:** Personas: asociados, asesores, usuarios del sistema.
- **Variantes:** Tamaños `sm` 32, `md` 40, `lg` 56; `square`; `online`; `AvatarGroup` para varias personas.
- **Móvil:** Mismos tamaños en pt/dp.
- **Accesibilidad:** `aria-label` con el nombre.
- **Evita:** No uses fotos de stock.

```ts
Avatar({ name: string; src?: string; size?: 'sm'|'md'|'lg'; square?: boolean; online?: boolean })
```

### AvatarGroup

Avatares superpuestos con contador de excedentes.

- **Cuándo:** Participantes (Consejo, equipo de agencia).
- **Variantes:** `max`, `size`.
- **Móvil:** Igual.
- **Accesibilidad:** Cada avatar con su nombre.
- **Evita:** —

```ts
AvatarGroup({ names: string[]; max?: number; size?: 'sm'|'md'|'lg' })
```

### Badge

Etiqueta de estado; el tono se deduce de estados conocidos.

- **Cuándo:** Estado de solicitudes, pagos y documentos; etiquetas «Nuevo».
- **Variantes:** Tonos `info` `success` `warning` `danger` `neutral`; `variant` `solid`/`accent`; `pill`; `dot`. Estados mapeados: Prospecto, Expediente, Evaluación, En revisión, En corrección, Aprobada, Rechazada, Pagado, Pendiente, Vencido, Activo.
- **Móvil:** Alto 22, texto `label-sm`.
- **Accesibilidad:** Siempre con texto; el color nunca va solo.
- **Evita:** No uses badges como botones.

```ts
Badge({ children: string; tone?: 'info'|'success'|'warning'|'danger'|'neutral'; variant?: 'solid'|'accent'; pill?: boolean; dot?: boolean })
```

### Count

Contador numérico naranja para pendientes.

- **Cuándo:** Notificaciones, ítems de navegación.
- **Variantes:** —
- **Móvil:** Badge de tab bar / NavigationBarItem badge.
- **Accesibilidad:** Acompaña con texto accesible («3 sin leer»).
- **Evita:** Más de 99 → «99+».

```ts
Count({ children: ReactNode })
```

### Divider

Separador horizontal, opcionalmente con texto.

- **Cuándo:** Separar grupos; «o continúa con».
- **Variantes:** `label`.
- **Móvil:** Hairline 1px.
- **Accesibilidad:** `role="separator"`.
- **Evita:** Prefiere espacio antes que líneas.

```ts
Divider({ label?: string })
```

### Amount

Cifra monetaria con moneda, decimales reducidos, signo y ocultamiento.

- **Cuándo:** Todo monto: saldos, movimientos, cuotas. Siempre tabular.
- **Variantes:** `sign` (+/−), `tone="positive"`, `hidden` (••••), `decimals`, `size`.
- **Móvil:** iOS `.monospacedDigit()`, Android `fontFeatureSettings="tnum"`, Flutter `FontFeature.tabularFigures()`.
- **Accesibilidad:** Lectores leen el número completo; con `hidden`, anuncia «saldo oculto».
- **Evita:** No colorees en rojo los egresos normales; el rojo es solo para mora/error.

```ts
Amount({ value: number; currency?: string; size?: number|string; sign?: boolean; hidden?: boolean; tone?: 'positive'; decimals?: number })
```

### Stat

Indicador con etiqueta, cifra, variación y ayuda.

- **Cuándo:** KPIs de dashboards (web y móvil).
- **Variantes:** `delta` positiva/negativa, `icon`, `help`.
- **Móvil:** En móvil, 2 por fila o carrusel horizontal.
- **Accesibilidad:** La variación incluye ícono y signo, no solo color.
- **Evita:** No abras una pantalla con stats si no son el punto de la pantalla.

```ts
Stat({ label: ReactNode; value: ReactNode; icon?: Icon; delta?: number; deltaLabel?: string; help?: string })
```

### DescriptionList

Pares clave/valor con divisores.

- **Cuándo:** Resúmenes: detalle de préstamo, confirmación, perfil.
- **Variantes:** —
- **Móvil:** Igual; valor alineado a la derecha.
- **Accesibilidad:** `<dl>` semántico.
- **Evita:** Máx. ~8 filas; más → secciones.

```ts
DescriptionList({ items: [ReactNode, ReactNode][] })
```

### DataTable

Tabla de datos con columnas configurables, numéricas alineadas y fila clicable.

- **Cuándo:** Listados en web: solicitudes, pagos, asociados.
- **Variantes:** `render` por columna, `numeric`, `onRowClick`, `caption`, `empty` (estado vacío).
- **Móvil:** En móvil no uses tabla: convierte cada fila en ListItem o tarjeta.
- **Accesibilidad:** Cabeceras `<th>`, caption descriptivo, scroll horizontal contenido.
- **Evita:** No más de 6–7 columnas; no trunques montos.

```ts
DataTable({ columns: { key, label, numeric?, width?, render?: (row) => ReactNode }[]; rows: object[]; caption?: string; onRowClick?: (row) => void; empty?: ReactNode })
```

### Accordion

Secciones plegables (details nativo), exclusivas por defecto.

- **Cuándo:** Preguntas frecuentes, requisitos, detalles opcionales.
- **Variantes:** `exclusive` (una abierta a la vez).
- **Móvil:** Filas ≥48, chevron que rota.
- **Accesibilidad:** `<details>/<summary>` nativo.
- **Evita:** No escondas información crítica.

```ts
Accordion({ items: { title, content, open? }[]; exclusive?: boolean })
```

### Tabs

Pestañas subrayadas con contador opcional; el indicador crece al activar.

- **Cuándo:** Secciones hermanas de un mismo objeto (Resumen/Documentos/Bitácora).
- **Variantes:** `fill` (ancho completo, típico en móvil), contador.
- **Móvil:** iOS: segmented o tabs superiores; Android: TabRow.
- **Accesibilidad:** `role="tablist"/"tab"`, `aria-selected`.
- **Evita:** No para navegación principal (usa BottomNav/Sidebar).

```ts
Tabs({ tabs: (string | [value, label, count?])[]; value; onChange: (v) => void; fill?: boolean })
```

### Timeline

Secuencia vertical de eventos con estados done/current/pending/error.

- **Cuándo:** Historial (bitácora), seguimiento de trámites.
- **Variantes:** Estado por ítem; ícono propio; `meta` y `description`. El ítem actual pulsa suavemente.
- **Móvil:** Igual; ancho completo.
- **Accesibilidad:** El estado se lee en el texto, no solo en el ícono.
- **Evita:** No más de ~8 pasos visibles; colapsa el resto.

```ts
Timeline({ items: { title, description?, meta?, state?: 'done'|'current'|'pending'|'error', icon? }[] })
```

### EmptyState

Estado vacío con ilustración de marca (esquina firma), título esperanzador y acción.

- **Cuándo:** Listas sin datos, búsquedas sin resultados, primera vez.
- **Variantes:** `icon`, `action`.
- **Móvil:** Centrado verticalmente en el área de contenido.
- **Accesibilidad:** Título como h3.
- **Evita:** Nunca «No hay datos». Di qué pasará y cómo empezar.

```ts
EmptyState({ icon?: Icon; title: ReactNode; description?: ReactNode; action?: ReactNode })
```

### Skeleton

Placeholder animado que imita la forma del contenido mientras carga.

- **Cuándo:** Cargas >300ms de listas, tarjetas y saldos.
- **Variantes:** `circle`, `lines`, ancho/alto.
- **Móvil:** Shimmer de 1.4s; respeta «reducir movimiento».
- **Accesibilidad:** Contenedor con `aria-busy="true"`.
- **Evita:** No uses spinner para listas; usa skeleton.

```ts
Skeleton({ width?; height?; circle?: boolean; lines?: number })
```

### ProgressBar

Barra de progreso con etiqueta y valor; entra creciendo.

- **Cuándo:** Avance de metas, completitud de perfil/expediente, cargas.
- **Variantes:** `tone` accent/success, `indeterminate`, `valueLabel`.
- **Móvil:** Alto 8, radio completo.
- **Accesibilidad:** `role="progressbar"` con valores.
- **Evita:** —

```ts
ProgressBar({ value: number; max?: number; label?: string; valueLabel?: string; tone?: 'accent'|'success'; indeterminate?: boolean })
```

### ProgressRing

Anillo de progreso animado con valor al centro.

- **Cuándo:** Resumen compacto de metas, completitud.
- **Variantes:** `tone` accent/brand, `size`, `label`.
- **Móvil:** Igual.
- **Accesibilidad:** `role="progressbar"`.
- **Evita:** —

```ts
ProgressRing({ value: number; size?: number; stroke?: number; tone?: 'accent'|'brand'; label?: string })
```

### Tooltip

Burbuja de ayuda breve al pasar el cursor o enfocar.

- **Cuándo:** Aclarar íconos o términos en web.
- **Variantes:** `open` fuerza visible.
- **Móvil:** No existe hover: en móvil usa texto de ayuda visible o un ícono Info que abre un sheet.
- **Accesibilidad:** `role="tooltip"`, también con foco.
- **Evita:** No pongas información esencial solo en tooltips.

```ts
Tooltip({ content: ReactNode; children: ReactNode; open?: boolean })
```

## Feedback

### Alert

Mensaje en línea informativo, de éxito, atención o error, con título y acciones.

- **Cuándo:** Avisos contextuales dentro de la pantalla.
- **Variantes:** Tonos `info` `success` `warning` `danger`; `outline`; `banner` (a sangre); `actions`; `onClose`.
- **Móvil:** Ancho completo dentro del contenido; banner arriba para avisos globales (sin conexión).
- **Accesibilidad:** `role="alert"` en error; `status` en el resto.
- **Evita:** Un alert por bloque. Errores: di qué pasó y cómo resolverlo, sin culpar.

```ts
Alert({ tone?: 'info'|'success'|'warning'|'danger'; title?: ReactNode; children; actions?: ReactNode; onClose?: () => void; outline?: boolean; banner?: boolean })
```

### Toast

Confirmación breve y temporal (snackbar) con acción opcional.

- **Cuándo:** Resultado de una acción: guardado, copiado, enviado. Se cierra sola en 4–6 s.
- **Variantes:** `tone="success"`, `action` (Deshacer), `onClose`.
- **Móvil:** Android: Snackbar. iOS: banner propio sobre la tab bar.
- **Accesibilidad:** `role="status"`; no roba foco.
- **Evita:** No para errores que requieren acción (usa Alert o Dialog).

```ts
Toast({ children; tone?: 'success'; action?: string; onAction?: () => void; onClose?: () => void })
```

### Spinner

Indicador circular de carga para acciones puntuales.

- **Cuándo:** Dentro de botones o cargas breves de un bloque pequeño.
- **Variantes:** `size`.
- **Móvil:** iOS ProgressView, Android CircularProgressIndicator.
- **Accesibilidad:** `role="status"` con label.
- **Evita:** Para contenido estructurado usa Skeleton.

```ts
Spinner({ size?: number; label?: string })
```

### Dialog

Diálogo modal con título, ícono, cuerpo con scroll y pie de acciones.

- **Cuándo:** Confirmaciones, formularios cortos, detalles que requieren atención. Esc/clic fuera cierran.
- **Variantes:** `size` sm/md/lg, `icon`, `tone="danger"`, `inline` (documentación).
- **Móvil:** En móvil prefiere BottomSheet para formularios; diálogos solo para confirmar (iOS Alert, Android AlertDialog).
- **Accesibilidad:** `role="dialog"`, `aria-modal`, foco atrapado, Esc cierra.
- **Evita:** No encadenes diálogos. Botón destructivo con verbo explícito («Eliminar meta»).

```ts
Dialog({ open?: boolean; title: ReactNode; children; footer?: ReactNode; onClose?: () => void; size?: 'sm'|'md'|'lg'; icon?: Icon; tone?: 'danger'; inline?: boolean })
```

### BottomSheet

Hoja inferior móvil con asa, título y contenido.

- **Cuándo:** Acciones y formularios breves en móvil: elegir cuenta, confirmar transferencia, filtros.
- **Variantes:** —
- **Móvil:** iOS .sheet(presentationDetents), Android ModalBottomSheet. Respeta safe area inferior.
- **Accesibilidad:** Foco al abrir; cierre por gesto y botón.
- **Evita:** No para contenido muy largo (usa pantalla completa).

```ts
BottomSheet({ title?: ReactNode; children; onClose?: () => void })
```

## Navegación

### AppBar

Barra superior móvil con regresar, título y acciones.

- **Cuándo:** Encabezado de cada pantalla móvil.
- **Variantes:** `variant="brand"` (azul de marca), `center`, `onBack`, `actions`.
- **Móvil:** iOS NavigationBar (título grande opcional con headline-lg); Android TopAppBar. Alto 56 + safe area.
- **Accesibilidad:** Botón regresar con label «Regresar».
- **Evita:** Máx. 2 acciones; el resto en Menu.

```ts
AppBar({ title: ReactNode; onBack?: () => void; actions?: ReactNode; variant?: 'brand'; center?: boolean })
```

### BottomNav

Barra de navegación inferior móvil con 3–5 destinos.

- **Cuándo:** Navegación principal de la app móvil.
- **Variantes:** Ícono relleno + píldora en activo; `count`.
- **Móvil:** iOS TabView, Android NavigationBar. Alto 64 + safe area.
- **Accesibilidad:** `aria-current="page"`.
- **Evita:** Máx. 5 destinos; etiquetas de 1 palabra.

```ts
BottomNav({ items: { id, label, icon, count? }[]; active: string; onChange: (id) => void })
```

### Sidebar

Navegación lateral de la web app con secciones, contadores y pie.

- **Cuándo:** Apps web de escritorio (sistema interno, banca en línea).
- **Variantes:** Secciones (`{ section }`), `count`, `footer`, `brand`.
- **Móvil:** En <1024px se vuelve drawer; en app nativa usa BottomNav.
- **Accesibilidad:** `nav` con label; `aria-current`.
- **Evita:** Máx. ~8 destinos principales.

```ts
Sidebar({ brand?: ReactNode; items: ({ id, label, icon, count? } | { section })[]; active; onNavigate?; footer?: ReactNode })
```

### TopBar

Barra superior de la web app: título/migas, búsqueda y acciones.

- **Cuándo:** Encabezado persistente de apps web.
- **Variantes:** `leading`, `children` (buscador), `actions`.
- **Móvil:** En móvil usa AppBar.
- **Accesibilidad:** `header`.
- **Evita:** —

```ts
TopBar({ title?: ReactNode; leading?: ReactNode; actions?: ReactNode; children? })
```

### Breadcrumbs

Ruta jerárquica de la página actual.

- **Cuándo:** Web app con 3+ niveles.
- **Variantes:** —
- **Móvil:** No se usan; usa AppBar con regresar.
- **Accesibilidad:** `aria-current` en el último.
- **Evita:** —

```ts
Breadcrumbs({ items: { label, href? }[] })
```

### Pagination

Paginación numérica con anterior/siguiente.

- **Cuándo:** Tablas largas en web.
- **Variantes:** Elipsis automática.
- **Móvil:** En móvil, scroll infinito o «Cargar más».
- **Accesibilidad:** `aria-current`.
- **Evita:** —

```ts
Pagination({ page: number; pages: number; onChange: (p) => void })
```

### Steps

Indicador de pasos de un flujo en barras.

- **Cuándo:** Formularios de varios pasos (solicitud, registro).
- **Variantes:** —
- **Móvil:** Arriba del contenido, bajo la AppBar; en pantallas estrechas muestra solo «Paso 2 de 3».
- **Accesibilidad:** `aria-current="step"`.
- **Evita:** Máx. 5 pasos.

```ts
Steps({ steps: string[]; current: number })
```

### Menu

Menú de acciones contextuales (dropdown).

- **Cuándo:** «Más opciones» en filas, tarjetas o barras.
- **Variantes:** Separadores (`"-"`), íconos, acción `danger`.
- **Móvil:** iOS context menu / action sheet; Android DropdownMenu o bottom sheet.
- **Accesibilidad:** `role="menu"/"menuitem"`.
- **Evita:** Máx. ~7 opciones.

```ts
Menu({ items: ({ label, icon?, danger?, onClick? } | '-')[] })
```

## Layout

### AppShell

Marco de web app: Sidebar + TopBar + contenido con ancho máximo.

- **Cuándo:** Estructura base de cualquier app web CRECE.
- **Variantes:** Pasa `sidebar`, `topbar` y el contenido.
- **Móvil:** En app nativa: Scaffold con BottomNav.
- **Accesibilidad:** `main` único.
- **Evita:** —

```ts
AppShell({ sidebar?: ReactNode; topbar?: ReactNode; children })
```

### PageHeader

Encabezado de página: migas, overline, título, descripción y acciones.

- **Cuándo:** Inicio de cada página web.
- **Variantes:** —
- **Móvil:** En móvil: título grande bajo la AppBar.
- **Accesibilidad:** Título como h1.
- **Evita:** Un h1 por página.

```ts
PageHeader({ overline?; title; description?; actions?: ReactNode; breadcrumbs?: ReactNode })
```

### DeviceFrame

Marco de teléfono (390×844) para documentar y prototipar pantallas móviles.

- **Cuándo:** Mockups, demos y presentaciones de la app móvil.
- **Variantes:** `statusTone="brand"` para pantallas con cabecera azul. Usa `DeviceBody` para el área con scroll.
- **Móvil:** —
- **Accesibilidad:** Solo documentación.
- **Evita:** No lo uses en producto.

```ts
DeviceFrame({ children; statusTone?: 'brand'; time?: string })
```

### DeviceBody

Área de contenido con scroll dentro de DeviceFrame.

- **Cuándo:** Ver DeviceFrame.
- **Variantes:** `padded` (20px laterales).
- **Móvil:** —
- **Accesibilidad:** —
- **Evita:** —

```ts
DeviceBody({ children; padded?: boolean })
```

## Movimiento

### Stagger

Hace entrar a sus hijos en cascada (crecer hacia arriba, 60ms entre cada uno).

- **Cuándo:** Primera carga de listas, tarjetas de inicio, resultados.
- **Variantes:** `as` para la etiqueta contenedora.
- **Móvil:** Compose: AnimatedVisibility con delay por índice; SwiftUI: .transition + .animation(.delay(i*0.06)).
- **Accesibilidad:** Se desactiva con reducir movimiento; el contenido siempre queda visible.
- **Evita:** Solo en la primera aparición, no en cada re-render.

```ts
Stagger({ children; as?: string; className?: string })
```

### AnimatedNumber

Cifra que cuenta hasta su nuevo valor (ease-out cúbico, 600ms).

- **Cuándo:** Saldos al cargar, cuota del simulador, KPIs.
- **Variantes:** `duration`, `format`.
- **Móvil:** Compose animateFloatAsState; SwiftUI .contentTransition(.numericText()).
- **Accesibilidad:** Con reducir movimiento salta directo al valor.
- **Evita:** No animes montos en tablas ni listas.

```ts
AnimatedNumber({ value: number; duration?: number; format?: (n) => string })
```

## Finanzas

### AccountCard

Tarjeta de cuenta con saldo, número enmascarado y botón para ocultar.

- **Cuándo:** Encabezado de inicio móvil y web de banca.
- **Variantes:** Azul de marca (defecto) o `light`. Esquina firma y anillos decorativos de marca.
- **Móvil:** Ancho completo con margen 20; saldo `amount-xl`. Guarda preferencia de ocultar saldo.
- **Accesibilidad:** Botón ojo con label claro.
- **Evita:** No muestres el número de cuenta completo.

```ts
AccountCard({ label?: string; number?: string; balance: number; available?: number; light?: boolean; hidden?: boolean; onToggle?: (hidden) => void })
```

### QuickActions

Grilla de accesos rápidos con ícono duotono.

- **Cuándo:** Acciones frecuentes en inicio: pagar, transferir, ahorrar, solicitar.
- **Variantes:** `columns`; ítem `accent` destacado.
- **Móvil:** 4 columnas en teléfono; íconos 56px.
- **Accesibilidad:** Texto visible bajo cada ícono.
- **Evita:** Máx. 8 acciones.

```ts
QuickActions({ items: { label, icon, accent?, onClick? }[]; columns?: number })
```

### TransactionItem

Movimiento con ícono, descripción, fecha y monto con signo.

- **Cuándo:** Listas de movimientos y estados de cuenta.
- **Variantes:** Ingresos en verde con flecha entrante; egresos en tinta neutra.
- **Móvil:** Alto 64; agrupa por día con encabezado caption.
- **Accesibilidad:** El signo +/− se lee; no dependas del color.
- **Evita:** No uses rojo para egresos normales.

```ts
TransactionItem({ title: string; meta: string; amount: number; icon?: Icon; incoming?: boolean })
```

### SavingsGoal

Meta de ahorro con progreso naranja, fecha y montos.

- **Cuándo:** Listado y detalle de metas.
- **Variantes:** `icon` por tipo de meta; 100% → badge de éxito.
- **Móvil:** Tarjeta ancho completo.
- **Accesibilidad:** Porcentaje también en texto.
- **Evita:** —

```ts
SavingsGoal({ name: string; target: number; saved: number; date?: string; icon?: Icon })
```

### LoanCalculator

Simulador de cuota: monto, plazo y cuota animada con desglose y CTA.

- **Cuándo:** Simular antes de solicitar, en app y web.
- **Variantes:** `min` `max` `step` `rate` `terms` `defaultAmount` `defaultTerm` `ctaLabel`.
- **Móvil:** Pantalla completa; CTA `lg` fijo abajo.
- **Accesibilidad:** Cuota con aria-live (AnimatedNumber).
- **Evita:** Siempre con disclaimer; nunca prometas aprobación.

```ts
LoanCalculator({ min?; max?; step?; rate?; terms?: number[]; defaultAmount?; defaultTerm?; onApply?: ({ amount, term, payment }) => void; ctaLabel?: string })
```

### AmortizationTable

Plan de pagos (mes, cuota, capital, interés, saldo).

- **Cuándo:** Detalle de simulación o de préstamo activo.
- **Variantes:** `limit` filas.
- **Móvil:** En móvil, lista de cuotas por mes en vez de tabla.
- **Accesibilidad:** Tabla con caption.
- **Evita:** —

```ts
AmortizationTable({ schedule: { month, payment, capital, interest, balance }[]; limit?: number })
```

### StatusTracker

Seguimiento de una solicitud por etapas (sobre Timeline).

- **Cuándo:** Pantalla «Estado de mi solicitud».
- **Variantes:** `current`, `meta` por paso, `error` para devolución/rechazo.
- **Móvil:** Ancho completo.
- **Accesibilidad:** Estado en texto.
- **Evita:** —

```ts
StatusTracker({ steps?: string[]; current: number; meta?: Record<number, string>; error?: string })
```

### DocumentChecklist

Lista de documentos requeridos con estado y acción de subir.

- **Cuándo:** Expediente de crédito, apertura de cuenta.
- **Variantes:** Documento listo (verde) o pendiente (Subir).
- **Móvil:** «Subir» abre cámara/archivos.
- **Accesibilidad:** Estado en texto.
- **Evita:** Explica por qué se pide cada documento.

```ts
DocumentChecklist({ items: { key?, title, file? }[]; onUpload?: (item) => void })
```

## Gráficas

### BarChart

Barras simples, agrupadas o apiladas con tooltip y paleta validada.

- **Cuándo:** Comparar magnitudes por categoría o periodo.
- **Variantes:** `series` (varias claves), `stacked`, `format`.
- **Móvil:** Máx. 6 barras visibles; scroll horizontal para más. Tooltips por toque.
- **Accesibilidad:** Leyenda + etiqueta aria; ofrece tabla para detalle.
- **Evita:** Un solo eje; sin 3D; más de 6 series → «Otros».

```ts
BarChart({ data: { label, [key]: number }[]; series?: string[]; stacked?: boolean; height?: number; format?: (n) => string; label?: string })
```

### DonutChart

Proporciones de un total con leyenda y porcentajes.

- **Cuándo:** Composición de cartera, distribución de gastos (máx. 5 partes).
- **Variantes:** `centerValue`, `centerLabel`.
- **Móvil:** Leyenda debajo en pantallas estrechas.
- **Accesibilidad:** Porcentajes en texto en la leyenda.
- **Evita:** No para comparar valores cercanos (usa barras).

```ts
DonutChart({ data: { label, value }[]; size?; thickness?; format?; centerLabel?; centerValue? })
```

### Sparkline

Mini tendencia sin ejes, con área y punto final.

- **Cuándo:** Junto a KPIs o saldos para mostrar tendencia.
- **Variantes:** `tone`, `area`.
- **Móvil:** Igual.
- **Accesibilidad:** `aria-label` con inicio y fin.
- **Evita:** Sin ejes = no para valores exactos.

```ts
Sparkline({ data: number[]; width?; height?; tone?: string; area?: boolean })
```

