# DESIGN.md — CRECE Guatemala R.L.

> **Guía madre y única de la UI:** [`design-system/`](./design-system/README.md).
> Todo lo visual (color, tipografía, espacio, forma, movimiento, íconos, componentes, patrones, pantallas, voz y accesibilidad) se decide ahí. Este archivo solo orienta; si algo aquí contradice a `design-system/`, **gana `design-system/`**.

## Origen

- Copia versionada del design system **«CRECE Guatemala»** publicado en Claude Design: <https://claude.ai/artifact/MXSABFH2UH1kCRqA6bco4j> (versión `1790212100-e2b4`, última edición 2026-09-24).
- La fuente de verdad editable es Claude Design. Para actualizar: volver a jalar los archivos de `project/` del artifact a `design-system/` en un PR propio. **No editar `design-system/` a mano** (los archivos de `assets/Platforms/` y `components/bundle.*` son generados).

## Mapa de lectura

| Necesito… | Leer |
|-----------|------|
| Principios, uso y qué NO hacer | [`design-system/README.md`](./design-system/README.md) |
| Todo en un solo archivo (contexto para agentes) | [`design-system/assets/Docs/DESIGN.md`](./design-system/assets/Docs/DESIGN.md) |
| Color, tipografía, espacio, forma, elevación | [`design-system/docs/10-fundamentos.md`](./design-system/docs/10-fundamentos.md) · [`tokens.json`](./design-system/tokens.json) |
| Catálogo de 73 componentes | [`design-system/docs/20-componentes.md`](./design-system/docs/20-componentes.md) · `design-system/components/<Comp>/README.md` |
| Formularios, estados, acciones sensibles, dinero | [`design-system/docs/30-patrones.md`](./design-system/docs/30-patrones.md) |
| Pantallas de referencia (web y móvil) | [`design-system/docs/40-pantallas.md`](./design-system/docs/40-pantallas.md) |
| Movimiento | [`design-system/docs/50-movimiento.md`](./design-system/docs/50-movimiento.md) |
| Iconografía (Phosphor) | [`design-system/docs/60-iconografia.md`](./design-system/docs/60-iconografia.md) |
| Contenido y voz (es-GT) | [`design-system/docs/70-contenido-y-voz.md`](./design-system/docs/70-contenido-y-voz.md) |
| Tokens por plataforma (CSS, Tailwind, RN, Flutter, SwiftUI, DTCG) | [`design-system/docs/80-plataformas.md`](./design-system/docs/80-plataformas.md) · `design-system/assets/Platforms/` |
| Accesibilidad | [`design-system/docs/85-accesibilidad.md`](./design-system/docs/85-accesibilidad.md) |
| Dominio de crédito | [`design-system/docs/90-dominio-credito.md`](./design-system/docs/90-dominio-credito.md) |

## Reglas para `apps/web`

1. Consumir **solo tokens semánticos** (`bg-surface`, `text-primary`, `brand`, `accent`, `success`…). Nada de hex sueltos ni primitivos (`blue-700`) en pantallas.
2. Para web: `design-system/assets/Platforms/crece-tokens.css` (variables, temas claro/oscuro, `@font-face`) y `tailwind.preset.js`. Fuentes empaquetadas en `design-system/fonts/` (Urbanist para `display`, Figtree para `sans`; licencia OFL).
3. Antes de crear un componente, buscarlo en el catálogo; si no existe, componerlo con los existentes y los tokens.
4. Textos de UI en español (es-GT), según «Contenido y voz».

## Reglas propias de este sistema (complementan, no contradicen)

- **IA no decide:** ningún componente muestra puntaje, banda de riesgo ni «recomendado: aprobar» (ver `AGENTS.md`).
- Motion “mágica” (glow, beam) **solo** en superficies de asistencia IA; el resto sigue `50-movimiento.md`.
- Colores de folder en mapas de proceso: naranja = identidad, azul = operación, natural = custodia.

## Qué no está en el repo

Los binarios del asset store de Claude Design — logos (PNG), capturas de pantallas (PNG), fotografías (WebP), manual de marca (PDF) y los 147 íconos SVG — **no se copian** (política del repo: sin imágenes nuevas). Se consultan en el artifact; en código los íconos vienen del paquete Phosphor y el logo se integrará cuando exista su change OpenSpec.
