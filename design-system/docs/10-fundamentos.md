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
