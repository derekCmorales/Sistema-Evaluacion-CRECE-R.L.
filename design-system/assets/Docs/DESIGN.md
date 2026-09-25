# Design System: CRECE Guatemala

> Cooperativa CRECE Guatemala, R.L. — sistema de diseño v2 multiplataforma (app móvil, web app, sistemas internos, sitios). Generado el 2026-09-24 desde la fuente única `design-system/src/`.

## 1. Atmósfera visual

Una interfaz **cercana, clara y serena**, con un gesto cálido. Blanco y azul CRECE con mucho aire; el naranja aparece poco y siempre con intención, como la «G» dentro de la «C» del símbolo. Densidad equilibrada de app cotidiana (4/10) en móvil y media (6/10) en herramientas internas; composición ordenada y predecible (variancia 3/10) porque se trata de dinero; movimiento fluido y medido (5/10): las cosas entran creciendo con un leve rebote. Una sola firma visual por pantalla: la esquina inferior derecha redondeada a 100px. Tono: alguien de la comunidad que cree en tus metas, no un banco que evalúa riesgo.

## 2. Paleta y roles

Identidad del manual: **Azul CRECE** (#034381), **Naranja CRECE** (#e8973c), **Gris CRECE** (#363636).

| Rol | Claro | Oscuro | Función |
|---|---|---|---|
| `bg-canvas` | #ffffff | #101c2a | Fondo base de pantalla/documento. |
| `bg-subtle` | #f3f7fb | #192a3d | Fondo alterno: secciones, shell de apps, cabeceras de tabla, contenedor de segmentados. |
| `bg-surface` | #ffffff | #142234 | Superficies: tarjetas, paneles, inputs, barras de navegación. |
| `bg-muted` | #eaf2f9 | #20374f | Tinte de marca: contenedores de ícono, ítem activo, resaltados, alerta info. |
| `bg-brand-strong` | #034381 | #0b2a4a | Bloques de marca de alto impacto: tarjeta de saldo, splash, cabecera hero de app. |
| `border-default` | #dce5ed | #34485c | Bordes y divisores de 1px. Decorativo: no carga significado solo. |
| `text-primary` | #103b64 | #e4edf6 | Titulares, etiquetas, valores. Sobre `bg-canvas`, `bg-surface`, `bg-subtle`, `bg-muted`. |
| `text-body` | #4d6072 | #c0cedd | Texto corrido. Sobre `bg-canvas`, `bg-surface`, `bg-subtle`. |
| `text-secondary` | #586b7e | #a7b8ca | Ayudas, metadatos, placeholders, captions. ≥4.5:1 sobre `bg-canvas`, `bg-surface`, `bg-subtle`. |
| `brand` | #034381 | #90bffc | Acción principal y énfasis: botón primario, enlaces, íconos activos, cifras destacadas, foco de selección. |
| `accent` | #e8973c | #e8973c | Acento cálido de uso medido: CTA destacado (uno por pantalla), FAB, indicadores de novedad, progreso de metas, pulgar de slider. |
| `on-accent` | #223345 | #223345 | Texto sobre `accent` (6.3:1). Nunca blanco sobre naranja. |
| `success` | #24714f | #95d2b1 | Éxito: aprobado, pagado, completado. Siempre con ícono o palabra. |
| `warning` | #945512 | #f3bd79 | Atención: en revisión, pendiente, vence pronto. |
| `danger` | #a22d30 | #ff9f9f | Error, rechazo, acción destructiva, mora. |
| `focus` | #b86b0e | #f2b969 | Anillo de foco: 3px sólido, offset 2–4px. ≥3:1 sobre todas las superficies. |

Paleta de datos (orden fijo, validada para daltonismo): `chart-1` #2f6db3 · `chart-2` #e8973c · `chart-3` #1f9a8a · `chart-4` #8a5a9e · `chart-5` #6a9b3c · `chart-6` #d0568a.

## 3. Tipografía

- **Display (titulares):** Proxima Nova Alt → Urbanist. Tracking negativo (−0.02 a −0.04em), peso 750–800, jerarquía por peso y color.
- **Sans (texto, UI, cifras):** Proxima Nova → Figtree. Texto 16/24, interlineado cómodo, máx. 65 caracteres; cifras siempre tabulares.
- **Licencia:** Proxima Nova Alt es comercial (Mark Simonson); no se empaqueta. Urbanist y Figtree (SIL OFL) están en `fonts/`.
- **Prohibido:** recomponer el logotipo con fuentes, MAYÚSCULAS sostenidas fuera de `overline`, texto < 12px.

## 4. Estilo de componentes (resumen)

- **Botones:** radio 10, alto 44 (52 en CTA móvil), primario azul, secundario con borde, acento naranja con texto #223345 solo para el CTA de marca; suben 1px al hover y escalan 0.98 al presionar; la flecha avanza 3px.
- **Tarjetas:** radio 14, borde de 1px o fondo suave; sombra solo cuando flotan. Nunca tarjeta dentro de tarjeta.
- **Campos:** etiqueta arriba, ayuda debajo, error en rojo con ícono, foco con anillo azul translúcido; texto 16.
- **Carga:** skeleton con la forma final; spinner solo dentro de botones.
- **Vacíos:** ícono duotono en contenedor con esquina firma, título esperanzador y una acción.
- **Montos:** `Amount` con moneda y decimales reducidos, tabular; ingresos en verde con +, egresos en tinta neutra.

## 5. Layout

Grilla de 4. Móvil: 4 columnas, margen 20, BottomNav. Tablet: 8 columnas, margen 24–32. Escritorio: 12 columnas, margen 32–48, Sidebar 256 + contenido máx. 1320. Todo colapsa a una columna bajo 768px. Objetivo táctil mínimo 44pt/48dp.

## 6. Movimiento

Curva de marca `cubic-bezier(0.22, 0.68, 0, 1.03)`; duraciones 80/150/220/320/500/750ms; cascadas de 60ms; resorte nativo damping 18 / stiffness 180. Solo `transform` y `opacity`. Todo se desactiva con «reducir movimiento».

## 7. Anti-patrones (prohibido)

- Colores fuera de tokens, grises sin sesgo azul, negro puro.
- Texto naranja sobre blanco o blanco sobre naranja.
- Más de un CTA naranja o más de una esquina firma por pantalla.
- Rojo para egresos normales; color como único indicador.
- Tarjetas anidadas, borde + sombra, degradados decorativos, brillos neón.
- Etiquetas solo con placeholder; errores genéricos.
- Emoji; clichés («revoluciona», «sin fricción»); nombres genéricos de ejemplo; datos reales en demos.
- Prometer aprobación o tiempos; ocultar disclaimers.

## 8. Galería

### App móvil · acceso

![App móvil · acceso](/_blob/bf59def1627d21decbc93a559bea34d6)

### App móvil · inicio, movimientos y metas

![App móvil · inicio, movimientos y metas](/_blob/8e741dd3647929b5fd916412b35cf286)

### App móvil · tema oscuro

![App móvil · tema oscuro](/_blob/b21432fa7770a70caa37175565f33223)

### App móvil · crédito

![App móvil · crédito](/_blob/a498abcf2a183380216fd01dd4a8a0e3)

### App móvil · perfil, vacío y confirmación

![App móvil · perfil, vacío y confirmación](/_blob/bb44f2b166c001e2fcb003a740f24117)

### Web app · dashboard

![Web app · dashboard](/_blob/f39db65ff1fc5c9210e32eefe38325a0)

### Web app · tema oscuro

![Web app · tema oscuro](/_blob/252712b2897d938c78973748fb60af99)

### Web app · expediente

![Web app · expediente](/_blob/f3561639f7866f378c9f052b4659717e)

### Web app · formulario

![Web app · formulario](/_blob/f6191baf99762e0d622dba99c0ccc11f)

### Fundamentos · color

![Fundamentos · color](/_blob/3277f8c3bfe161467021ed819aeeece9)

### Fundamentos · tipografía

![Fundamentos · tipografía](/_blob/4933135904a8a75f740a43daaff598c4)

### Fundamentos · espacio y forma

![Fundamentos · espacio y forma](/_blob/c0c11abf7d7b7f3a412bd77d8a6b1353)

### Fundamentos · iconografía

![Fundamentos · iconografía](/_blob/9881629fe9992ace3acab2ef9671b1f8)

### Fundamentos · datos

![Fundamentos · datos](/_blob/9bbd9b6010ae8b3848e873fab9e03215)

### Fundamentos · grid y plataformas

![Fundamentos · grid y plataformas](/_blob/f09164d0f9d72846c850fadf6b7e95b6)

---

# Brand book

Sistema de diseño de **Cooperativa CRECE Guatemala, R.L.**: la base única para app móvil (iOS y Android), web app, sistemas internos, sitios y piezas digitales. Un solo conjunto de tokens, 73 componentes, 7 fundamentos documentados y 7 pantallas de referencia, con exportaciones para CSS, Tailwind, React, React Native, Flutter, SwiftUI y Figma.

Lema: **«Lo que sueñas, crece contigo.»** · Firma: **«Tu próximo paso. Nuestro compromiso.»**

## Principios

1. **Cercanía antes que banca.** Hablamos y diseñamos como alguien de la comunidad que cree en tus metas: tuteo, frases cortas, espacio para respirar, fotografía humana.
2. **Claridad con el dinero.** Montos protagonistas y tabulares, estados siempre con palabra, cálculos explicados, nada de letra chica.
3. **Decisiones humanas, rastro visible.** El sistema acompaña y registra; las decisiones las toman personas y quedan en la bitácora.
4. **Calma con un gesto cálido.** Azul y blanco con aire; el naranja aparece poco y con intención. Una sola firma visual por pantalla: la esquina redondeada de 100px.
5. **Una base, todas las plataformas.** Mismo token, mismo nombre, mismo comportamiento en web, iOS, Android y Flutter.

## Cómo usar este sistema

- **Tokens primero.** Consume solo tokens semánticos (`bg-surface`, `text-primary`, `brand`, `accent`, `success`…). Los primitivos (`blue-700`) alimentan a los semánticos; no los uses en pantallas.
- **Componentes después.** Antes de crear algo, busca en el catálogo (sección Componentes). Si un caso no existe, compónlo con los existentes y los tokens.
- **Patrones para flujos completos.** Formularios, carga/vacío/error, acciones sensibles, dinero, dashboards y seguimiento (sección Patrones).
- **Pantallas como referencia.** Las demos del grupo Pantallas muestran composiciones reales en móvil y web.

## Resumen visual

- **Color:** `crece-blue` #034381 y `crece-orange` #e8973c del manual. En UI: `brand` para acción, `accent` como CTA de marca (máx. 1 por pantalla, texto `on-accent`), neutros con sesgo azul, `success`/`warning`/`danger` con fondos suaves. Tema claro y oscuro completos.
- **Tipografía:** titulares en `display` (Proxima Nova Alt → Urbanist) con tracking negativo y peso 750–800; texto, UI y cifras en `sans` (Proxima Nova → Figtree) con números tabulares. Proxima Nova Alt es de licencia comercial y no se empaqueta; queda primera en la pila para quien tenga licencia.
- **Espacio:** grilla de 4 (`space-1`…`space-24`), márgenes 20 móvil / 32–48 escritorio.
- **Forma:** radio de control `radius-md` 10, tarjetas `radius-lg` 14, paneles `radius-xl` 20, diálogos `radius-2xl` 28, y la firma `radius-signature` 100 en una sola esquina.
- **Elevación:** superficies planas con borde; sombras teñidas de azul solo para lo que flota (`elevation-1…4`).
- **Movimiento:** entrar creciendo con `ease-brand` (leve rebote), respuestas de 80–220ms, cascadas de 60ms, todo desactivable con «reducir movimiento».
- **Íconos:** Phosphor, regular para UI, fill para activo, duotone para acentos en cuadros tinte. Sin emoji.
- **Datos:** paleta de 6 series validada para daltonismo (`chart-1…6`), un solo eje, leyenda y etiquetas.

## Contenido y voz

Tú al asociado, nosotros para CRECE. Mayúscula solo al inicio (salvo `overline`). Montos `Q25,000` / `Q1,248.10`. Botones con verbo claro («Solicitar préstamo», «Guardar cambios», «Eliminar meta»). Estados vacíos esperanzadores («Tu primera meta empieza aquí»). Errores que dicen cómo corregir. Disclaimers junto a lo que aclaran. Nada de promesas de aprobación.

## Logo

Usa los archivos del grupo **Logos** (horizontal y vertical; color, blanco y negro). Área de reserva del 10% por lado. No rotar, distorsionar, recolorear ni reordenar símbolo y texto. Sobre `bg-brand-strong` o foto, versión blanca. El símbolo: la «C» de CRECE abraza la «G» de Guatemala.

## Qué NO hacer

- Colores sueltos fuera de tokens; grises neutros sin sesgo azul; negro puro.
- Texto naranja sobre blanco o blanco sobre naranja.
- Más de un CTA naranja o más de una esquina firma por pantalla.
- Rojo para egresos normales; color como único indicador de estado.
- Tarjetas dentro de tarjetas; borde y sombra a la vez; degradados decorativos.
- Placeholders como única etiqueta; errores genéricos («Error», «Datos inválidos»).
- Emoji, jerga financiera sin explicar, promesas de aprobación o de tiempos.
- Recomponer el logotipo con fuentes; usar Montserrat u otras familias ajenas al sistema.

## Documentación completa

Las secciones siguientes (Fundamentos, Componentes, Patrones, Pantallas, Movimiento, Iconografía, Contenido y voz, Plataformas, Accesibilidad, Dominio) están también consolidadas en un solo archivo: **`assets/Docs/DESIGN.md`**, listo para compartir, versionar o dar como contexto a otras herramientas.


---

# Fundamentos

Los tokens son la única fuente de verdad. Ningún componente, pantalla o plataforma usa valores sueltos: todo sale de `tokens.json` (y de sus exportaciones en el grupo de assets **Platforms**).

## Arquitectura de tokens

Tres capas, siempre en este orden de consumo:

1. **Primitivos** — escalas crudas: `blue-50…950`, `orange-50…950`, `neutral-0…950`, `night-100…950`, `green-*`, `red-*`. Nunca se usan directo en UI; solo alimentan a los semánticos.
2. **Semánticos** — el rol, con valor por tema: `bg-*`, `text-*`, `border-*`, `brand`, `accent`, `success`, `warning`, `danger`, `info`, `focus`, `overlay`, `chart-*`. **Es la capa que consumen los componentes.**
3. **Componente** — decisiones locales dentro de cada componente (p. ej. el alto del botón usa `control-md`). Viven en `bundle.css` y en las guías, no como tokens nuevos.

Identidad fija (no cambia con el tema): `crece-blue` #034381, `crece-orange` #e8973c, `crece-gray` #363636.

## Color

| Rol | Claro | Oscuro | Uso |
|---|---|---|---|
| `bg-canvas` | #ffffff | #101c2a | Fondo de pantalla |
| `bg-subtle` | #f3f7fb | #192a3d | Fondo alterno, shell, cabeceras de tabla |
| `bg-surface` | #ffffff | #142234 | Tarjetas, paneles, inputs, barras |
| `bg-raised` | #ffffff | #1c2e43 | Diálogos, sheets, menús |
| `bg-muted` | #eaf2f9 | #20374f | Tinte de marca, ítem activo |
| `bg-brand-strong` | #034381 | #0b2a4a | Tarjeta de saldo, splash, cabeceras de marca |
| `text-primary` | #103b64 | #e4edf6 | Títulos, etiquetas, valores |
| `text-body` | #4d6072 | #c0cedd | Texto corrido |
| `text-secondary` | #586b7e | #a7b8ca | Ayudas, metadatos |
| `brand` | #034381 | #90bffc | Acción principal (texto encima: `on-brand`) |
| `accent` | #e8973c | #e8973c | Acento cálido medido (texto encima: `on-accent` #223345) |
| `success` / `warning` / `danger` | #24714f / #945512 / #a22d30 | #95d2b1 / #f3bd79 / #ff9f9f | Estados, con su `*-bg` |
| `focus` | #b86b0e | #f2b969 | Anillo de foco 3px |

Reglas:
- Una sola acción `brand` llena por vista; el naranja `accent` aparece como máximo una vez como CTA por pantalla.
- Nunca texto naranja sobre blanco (2.3:1) ni texto blanco sobre naranja: usa `on-accent`.
- Estados siempre con palabra o ícono además del color.
- Los egresos no son rojos: el rojo (`danger`) se reserva para mora, error y destrucción.
- Contraste verificado (WCAG AA) en ambos temas para todos los pares texto/fondo documentados; `border-strong` y `focus` ≥ 3:1.

## Tipografía

| Familia | Pila | Rol |
|---|---|---|
| `display` | Proxima Nova Alt → **Urbanist** → Figtree | Titulares (display, headline) |
| `sans` | Proxima Nova → **Figtree** → system-ui | Texto, UI, cifras |
| `mono` | JetBrains Mono → SF Mono → Menlo | Código y referencias técnicas (raro) |

**Sobre Proxima Nova Alt.** Es la tipografía del manual, de licencia comercial (Mark Simonson Studio: escritorio, web y apps por separado). Adobe Fonts incluye Proxima Nova, no la variante Alt, y solo cubre web con suscripción, sin apps móviles. No se puede empaquetar en este sistema. Queda primera en la pila: quien tenga licencia la verá automáticamente. Los sustitutos libres (SIL OFL, incluidos en `fonts/`):
- **Urbanist**: «a» de un piso y «y» recta, como la variante Alt del logotipo. Solo para titulares.
- **Figtree**: proporciones cercanas a Proxima Nova y números tabulares (imprescindible en finanzas). Todo lo demás.
El logotipo siempre es imagen; nunca se recompone con fuentes.

Escala (px web = pt iOS = sp Android): `display-lg` 56/60 · `display-md` 44/48 · `display-sm` 36/40 · `headline-lg` 30/36 · `headline-md` 24/30 · `headline-sm` 20/26 · `title-lg` 18/24 · `title-md` 16/22 · `title-sm` 14/20 · `body-lg` 18/28 · `body-md` 16/24 · `body-sm` 14/20 · `caption` 12/16 · `label-lg` 16/20 · `label-md` 14/18 · `label-sm` 12/16 · `overline` 11/16 · `amount-xl` 40/44 · `amount-lg` 28/32 · `amount-md` 18/24.

Reglas: titulares con tracking negativo y peso 700–800; texto 16 por defecto (nunca menos de 12); montos siempre tabulares; MAYÚSCULAS solo en `overline`; máximo ~65 caracteres por línea.

## Espacio

Grilla de 4: `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 20 · `space-6` 24 · `space-8` 32 · `space-10` 40 · `space-12` 48 · `space-16` 64 · `space-20` 80 · `space-24` 96 (+ `space-half` 2).
Márgenes laterales: 20 teléfono, 24–32 tablet, 32–48 escritorio. Agrupa con `gap`, no con márgenes sueltos.

## Forma

Radios: `radius-xs` 4 (badges) · `radius-sm` 8 (chips, checkbox) · `radius-md` 10 (botones, inputs — el radio de control CRECE) · `radius-lg` 14 (tarjetas) · `radius-xl` 20 (paneles, tarjeta de saldo, sheets) · `radius-2xl` 28 (diálogos, imágenes) · `radius-full`.
**Firma de marca:** `radius-signature` 100 en una sola esquina (inferior derecha) de una imagen o bloque de marca por pantalla. Eco de la «C» que abraza a la «G» del símbolo. La usan `SignatureImage`, `AccountCard`, `Card signature`, `EmptyState`.

## Elevación

`elevation-0` plano (separa con borde) · `elevation-1` reposo interactivo · `elevation-2` hover, menús, barras fijas · `elevation-3` sheets y popovers · `elevation-4` diálogos · `shadow-brand` FAB. Nunca borde y sombra a la vez. Sombras teñidas del azul de marca (#164577), nunca negras en claro.

## Tamaños

Objetivo táctil mínimo `touch-min` 44 (iOS) / `touch-comfy` 48 (Android). Controles `control-sm` 36 (solo web densa) · `control-md` 44 · `control-lg` 52. Íconos 16/20/24/32/48. Avatares 32/40/56. App bar 56, bottom nav 64, top bar web 64, sidebar 256.

## Temas

Claro y oscuro con los mismos tokens semánticos. Web: `data-theme="light|dark"` en `<html>` o `prefers-color-scheme`. Nativo: colores dinámicos por esquema del sistema. El oscuro no es una inversión: `brand` se aclara a #90bffc, las superficies suben de luminosidad con la elevación y el acento conserva su valor.


---

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



---

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


---

# Pantallas de referencia

Composiciones reales hechas solo con componentes y tokens del sistema. Cada una está en vivo en el grupo **Pantallas** (cambia el tema para verlas en oscuro) y como imagen en el grupo de assets **Screens**.

## App móvil · splash, ingreso y verificación

`AppMovilAcceso`

- Splash con logo vertical blanco sobre `bg-brand-strong` y entrada `cr-anim-pop`
- Ingreso: `Logo`, `display-sm`, `TextField` (DPI con ícono, contraseña con mostrar/ocultar), `Link`, `Button lg block`, `Divider label`, biometría con `Button secondary`
- Verificación: `AppBar` con regresar, contenedor firma, `PinInput` de 6, cuenta regresiva tabular, CTA abajo

## App móvil · inicio, movimientos y metas

`AppMovilInicio`

- Inicio: cabecera `bg-brand-strong` con saludo, `AccountCard light` superpuesta, `QuickActions` (acento en Solicitar), `Alert warning` de vencimiento, `TransactionItem`, `BottomNav`; entrada con `Stagger`
- Movimientos: `AppBar`, `SearchField`, `Chip` de filtro, grupos por día con `overline`, `TransactionItem`
- Metas: resumen `Card tinted` + `ProgressRing`, `SavingsGoal` por meta (incluye 100% y 0%), acción de nueva meta en `AppBar`

## App móvil · simular, documentos y seguimiento de crédito

`AppMovilCredito`

- Simular: `Steps`, `ChoiceCards` de destino con íconos duotono, `LoanCalculator` con cuota animada
- Documentos: `ProgressBar` 2 de 4, `DocumentChecklist` con subir, CTA deshabilitado hasta completar
- Estado: `Card brand signature` con monto y `Badge accent`, `StatusTracker` con paso actual pulsando, contacto humano

## App móvil · perfil y ajustes, avisos vacíos, confirmación

`AppMovilPerfil`

- Perfil: `Avatar lg`, `List inset` con `ListItem` y chevrons, `Switch` de preferencias en `Card`
- Avisos vacíos: `EmptyState` esperanzador
- Confirmación: check con `cr-anim-pop`, `display-sm`, resumen `DescriptionList`, CTA y ghost

## Web app · vista general con KPIs, gráficas y tabla

`WebDashboard`

- `AppShell` (Sidebar con secciones y contador + TopBar con búsqueda, tema y avisos)
- `PageHeader` con saludo, `SegmentedControl` de periodo y CTA
- 4 `Stat` con `Sparkline` en cascada, `BarChart` agrupado + `DonutChart`, `DataTable` de solicitudes con `Avatar`, `Badge` y menú

## Web app · expediente con tabs, documentos, seguimiento y decisión

`WebExpediente`

- `Breadcrumbs`, `PageHeader` con `Badge` de estado y acciones
- `Tabs` con contadores
- Columna izquierda: `DescriptionList` doble, `DocumentChecklist`, `Alert` informativa · Derecha: `StatusTracker` y panel de decisión `Card elevated` con justificación obligatoria

## Web app · formulario de configuración y diálogo de confirmación

`WebFormulario`

- `PageHeader` con vista previa y publicar
- `Alert warning` de cambios sin publicar con acción
- Formulario en 2 columnas: `TextField` (contador, sufijo %, prefijo Q), `Select`, `FileDrop`, `RadioGroup row`, `Switch`, y `Dialog` de confirmación

## Reglas de composición

- Móvil: margen lateral 20, bloques separados por 20–24, CTA principal `lg block` abajo, `BottomNav` solo en pantallas raíz.
- Web: `AppShell` + `PageHeader`; contenido máx. 1320; grillas de 4 (KPIs), 1.6/1 (gráfica + resumen) y 1.5/1 (detalle + acciones).
- Una sola firma visual (esquina 100) y un solo CTA naranja por pantalla.
- Primera carga con `Stagger`; cifras protagonistas con `AnimatedNumber`.


---

# Movimiento

El movimiento comunica **crecimiento**: lo que entra, crece hacia arriba con la curva de marca (leve rebote); lo que responde, lo hace al instante; nada se mueve sin motivo.

## Tokens

| Duración | Valor | Uso |
|---|---|---|
| `duration-instant` | 80ms | Press, toggles |
| `duration-fast` | 150ms | Hover, foco, tooltip |
| `duration-base` | 220ms | Tabs, acordeón, switch, botón |
| `duration-slow` | 320ms | Diálogos, sheets, toasts |
| `duration-slower` | 500ms | Transición de pantalla, progreso, conteo |
| `duration-reveal` | 750ms | Entradas escalonadas |
| `stagger-step` | 60ms | Retraso entre elementos de lista |

| Curva | Valor | Uso |
|---|---|---|
| `ease-brand` | cubic-bezier(0.22, 0.68, 0, 1.03) | Entradas, cosas que crecen, selección |
| `ease-standard` | cubic-bezier(0.2, 0, 0, 1) | Movimiento dentro de pantalla |
| `ease-enter` | cubic-bezier(0, 0, 0.2, 1) | Aparecer |
| `ease-exit` | cubic-bezier(0.4, 0, 1, 1) | Desaparecer |

Nativo: resorte equivalente `damping 18, stiffness 180` (Compose `spring()`, SwiftUI `.spring(response: 0.35, dampingFraction: 0.78)`).

## Biblioteca de animaciones (clases CSS)

| Clase | Qué hace | Cuándo |
|---|---|---|
| `cr-anim-grow-up` | Sube 24px + escala 0.98 → 1 | Entrada de bloques |
| `cr-stagger` / `Stagger` | Cascada de grow-up por hijo | Primera carga de listas/tarjetas |
| `cr-anim-fade-up` | Sube 8px con fade | Textos, acordeón |
| `cr-anim-scale-in` | 0.96 → 1 | Diálogos, menús |
| `cr-anim-pop` | 0.6 → 1.08 → 1 | Éxito, logo en splash |
| `cr-anim-shake` | Vibración horizontal | Error de PIN/validación |
| `cr-anim-pulse` | Halo que respira | Paso actual, grabación, en vivo |
| `cr-skeleton` | Brillo que recorre | Cargas |
| `cr-press` | Escala 0.97 al presionar | Cualquier elemento tocable propio |
| `cr-lift` | Sube 2px + elevation-2 | Tarjetas interactivas |
| `AnimatedNumber` | Cuenta hasta el nuevo valor | Saldos, cuota del simulador |

Microinteracciones incluidas en componentes: flecha del botón avanza 3px; el check del checkbox crece con rebote; el pulgar del switch se desliza con `ease-brand`; el indicador de tabs crece desde el centro; las barras de progreso y anillos se llenan al montar.

## Reglas

- Anima solo `transform` y `opacity` (y colores). Nunca `width`, `height`, `top`, `left`.
- Una coreografía por pantalla: la entrada principal. No animes cada re-render.
- Salidas más rápidas que entradas.
- `prefers-reduced-motion` / «Reducir movimiento» desactiva todo (la hoja ya lo hace); el contenido siempre queda visible en reposo.
- No animes montos dentro de tablas o listas; solo cifras protagonistas.


---

# Iconografía

Sistema: **Phosphor Icons** (MIT). En web, `Crece.Icons.<Nombre>` expone 137 íconos curados para finanzas cooperativas; el paquete completo (`@phosphor-icons/react`, `phosphor-flutter`, `PhosphorSwift`, `phosphor-icons` para Compose/Android) mantiene el mismo trazo en todas las plataformas.

## Pesos

| Peso | Uso |
|---|---|
| `regular` | UI por defecto: navegación, botones, inputs, listas |
| `fill` | Estado activo de navegación (BottomNav, Sidebar), check de listas de beneficios, alertas |
| `duotone` | Íconos de acento en contenedores: accesos rápidos, estados vacíos, tarjetas de opción, metas |
| `bold` | Íconos pequeños (≤16) dentro de badges, chips y steppers |

## Tamaños y color

16 (badges) · 20 (botones, inputs) · 24 (navegación, listas — defecto) · 32 (tarjetas) · 48 (vacíos, éxito). Heredan `currentColor`: casi siempre `brand`; `text-secondary` en estados pendientes; `danger` en eliminar; `success` en completado.

## Contenedores

Íconos de acento dentro de un cuadro `bg-muted` con radio `radius-md`/`radius-lg` (40–56px). El naranja (`accent` con `on-accent`) solo para el acceso destacado.

## Vocabulario (significado fijo)

| Concepto | Ícono |
|---|---|
| Préstamo / crédito | HandCoins |
| Ahorro | PiggyBank |
| Inversión / plazo fijo | ChartLineUp |
| Meta | Target |
| Transferir | ArrowsLeftRight |
| Pagar | Receipt |
| Ingreso | ArrowDownLeft |
| Cuenta | Wallet / Bank |
| Documento | FileText / FilePdf |
| Identidad | IdentificationCard |
| Seguridad | ShieldCheck / LockKey / Fingerprint |
| Negocio | Storefront |
| Hogar | HouseLine |
| Estudios | GraduationCap |
| Agro | Plant / Tractor |
| Ayuda | Question / Headset / ChatCircleText |
| Abrir detalle | ArrowUpRight |
| Avanzar | ArrowRight · Regresar: CaretLeft |

Flechas: ↗ abre algo; → avanza en el flujo; ‹ regresa. Sin emoji en ninguna superficie. El grupo de assets **Icons** incluye SVG en `crece-blue` para diseño y presentaciones.


---

# Contenido y voz

CRECE habla como alguien de la comunidad que cree en tus metas: cercana, clara y honesta. Español de Guatemala (`es-GT`).

## Principios

1. **Cercana.** Tú al asociado; nosotros para CRECE. «Cuéntanos tu meta», «Te avisaremos por WhatsApp».
2. **Clara.** Frases cortas, voz activa, sin jerga financiera sin explicar. «Cuota» antes que «amortización»; si usas un término técnico, acláralo.
3. **Honesta.** Lo ilustrativo se dice en el mismo lugar. Nunca prometas aprobación ni tiempos que no controlas.
4. **Esperanzadora.** Estados vacíos y éxitos celebran el siguiente paso, no el sistema.

## Mecánica

- Mayúscula inicial en títulos y botones (tipo oración). MAYÚSCULAS solo en `overline`.
- Moneda: `Q25,000`, `Q1,248.10` (`Intl` es-GT, GTQ). Porcentajes sin espacio: `18%`. Fechas: «15 oct 2026», «Hoy · 9:30».
- Números de cuenta y tarjetas enmascarados: `•••• 4821`.
- Sin emoji. Signos de exclamación solo en celebraciones («¡Tu solicitud va en camino!»).
- Nombres de ejemplo guatemaltecos y verosímiles (Mariana López, Rosa Ixcot, Juan Tzul), nunca «Juan Pérez» genérico ni datos reales.

## Por componente

| Elemento | Hazlo así | Evita |
|---|---|---|
| Botón | «Solicitar préstamo», «Guardar cambios», «Eliminar meta» | «Aceptar», «OK», «Clic aquí» |
| Título de pantalla | «Mis metas», «Mi solicitud» | «Módulo de metas» |
| Estado vacío | «Tu primera meta empieza aquí» | «No hay datos» |
| Error | «No pudimos verificar tu DPI. Revisa que la foto sea legible.» | «Error 400», «Datos inválidos» |
| Éxito | «Pago registrado. Tu cuota de septiembre quedó al día.» | «Operación exitosa» |
| Confirmación destructiva | «¿Eliminar esta meta? El dinero vuelve a tu cuenta.» | «¿Está seguro?» |
| Disclaimer | «Cálculo ilustrativo sobre saldo. No incluye seguros ni comisiones.» | Letra chica escondida |

## Frases de marca

- Lema: «Lo que sueñas, crece contigo.»
- Firma: «Tu próximo paso. Nuestro compromiso.»
- Tono de saludo del sistema interno: «Un nuevo día para hacer crecer.»
- Titulares en dos tiempos: afirmación + complemento. «Hagamos números. / Imagina lo que sigue.»


---

# Plataformas

El mismo sistema, con la misma consistencia, en cualquier superficie. Las exportaciones viven en el grupo de assets **Platforms** y se regeneran desde `design-system/src/tokens.mjs`.

| Archivo | Plataforma | Cómo se usa |
|---|---|---|
| `crece-tokens.css` | Web (cualquier framework, sitios, landings) | Impórtalo una vez; usa `var(--brand)`, clases `.body-md`, `.amount-xl`. Tema con `data-theme`. |
| `tailwind.preset.js` | Web con Tailwind | `presets: [require('./tailwind.preset.js')]` → `bg-brand`, `text-text-primary`, `rounded-md`, `shadow-e2`, `text-body-md`. |
| `bundle.js` + `bundle.css` | Web React | `window.Crece.Button` … o importa desde el código fuente (`src/lib.jsx`). |
| `crece-theme.native.js` | React Native / Expo | `colors.light/dark`, `typography`, `space`, `radius`, `size`, `motion`, `elevation`. |
| `crece_theme.dart` | Flutter | `MaterialApp(theme: CreceTheme.light(), darkTheme: CreceTheme.dark())`; `CreceColors`, `CreceText`, `CreceSpace`, `CreceRadius`, `CreceMotion`. |
| `CreceTheme.swift` | iOS (SwiftUI) | `Color.crece.brand`, `Font.crece(.titleLg)`, `CreceSpace.s4`. Colores dinámicos claro/oscuro. |
| `tokens.dtcg.json` | Figma (Tokens Studio), Style Dictionary, Android/Compose | Formato W3C Design Tokens: primitivos, `light`, `dark`, dimensiones, tipografía. |

## Equivalencias de componentes

| CRECE | iOS (SwiftUI) | Android (Compose) | Flutter |
|---|---|---|---|
| Button primary/secondary/ghost | Button + ButtonStyle propio | Button / OutlinedButton / TextButton | FilledButton / OutlinedButton / TextButton |
| IconButton | Button(icon) 44pt | IconButton 48dp | IconButton |
| TextField | TextField + etiqueta arriba | OutlinedTextField (label fijo arriba) | TextField + InputDecoration |
| Select | Picker(.menu) | ExposedDropdownMenu | DropdownMenu |
| Checkbox / Radio / Switch | Toggle(.checkbox) / lista con check / Toggle | Checkbox / RadioButton / Switch | Checkbox / Radio / Switch |
| Slider | Slider | Slider | Slider |
| SegmentedControl | Picker(.segmented) | SingleChoiceSegmentedButtonRow | SegmentedButton |
| Chip | botón cápsula | FilterChip / InputChip | FilterChip |
| Card | RoundedRectangle 14 | Card / OutlinedCard | Card |
| ListItem / List | List(.insetGrouped) | ListItem en LazyColumn | ListTile |
| Tabs | TabView superior / segmented | TabRow | TabBar |
| AppBar | NavigationStack toolbar | TopAppBar | AppBar |
| BottomNav | TabView | NavigationBar | NavigationBar |
| Dialog | .alert / .confirmationDialog | AlertDialog | AlertDialog |
| BottomSheet | .sheet(detents) | ModalBottomSheet | showModalBottomSheet |
| Toast | banner propio | Snackbar | SnackBar |
| ProgressBar / Ring | ProgressView | LinearProgressIndicator / Circular | LinearProgressIndicator |
| Skeleton | .redacted(.placeholder) + shimmer | placeholder shimmer | shimmer |
| Fab | botón flotante | FloatingActionButton | FloatingActionButton |

## Unidades y detalles

- 1px web = 1pt iOS = 1dp Android (texto en sp). Objetivo táctil 44pt / 48dp.
- Fuentes: incluye Figtree y Urbanist (OFL) en la app (`fonts/`). Con licencia de Proxima Nova, sustitúyelas en el tema.
- Cifras tabulares: `font-variant-numeric: tabular-nums` · `.monospacedDigit()` · `fontFeatureSettings = "tnum"` · `FontFeature.tabularFigures()`.
- Safe areas: barras superiores e inferiores suman el inset del sistema a su padding.
- Tema: sigue al sistema por defecto y permite elegir en ajustes.

## Landing y sitios públicos

El sistema es la base también para web pública: usa `crece-tokens.css` (o el preset de Tailwind), la tipografía `display` para titulares, `SignatureImage` como imagen principal (la esquina firma), `Button accent` para el CTA único y los mismos patrones de contenido. No hay componentes exclusivos de landing: se componen con Card, Overline, Button, Accordion, Stat, etc.


---

# Accesibilidad

Objetivo: WCAG 2.2 AA en web, y las guías equivalentes de iOS y Android.

- **Contraste:** texto ≥ 4.5:1 (≥ 3:1 desde 24px o 19px bold); bordes de control, íconos con significado y foco ≥ 3:1. Verificado en ambos temas para los pares documentados en cada token.
- **Foco visible:** outline 3px `focus`, offset 2px, en todo lo interactivo; nunca `outline: none` sin reemplazo.
- **Objetivos táctiles:** ≥ 44pt / 48dp, con 8px entre objetivos.
- **Color nunca solo:** estados con texto/ícono; gráficas con leyenda y etiquetas; paleta de datos validada para daltonismo.
- **Texto escalable:** soporta Dynamic Type / escala de fuente hasta 200% sin cortar contenido; nada de alturas fijas en contenedores de texto.
- **Semántica:** roles nativos (`button`, `dialog`, `tablist`, `radiogroup`, `switch`, `progressbar`), etiquetas en todos los campos, `aria-live` en cifras que cambian.
- **Movimiento:** respeta «reducir movimiento»; nada parpadea más de 3 veces por segundo.
- **Formularios:** errores específicos junto al campo y anunciados; no borres lo escrito al fallar.
- **Tiempo:** sesiones que expiran avisan y permiten extender; los códigos OTP muestran cuenta regresiva.
- **Lectores de pantalla:** montos se leen completos («doce mil cuatrocientos ochenta quetzales con cincuenta»); saldos ocultos anuncian «saldo oculto».


---

# Dominio: crédito y ahorro cooperativo

Reglas de negocio que las pantallas representan. Valores de ejemplo pendientes de validación por CRECE: sirven para diseñar, no son política.

## Estados de una solicitud

`Prospecto` → `Expediente` → `Evaluación` → `En revisión` → `Aprobada` | `Rechazada`; `En corrección` devuelve desde En revisión. Tonos de `Badge`: Prospecto neutral · Expediente/Evaluación info · En revisión/En corrección warning · Aprobada success · Rechazada danger.

## Roles

| Rol | Puede |
|---|---|
| Asesor financiero / Jefe de Agencia | Crear expediente, evaluar, gestionar documentos, enviar a revisión (Jefe: también devolver) |
| Asistente administrativa | Registrar documentos en estados no resueltos |
| Gerencia | Hasta el umbral (ej. Q50,000): devolver, aprobar, rechazar |
| Consejo de Administración | Sobre el umbral: devolver o votar (3 integrantes, 2 votos coincidentes) |
| Comisión de Vigilancia | Solo consulta |

Toda transición exige justificación (≥ 10 caracteres) y queda en la bitácora (`Timeline`).

## Documentos por garantía

Base: identificación, comprobante de ingresos, comprobante de domicilio. **Fiduciaria** + documentación del fiador · **Hipotecaria** + documentación de la propiedad y avalúo · **Prendaria** + documentación del bien.

## Cálculo de cuota

Cuota nivelada sobre saldo, `i = tasaAnual / 1200`, `cuota = P·i / (1 − (1+i)^−n)` (si `i = 0`, `P/n`). La última cuota ajusta el saldo. `Crece.calculateLoan(P, n, tasa)`. Ejemplo: tasa 18%, Q3,000–Q150,000, plazos 12–60 meses. Indicadores de evaluación (referencia, nunca aprueban): ingreso disponible, cuota/ingreso (alerta > 35%), cobertura de garantía.

## Productos base

Crédito para tus metas (HandCoins) · Ahorro con propósito (PiggyBank) · Ahorro a plazo fijo (ChartLineUp) · Metas de ahorro (Target).


---

# Tokens (referencia completa)

## Color

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `blue-50` | #f3f7fb | #f3f7fb | Escala azul CRECE; 700 es el azul oficial del manual. |
| `blue-100` | #eaf2f9 | #eaf2f9 | Primitivo blue 100. |
| `blue-200` | #cfe0f1 | #cfe0f1 | Primitivo blue 200. |
| `blue-300` | #b5d4ff | #b5d4ff | Primitivo blue 300. |
| `blue-400` | #90bffc | #90bffc | Primitivo blue 400. |
| `blue-500` | #4d8fd6 | #4d8fd6 | Primitivo blue 500. |
| `blue-600` | #07569c | #07569c | Primitivo blue 600. |
| `blue-700` | #034381 | #034381 | Primitivo blue 700. |
| `blue-800` | #103b64 | #103b64 | Primitivo blue 800. |
| `blue-900` | #0b2a4a | #0b2a4a | Primitivo blue 900. |
| `blue-950` | #071c33 | #071c33 | Primitivo blue 950. |
| `orange-50` | #fff5e8 | #fff5e8 | Escala naranja CRECE; 500 es el naranja oficial del manual. |
| `orange-100` | #fde8cc | #fde8cc | Primitivo orange 100. |
| `orange-200` | #f9d19c | #f9d19c | Primitivo orange 200. |
| `orange-300` | #f2b969 | #f2b969 | Primitivo orange 300. |
| `orange-400` | #f2a955 | #f2a955 | Primitivo orange 400. |
| `orange-500` | #e8973c | #e8973c | Primitivo orange 500. |
| `orange-600` | #d17f22 | #d17f22 | Primitivo orange 600. |
| `orange-700` | #b86b0e | #b86b0e | Primitivo orange 700. |
| `orange-800` | #945512 | #945512 | Primitivo orange 800. |
| `orange-900` | #6b3d0f | #6b3d0f | Primitivo orange 900. |
| `orange-950` | #382c1e | #382c1e | Primitivo orange 950. |
| `neutral-0` | #ffffff | #ffffff | Neutros con sesgo azul para tema claro; 950 es el gris oficial del manual (#363636). |
| `neutral-50` | #f6f8fb | #f6f8fb | Primitivo neutral 50. |
| `neutral-100` | #eef2f6 | #eef2f6 | Primitivo neutral 100. |
| `neutral-200` | #dce5ed | #dce5ed | Primitivo neutral 200. |
| `neutral-300` | #c3cfdb | #c3cfdb | Primitivo neutral 300. |
| `neutral-400` | #94a9bb | #94a9bb | Primitivo neutral 400. |
| `neutral-500` | #6f8193 | #6f8193 | Primitivo neutral 500. |
| `neutral-600` | #586b7e | #586b7e | Primitivo neutral 600. |
| `neutral-700` | #4d6072 | #4d6072 | Primitivo neutral 700. |
| `neutral-800` | #283949 | #283949 | Primitivo neutral 800. |
| `neutral-900` | #1b2a38 | #1b2a38 | Primitivo neutral 900. |
| `neutral-950` | #363636 | #363636 | Primitivo neutral 950. |
| `night-100` | #e4edf6 | #e4edf6 | Superficies y textos del tema oscuro. |
| `night-200` | #c0cedd | #c0cedd | Primitivo night 200. |
| `night-300` | #a7b8ca | #a7b8ca | Primitivo night 300. |
| `night-500` | #5a7189 | #5a7189 | Primitivo night 500. |
| `night-600` | #34485c | #34485c | Primitivo night 600. |
| `night-700` | #20374f | #20374f | Primitivo night 700. |
| `night-800` | #192a3d | #192a3d | Primitivo night 800. |
| `night-850` | #142234 | #142234 | Primitivo night 850. |
| `night-900` | #101c2a | #101c2a | Primitivo night 900. |
| `night-950` | #0b1520 | #0b1520 | Primitivo night 950. |
| `green-50` | #eaf6ef | #eaf6ef | Escala de éxito. |
| `green-100` | #cfeadb | #cfeadb | Primitivo green 100. |
| `green-300` | #95d2b1 | #95d2b1 | Primitivo green 300. |
| `green-500` | #3a9468 | #3a9468 | Primitivo green 500. |
| `green-700` | #24714f | #24714f | Primitivo green 700. |
| `green-800` | #1b5a3e | #1b5a3e | Primitivo green 800. |
| `red-50` | #fcecec | #fcecec | Escala de error/peligro. |
| `red-100` | #f8d5d5 | #f8d5d5 | Primitivo red 100. |
| `red-300` | #ff9f9f | #ff9f9f | Primitivo red 300. |
| `red-500` | #cc4a4d | #cc4a4d | Primitivo red 500. |
| `red-700` | #a22d30 | #a22d30 | Primitivo red 700. |
| `red-800` | #7f2225 | #7f2225 | Primitivo red 800. |
| `crece-blue` | #034381 | #034381 | Azul oficial del manual. Identidad fija (logo, piezas de marca, splash). En UI usa `brand`. |
| `crece-orange` | #e8973c | #e8973c | Naranja oficial del manual (la «G» del símbolo). Identidad fija. En UI usa `accent`. |
| `crece-gray` | #363636 | #363636 | Gris oficial del manual. Impresos y logo a una tinta. |
| `bg-canvas` | #ffffff | #101c2a | Fondo base de pantalla/documento. |
| `bg-subtle` | #f3f7fb | #192a3d | Fondo alterno: secciones, shell de apps, cabeceras de tabla, contenedor de segmentados. |
| `bg-surface` | #ffffff | #142234 | Superficies: tarjetas, paneles, inputs, barras de navegación. |
| `bg-raised` | #ffffff | #1c2e43 | Superficies elevadas sobre otras: diálogos, bottom sheets, menús, tooltips claros. |
| `bg-muted` | #eaf2f9 | #20374f | Tinte de marca: contenedores de ícono, ítem activo, resaltados, alerta info. |
| `bg-accent-subtle` | #fff5e8 | #382c1e | Tinte cálido: destacados de ahorro/metas, hover de accesos. Uso puntual. |
| `bg-inverse` | #103b64 | #e4edf6 | Fondo invertido: toasts/snackbars, tooltips. |
| `bg-brand-strong` | #034381 | #0b2a4a | Bloques de marca de alto impacto: tarjeta de saldo, splash, cabecera hero de app. |
| `border-default` | #dce5ed | #34485c | Bordes y divisores de 1px. Decorativo: no carga significado solo. |
| `border-strong` | #7b8ea1 | #6b8299 | Borde de controles (inputs en hover, checkbox, radio). ≥3:1 sobre `bg-surface`. |
| `text-primary` | #103b64 | #e4edf6 | Titulares, etiquetas, valores. Sobre `bg-canvas`, `bg-surface`, `bg-subtle`, `bg-muted`. |
| `text-body` | #4d6072 | #c0cedd | Texto corrido. Sobre `bg-canvas`, `bg-surface`, `bg-subtle`. |
| `text-secondary` | #586b7e | #a7b8ca | Ayudas, metadatos, placeholders, captions. ≥4.5:1 sobre `bg-canvas`, `bg-surface`, `bg-subtle`. |
| `text-disabled` | #94a9bb | #5a7189 | Texto de controles deshabilitados (exento de contraste por WCAG). |
| `text-inverse` | #ffffff | #103b64 | Texto sobre `bg-inverse`. |
| `text-on-brand-strong` | #ffffff | #e4edf6 | Texto sobre `bg-brand-strong` y fotografía oscurecida. |
| `brand` | #034381 | #90bffc | Acción principal y énfasis: botón primario, enlaces, íconos activos, cifras destacadas, foco de selección. |
| `brand-hover` | #07569c | #b5d4ff | Hover del primario. |
| `brand-pressed` | #103b64 | #cfe0f1 | Estado presionado del primario. |
| `on-brand` | #ffffff | #11243a | Texto/ícono sobre `brand`. |
| `accent` | #e8973c | #e8973c | Acento cálido de uso medido: CTA destacado (uno por pantalla), FAB, indicadores de novedad, progreso de metas, pulgar de slider. |
| `accent-hover` | #f2a955 | #f2b969 | Hover del acento. |
| `on-accent` | #223345 | #223345 | Texto sobre `accent` (6.3:1). Nunca blanco sobre naranja. |
| `success` | #24714f | #95d2b1 | Éxito: aprobado, pagado, completado. Siempre con ícono o palabra. |
| `success-bg` | #eaf6ef | #1d3b31 | Fondo de badge/alerta de éxito. |
| `warning` | #945512 | #f3bd79 | Atención: en revisión, pendiente, vence pronto. |
| `warning-bg` | #fff5e8 | #3a2d1c | Fondo de badge/alerta de atención. |
| `danger` | #a22d30 | #ff9f9f | Error, rechazo, acción destructiva, mora. |
| `danger-bg` | #fcecec | #3d2226 | Fondo de badge/alerta de error. |
| `info` | #034381 | #90bffc | Información neutra (alias funcional de brand). |
| `info-bg` | #eaf2f9 | #20374f | Fondo de alerta informativa. |
| `focus` | #b86b0e | #f2b969 | Anillo de foco: 3px sólido, offset 2–4px. ≥3:1 sobre todas las superficies. |
| `overlay` | #071c3d80 | #02070dcc | Velo tras diálogos, sheets y drawers. |
| `skeleton` | #eef2f6 | #20374f | Base del skeleton loader. |
| `skeleton-shine` | #f6f8fb | #2a4561 | Brillo animado del skeleton. |
| `chart-1` | #2f6db3 | #4a8bd4 | Serie categórica 1 (azul). Orden fijo, validado para daltonismo. |
| `chart-2` | #e8973c | #c97a26 | Serie 2 (naranja). Bajo 3:1 en claro: exige etiqueta directa o tabla. |
| `chart-3` | #1f9a8a | #1d9483 | Serie 3 (verde azulado). |
| `chart-4` | #8a5a9e | #a57ccc | Serie 4 (violeta). |
| `chart-5` | #6a9b3c | #6f9f43 | Serie 5 (verde hoja). |
| `chart-6` | #d0568a | #d0628f | Serie 6 (rosa). Más de 6 series: agrupa en «Otros». |
| `chart-grid` | #eef2f6 | #20374f | Líneas de grilla de gráficas. |

## Tipografía

| Estilo | Familia | Tamaño/Interlineado | Peso | Tracking | Uso |
|---|---|---|---|---|---|
| `display-lg` | display | 56px/60px | 800 | -0.04em | Portadas y momentos de marca (splash, onboarding, web). Máx. 1 por pantalla. Móvil: 40. |
| `display-md` | display | 44px/48px | 800 | -0.04em | Encabezado principal de página web. Móvil: 34. |
| `display-sm` | display | 36px/40px | 800 | -0.035em | Título de pantalla destacado en app (onboarding, éxito). |
| `headline-lg` | display | 30px/36px | 750 | -0.03em | Título de página en web app; título grande de pantalla móvil. |
| `headline-md` | display | 24px/30px | 750 | -0.025em | Título de sección, diálogo grande, bottom sheet. |
| `headline-sm` | display | 20px/26px | 700 | -0.02em | Subsección, título de tarjeta principal. |
| `title-lg` | sans | 18px/24px | 700 | -0.01em | Título de tarjeta, app bar móvil, encabezado de panel. |
| `title-md` | sans | 16px/22px | 650 | 0 | Título de ítem de lista, nombre, fila destacada. |
| `title-sm` | sans | 14px/20px | 650 | 0 | Título compacto (tablas, listas densas). |
| `body-lg` | sans | 18px/28px | 400 | 0 | Texto introductorio, lectura cómoda. |
| `body-md` | sans | 16px/24px | 400 | 0 | Texto por defecto en todas las plataformas. |
| `body-sm` | sans | 14px/20px | 400 | 0 | Texto secundario, descripciones de ítem, tablas. |
| `caption` | sans | 12px/16px | 500 | 0.01em | Metadatos, fechas, leyendas. Mínimo absoluto de texto. |
| `label-lg` | sans | 16px/20px | 650 | -0.005em | Botón grande (móvil, CTA). |
| `label-md` | sans | 14px/18px | 650 | -0.005em | Botón por defecto, tabs, segmentados, campos (etiqueta). |
| `label-sm` | sans | 12px/16px | 650 | 0.01em | Badges, chips, contadores. |
| `overline` | sans | 11px/16px | 700 | 0.14em | Antetítulo en MAYÚSCULAS. Único uso de mayúsculas sostenidas. |
| `amount-xl` | sans | 40px/44px | 750 | -0.03em | Saldo principal, cuota estimada. Tabular. |
| `amount-lg` | sans | 28px/32px | 750 | -0.02em | KPI, monto de tarjeta. |
| `amount-md` | sans | 18px/24px | 700 | -0.01em | Montos en listas y movimientos. Tabular. |

## spacing

| Token | Valor | Uso |
|---|---|---|
| `space-0` | 0px | Sin espacio. |
| `space-half` | 2px | Ajustes ópticos, separación de segmentos en gráficas. |
| `space-1` | 4px | Gap mínimo (ícono–badge, chips internos). |
| `space-2` | 8px | Gap entre ícono y texto; padding de chips. |
| `space-3` | 12px | Gap de controles agrupados; padding vertical de ítems compactos. |
| `space-4` | 16px | Margen lateral móvil; padding de tarjeta compacta; gap de formulario. |
| `space-5` | 20px | Padding de tarjeta; gap de grilla móvil. |
| `space-6` | 24px | Padding de panel/diálogo; margen lateral tablet. |
| `space-8` | 32px | Separación entre grupos; margen lateral laptop. |
| `space-10` | 40px | Separación entre bloques de pantalla. |
| `space-12` | 48px | Margen lateral escritorio; separación de secciones en app web. |
| `space-16` | 64px | Secciones amplias (web). |
| `space-20` | 80px | Ritmo vertical de sección web (tablet). |
| `space-24` | 96px | Ritmo vertical de sección web (escritorio). |

## radius

| Token | Valor | Uso |
|---|---|---|
| `radius-none` | 0px | Tablas y bordes a sangre. |
| `radius-xs` | 4px | Badges, marcas de gráficas (extremos de barra), tooltips pequeños. |
| `radius-sm` | 8px | Chips, checkbox, inputs compactos, ítems de menú. |
| `radius-md` | 10px | Botones, inputs, segmentados. El radio de control de CRECE. |
| `radius-lg` | 14px | Tarjetas, contenedores de ícono grandes, alertas. |
| `radius-xl` | 20px | Paneles, tarjeta de saldo, bottom sheets (esquinas superiores). |
| `radius-2xl` | 28px | Diálogos grandes, imágenes destacadas, marcos de dispositivo. |
| `radius-signature` | 100px | FIRMA: una sola esquina (inferior derecha) muy redondeada en imágenes o bloques de marca. Eco de la «C» que abraza la «G». Máx. 1 por pantalla. |
| `radius-full` | 9999px | Avatares, pills, switches, FAB, indicadores. |

## shadow

| Token | Valor | Uso |
|---|---|---|
| `elevation-0` | none | Superficies planas; se separan con `border-default`. |
| `elevation-1` | 0 1px 2px #1645770f, 0 1px 3px #16457714 / 0 1px 2px #0000004d | Tarjetas interactivas en reposo, chips seleccionados, tab activo. |
| `elevation-2` | 0 6px 16px #1645771a / 0 6px 16px #00000059 | Hover de tarjetas, menús, tooltips, barras fijas. |
| `elevation-3` | 0 16px 50px #16457724 / 0 16px 50px #00000073 | Popovers grandes, bottom sheets, calculadoras flotantes. |
| `elevation-4` | 0 30px 100px #071b3547 / 0 30px 100px #0000008c | Diálogos modales. |
| `shadow-brand` | 0 8px 24px #03438133 / 0 8px 24px #00000066 | FAB y CTA flotante sobre contenido. |

## duration

| Token | Valor | Uso |
|---|---|---|
| `duration-instant` | 80ms | Cambios de color en press, toggles. |
| `duration-fast` | 150ms | Hover, foco, aparición de tooltip. |
| `duration-base` | 220ms | Transiciones estándar: tabs, acordeón, switch, botón. |
| `duration-slow` | 320ms | Diálogos, sheets, drawers, toasts. |
| `duration-slower` | 500ms | Transiciones de pantalla, progreso, conteo de cifras. |
| `duration-reveal` | 750ms | Entradas de contenido escalonadas. |
| `stagger-step` | 60ms | Retraso entre elementos de una lista al entrar. |

## easing

| Token | Valor | Uso |
|---|---|---|
| `ease-brand` | cubic-bezier(0.22, 0.68, 0, 1.03) | Curva de marca con leve rebote: entradas, elementos que «crecen». |
| `ease-standard` | cubic-bezier(0.2, 0, 0, 1) | Movimientos dentro de pantalla. |
| `ease-enter` | cubic-bezier(0, 0, 0.2, 1) | Elementos que entran (desaceleran). |
| `ease-exit` | cubic-bezier(0.4, 0, 1, 1) | Elementos que salen (aceleran). |

## opacity

| Token | Valor | Uso |
|---|---|---|
| `opacity-disabled` | 0.48 | Controles deshabilitados. |
| `opacity-hover` | 0.08 | Capa de hover sobre superficies (state layer). |
| `opacity-pressed` | 0.14 | Capa de press. |
| `opacity-accent-outline` | 0.65 | Contorno naranja decorativo de marca. |

## size

| Token | Valor | Uso |
|---|---|---|
| `touch-min` | 44px | Objetivo táctil mínimo (iOS HIG). Todo lo tocable. |
| `touch-comfy` | 48px | Objetivo táctil recomendado (Material). |
| `control-sm` | 36px | Botón/inputs compactos (solo web densa). |
| `control-md` | 44px | Alto por defecto de botón e input. |
| `control-lg` | 52px | Botón grande / CTA móvil. |
| `icon-xs` | 16px | Íconos en badges y texto pequeño. |
| `icon-sm` | 20px | Íconos en botones e inputs. |
| `icon-md` | 24px | Íconos de navegación y listas (defecto). |
| `icon-lg` | 32px | Íconos destacados en tarjetas. |
| `icon-xl` | 48px | Estados vacíos, éxito. |
| `avatar-sm` | 32px | Avatar en listas densas. |
| `avatar-md` | 40px | Avatar por defecto. |
| `avatar-lg` | 56px | Perfil, expediente. |
| `appbar-mobile` | 56px | Alto de app bar móvil (sin safe area). |
| `bottomnav` | 64px | Alto de barra inferior (sin safe area). |
| `topbar-web` | 64px | Alto de barra superior web. |
| `sidebar` | 256px | Ancho de sidebar web. |
| `content-max` | 1240px | Ancho máximo de contenido web. |

## borderWidth

| Token | Valor | Uso |
|---|---|---|
| `border-hairline` | 1px | Bordes y divisores. |
| `border-strong` | 2px | Selección (tarjetas de opción), contorno de marca. |
| `border-focus` | 3px | Anillo de foco. |

## zIndex

| Token | Valor | Uso |
|---|---|---|
| `z-base` | 0 | Contenido. |
| `z-sticky` | 20 | Barras fijas. |
| `z-fab` | 30 | FAB. |
| `z-drawer` | 40 | Sidebar/drawer. |
| `z-overlay` | 50 | Velo. |
| `z-modal` | 60 | Diálogos y sheets. |
| `z-toast` | 100 | Toasts. |

## breakpoint

| Token | Valor | Uso |
|---|---|---|
| `bp-sm` | 480px | Móvil grande. |
| `bp-md` | 768px | Tablet: 2 columnas. |
| `bp-lg` | 1024px | Laptop: sidebar fija. |
| `bp-xl` | 1280px | Escritorio. |
| `bp-2xl` | 1536px | Pantallas amplias. |

