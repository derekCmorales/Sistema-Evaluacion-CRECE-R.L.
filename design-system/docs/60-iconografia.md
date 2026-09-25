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
