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
