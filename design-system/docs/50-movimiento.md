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
