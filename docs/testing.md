# Testing — obligatorio, no opcional

Contrato para humanos y agentes. Un cambio **sin prueba en la capa que toca no entra a `main`**.

Fuente de diagramas: [diagramas/19-testing.md](./diagramas/19-testing.md) (solo Mermaid). Este documento no se sustituye con capturas de pantalla ni con “lo corrí a mano”.

Complementa [`como-trabajar.md`](./como-trabajar.md) y el checklist de [`CONTRIBUTING.md`](../CONTRIBUTING.md).

---

## 1. Por qué siempre

Las reglas de CRECE viven en dominio: transiciones, umbral, una persona una vez, originador que no firma como delegado, factores sin pesos, IA que no vota. Si eso solo se “ve” en la UI, se rompe en silencio.

Por eso:

1. **Toda** tarea de producto declara pruebas en el change OpenSpec (sección Tests de cada spec).
2. **Toda** implementación añade o actualiza esas pruebas **antes** del PR.
3. **Toda** revisión exige `pnpm test` verde. Sin excepciones de “es solo un stub” o “es solo docs de API”: si hay comportamiento, hay aserción.

Lo que **no** cuenta como prueba:

- Una captura o un GIF.
- Un `curl` suelto no documentado ni repetible.
- “Funciona en mi máquina”.
- Confiar en que el Consejo o el asesor lo van a notar.

---

## 2. Pirámide (dónde probar)

La prueba se escribe **en la capa que posee la regla**, no más arriba.

| Capa | Qué cubre siempre | Qué no cubre |
|------|-------------------|--------------|
| `@crece/domain` | Motor, estados, política de autorización, checklist, vigencia, OCR derivado, factores | HTTP, React, Prisma |
| `@crece/application` | RBAC (consultar ≠ operar), orquestación de casos de uso con puertos falsos | Selectores CSS |
| `@crece/shared` | Formato GTQ, tipos/labels si hay lógica | Pantallas |
| `apps/api` | Contrato HTTP, códigos, cuerpo público de prospecto (cuando exista el adaptador) | Fórmulas (eso es dominio) |
| `apps/web` | Recorrido de pantalla **después** de que el dominio ya está verde | Volver a implementar el umbral en el cliente |

Orden de escritura: dominio → application → API → web. Nunca al revés para una regla de crédito.

---

## 3. Qué se prueba siempre (invariantes)

Si un change toca alguno de estos temas, las pruebas correspondientes **deben** existir y pasar. Están nombradas en `openspec/specs/*/spec.md`.

| Tema | Spec | Debe fallar si… |
|------|------|-----------------|
| Persona ≠ operación en landing | person-operations | el prospecto público crea una `Operation` |
| Estados de operación | person-operations | `DRAFT` salta a `APPROVED` |
| Dual firma / quórum | authorization-policy | Q40k cierra con una sola firma; Q150k cierra con 2 de 3 |
| Una persona una vez | authorization-policy | Iván vota dos veces con cargos distintos |
| Originador ≠ delegado/Consejo | authorization-policy | Mario origina y firma como delegado |
| Consultar ≠ operar | rbac | `COUNCIL_MEMBER` crea o edita operación |
| Checklist dinámico | checklist | falta fiador cuando `hasGuarantor`; N/A sin razón |
| Factores sin pesos | decision-factors | aparece `score`, `weight` o “recomendado aprobar” |
| OCR no muta evaluación | ai-assist | un candidato OCR cambia `FinancialAssessment` |
| Capacidad vs garantía | (motor + reglas) | una garantía “salva” capacidad cero |

Cálculo: cuota, capacidad, cobertura, tabla de amortización e `inputsHash`. **Nunca** un puntaje.

---

## 4. Cuándo corre (puerta)

| Momento | Qué tiene que pasar |
|---------|---------------------|
| Mientras se codea la capa | la prueba de esa capa en rojo → verde |
| Antes de `git commit` de comportamiento | `pnpm test` |
| Antes de abrir o actualizar el PR | `pnpm test` + `pnpm lint` + `pnpm build` |
| Al cerrar un change OpenSpec | las Tests de la spec siguen siendo ciertas |
| Al tocar autorización, RBAC o cálculo | las invariantes de la tabla anterior, no solo un caso feliz |

Un PR de **solo documentación** no inventa tests. Un PR que cambia reglas y “deja los tests para después” se rechaza.

---

## 5. Dónde viven (scaffold)

| Paquete | Script | Convención de archivo |
|---------|--------|------------------------|
| `packages/domain` | `pnpm --filter @crece/domain test` | junto al módulo, sufijo `.test.ts` |
| `packages/application` | `pnpm --filter @crece/application test` | igual |
| `packages/shared` | `pnpm --filter @crece/shared test` | igual |
| raíz | `pnpm test` | recorre los paquetes que definen `test` |

Las specs apuntan a esos archivos. Si se mueve un módulo, se actualiza la spec.

API y web aún no tienen runner en el bootstrap: cuando se agreguen, entran a `pnpm test` de raíz. Hasta entonces, un smoke HTTP (`GET /health`, `POST /operations/calc`) **complementa** el dominio; no lo reemplaza.

---

## 6. Cómo se escribe (sin copiar UI)

- Nombres en el idioma del fallo: “no cierra menores con una sola firma”, no `test1`.
- Datos de negocio reconocibles: Don Marco Q40,000 (dual firma); caso ≥ umbral Q150,000 (Consejo).
- Puertos falsos en application; **cero** Nest y **cero** React en domain.
- Prohibido asertar un `score`, `riskBand` o texto “recomendado: aprobar”.
- Prohibido `any` en el boundary de la aserción.

Herramienta actual: Vitest en paquetes puros. No hace falta red ni Postgres para el dominio.

---

## 7. Relación con OpenSpec

Cada spec tiene una sección **Tests**. Al `propose`: listar qué va a fallar hoy y qué debe pasar. Al `apply`: no marcar la tarea hecha si esa lista no está verde. Al `archive`/`sync`: la spec estable sigue nombrando las mismas pruebas.

Si la spec no nombra tests, el change está incompleto.

---

## 8. Anti-patrones

- Probar la cuota en un componente React.
- Mockear el motor para “pasar” el veredicto.
- Un único test e2e que cubre autorización, checklist y cálculo.
- Saltarse tests porque “aún no hay Prisma”.
- Añadir PNG o evidencias visuales en lugar de aserciones.
