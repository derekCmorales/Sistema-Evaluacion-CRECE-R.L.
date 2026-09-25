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
