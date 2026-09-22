# DESIGN.md — CRECE Guatemala R.L.

Identidad visual para interfaces del sistema de evaluación.

## 1. Filosofía del logotipo

- Las letras **C** de CRECE y **G** de Guatemala: la C contiene la G — cuidado e impulso a guatemaltecos con confianza constante.

## 2. Paleta

| Rol | HEX | Uso |
|-----|-----|-----|
| Primario (azul) | `#034381` | Marca, headers, acciones principales |
| Secundario (naranja) | `#e8973c` | Acentos, deltas, folder identidad en mapas de proceso |
| Complementario (gris) | `#363636` | Texto secundario |

## 3. Tipografía corporativa

- **CRECE:** Proxima Nova Alt Extrabold
- **GUATEMALA R.L.:** Proxima Nova Alt Bold
- **UI del sistema (bootstrap):** Geist en web; Proxima solo en piezas de marca cuando se integre imagotipo.

## 4. Reglas de marca

- Respetar área de reserva ~10% alrededor del logotipo.
- No distorsionar, recolorear arbitrariamente ni cambiar tipografías oficiales del imagotipo.

## 5. Tokens UI (objetivo)

En implementaciones futuras de `@crece/ui` o tema global:

| Token | Claro | Notas |
|-------|-------|-------|
| `--crece-primary` | `#034381` | Botones, navegación |
| `--crece-secondary` | `#e8973c` | Acento |
| Motion “mágica” (glow, beam) | — | **Solo** superficies de asistencia IA; resto estático |

Referencia de folders en dominio: naranja = identidad, azul = operación, natural = custodia.
