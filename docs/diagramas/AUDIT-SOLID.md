# Auditoría de diagramas — SOLID y principios de arquitectura

**Proyecto:** CRECE — Documento 1 Memoria  
**Fecha:** 17 sep 2026 (GT, UTC-6)  
**Alcance:** diagramas en `/workspace/crece/diagrams/` alineados a sources de `domain-src/`, `application-src/`, `schema.prisma`, CONTEXT/AGENTS/SCREENS.

**Leyenda Pass/Fail:** utilidad para Entrega 1 (comunicar diseño), no “cumplimiento perfecto de DDD”.

---

## 01 / 01a / 01b — Casos de uso

### Propósito
Mostrar actores reales (RBAC CONTEXT §7 + Público landing) y casos de uso del sitio y del sistema interno, con stick figures UML (sin emojis).

### Principios que soporta
- **SoC / límites de sistema:** rectángulo de frontera Landing+Gestión.
- **ISP (roles):** asociaciones solo donde el rol participa (p. ej. Vigilancia → bitácora; Consejo → voto ≥ umbral).
- **SRP (a nivel de caso de uso de negocio):** un óvalo ≈ una intención de usuario.

### Fidelidad al repo
- Actores: CONTEXT §7 (siete roles) + Público.
- UC de prospecto: `createProspectFromPublicForm` (`application-src/use-cases.ts`).
- Bifurcación umbral: `requiresCouncilApproval` / `getCouncilThreshold` (`verdict-policy.ts`, use-cases).
- Nota IA: ports `ILlmAssistant` — asistencia, no decisión (AGENTS anti-objetivos).

### Debilidades / provisional
- Vista 01b sigue densa (cruce de líneas); se mitiga con 01a/01b.
- CMS de contenidos de landing exigido por Lineamientos no está modelado como UC propio (hueco SCREENS vs Lineamientos).
- «Observar/devolver» y «paquete IVE» se apoyan en SCREENS/CONTEXT; no todos tienen función exportada homónima en el extracto de use-cases.

### Pass/Fail
**Pass** para Entrega 1 (UML legible, actores stick-figure, split + overview).

---

## 02 — Actividades (flujo)

### Propósito
Flujo Prospecto → decisión con bifurcación Gerencia/Consejo y retorno.

### Principios
- **SoC del proceso de negocio** vs UI.
- Complementa secuencias (02 = control-flow; 06–08 = mensajería).

### Fidelidad
Alineado a CONTEXT §8 y estados `operation-state-machine.ts` (DRAFT…PACKAGED). Mantiene umbral ref. Q100,000.

### Debilidades
- DOT legacy (no PlantUML); visual aceptable.
- No detalla OCR/confirmación humana ni semáforo de pipeline.

### Pass/Fail
**Pass** (conservado; sin fix obligatorio).

---

## 03 — MER

### Propósito
Modelo entidad-relación inicial desde `schema.prisma`.

### Principios
- **Persistencia ≠ dominio** (debe leerse junto a figura 12 y la auditoría).
- Cohesión de datos del MVP.

### Fidelidad
Modelos User, Person, Operation, DocumentAsset, DecisionLogEntry, etc. coinciden con `schema.prisma`.

### Debilidades
- Omite algunos modelos (Notification, WatchlistCheck, ChecklistTemplate) o los resume.
- Campos `*Json` ocultan estructura (ver §12).

### Pass/Fail
**Pass** con salvedad de “modelo de datos, no entidades puras”.

---

## 04 — Arquitectura de contenedores

### Propósito
Landing :3001, web :3000, packages domain/application/infrastructure/shared.

### Principios
- **Clean Architecture / dependency rule** a nivel de contenedores.
- **DIP:** infra detrás de ports.

### Fidelidad
README-MVP / AGENTS estructura de carpetas; contrato Landing→API prospects.

### Debilidades
- “Futuro prod” (R2, OCR, Gemini) es proyección, no código actual.
- No muestra workers/colas (no existen en MVP).

### Pass/Fail
**Pass**.

---

## 05 — Capas SOLID

### Propósito
UI → application → domain ← infrastructure.

### Principios
- **DIP, SRP de capas, dependency rule.**

### Fidelidad
Coincide con packages y con `UseCaseDeps` + ports en `ports.ts`.

### Debilidades
- Esquema conceptual; no lista cada port.
- No evidencia tests con fakes (LSP) en el diagrama.

### Pass/Fail
**Pass**.

---

## 06 — Secuencia flujo completo

### Propósito
Mensajes Asesor → Sistema → MotorCalculo → AsistenciaIA → Gerencia/Consejo → Bitácora, con alt umbral.

### Principios
- **DIP:** dominio (MotorCalculo, VerdictPolicy implícita) llamado desde application.
- **SRP:** cálculo y reglas separadas de orquestación.
- **IA no decide** (opt/nota + puerto `ILlmAssistant`).

### Fidelidad
`createOperation`, `saveFinancialAssessment`, `submitForReview`, `castVerdict`, `calculateCreditMetrics`, `evaluateHardRules`, `requiresCouncilApproval`, `decisionLog.append` — citados en sources.

### Debilidades
- `AsistenciaIA` como participante es el **port** / stub; el cableado concreto LLM puede ser futuro.
- No muestra todos los estados intermedios (READY_FOR_REVIEW detallado sí; PACKAGED no).
- Participante “Sistema (application)” agrupa muchos use cases (aceptable para overview).

### Pass/Fail
**Pass** (crítico para Entrega 1).

---

## 07 — Secuencia prospecto landing

### Propósito
Público → Landing → API → `createProspectFromPublicForm` → Person PROSPECT.

### Principios
- **SoC** público vs interno.
- Validación en frontera (consentimiento).

### Fidelidad
`createProspectFromPublicForm` + `IPersonRepository.create` + `PROSPECT_CREATED` en decisionLog; AGENTS §9.

### Debilidades
- Rate-limit/honeypot son supuestos de AGENTS/seguridad, no verificados en el extracto TS.
- `operationId: "system"` en el log es pragmatic/hack del código actual.

### Pass/Fail
**Pass**.

---

## 08 — Secuencia aprobación

### Propósito
Detalle Gerencia vs Consejo: `canUserCastVerdict`, `resolveFinalDecision`, acta.

### Principios
- **OCP/configuración:** umbral vía `IConfigRepository`, no hardcode de ruta.
- **Reglas de decisión en domain** (`verdict-policy.ts`) — application orquesta.

### Fidelidad
Alta: `castVerdict`, `assertCanApprove`, `APPROVE_WITH_CHANGES` + recálculo, `buildMinutesHtml`, empate → `null` (sigue UNDER_REVIEW).

### Debilidades
- Quórum/empate formal con CRECE sigue `[[PENDIENTE]]` (CONTEXT).
- Rama BRANCH_HEAD en < umbral aparece en policy; producto puede matizar UI.

### Pass/Fail
**Pass**.

---

## 09 — Clases overview (paquetes) — **diseño objetivo**

### Propósito
Contrato Clean Architecture: UI → Application → Domain ← Infrastructure, con DIP explícito.

### Principios que soporta
- **DIP:** el domain define ports (I*); infrastructure implementa.
- **Dependency rule:** ninguna flecha sale del Domain hacia UI/Infra.
- Estereotipos: «entity», «domain service», «use case», «port», «adapter», «persistence model».

### Fidelidad al repo
- Capas alineadas a packages del monorepo (apps/web, apps/landing, domain, application, infrastructure).
- Ports listados desde `ports.ts`.
- Mappers y adapters Prisma son **diseño objetivo** (refactor), no inventarios de clases ya existentes en infra.

### Debilidades / honestidad
- El código MVP aún concentra application en `use-cases.ts`; el diagrama es el **contrato hacia adelante**, no un espejo 1:1 del monolito.

### Pass/Fail
**Pass** como diseño objetivo SOLID para Entrega 1.

---

## 10 — Clases domain — **diseño objetivo (núcleo)**

### Propósito
Modelo táctico rico: entidades, value objects, domain services y ports **sin tipos Prisma**.

### Principios
- **SRP:** CalcEngine ≠ HardRulesEngine ≠ VerdictPolicy ≠ OperationStateMachine ≠ ChecklistResolver.
- **ISP:** ports estrechos (`ILlmAssistant` ≠ `IOcrProvider` ≠ `IDocumentStore` ≠ `IDocumentRenderer`).
- **DIP:** repositorios e ICalcEngine como interfaces en domain.
- **OCP:** ChecklistResolver / HardRulesConfig / IConfigRepository permiten extender sin reescribir use cases.
- Aggregate: `Operation` posee checklist, assessment, calcResult, hardRuleHits, verdicts, aiAssistance; `Person` 1—N `Operation`.

### Fidelidad
Tipos y ports desde `ports.ts`; comportamientos desde `calc-engine.ts`, `hard-rules-engine.ts`, `verdict-policy.ts`, `operation-state-machine.ts`, `checklist-resolver.ts`.
Los domain services se presentan como clases «domain service» aunque el MVP actual sea funcional — **diseño objetivo (refactor)**.

### Debilidades
- MVP aún exporta funciones, no clases OO; el diagrama fija el target.
- `FinancialAssessment` en diagrama = `FinancialAssessmentInput` en calc-engine (mismo VO de negocio).

### Pass/Fail
**Pass** — diseño objetivo denso y fiel a sources.

---

## 11 — Clases application — **diseño objetivo SRP/ISP**

### Propósito
Un caso de uso = una clase con `execute(...)` y deps por constructor (ports estrechos).

### Principios
- **SRP:** `CastVerdict` ≠ `CreatePerson` ≠ `SubmitForReview`.
- **ISP:** cada UC solo declara los ports que usa (no God `UseCaseDeps`).
- **DIP:** depende de abstracciones domain (ports + domain services).
- `UseCaseDeps` se muestra como **«estado actual débil»** (no forever design).

### Fidelidad
Responsabilidades = funciones exportadas de `application-src/use-cases.ts` (`createProspectFromPublicForm`, `createPerson`, `createOperation`, `saveFinancialAssessment`, `markReadyForReview`, `submitForReview`, `castVerdict`, `justifyHardRuleException`, `confirmAiAlert`, `createSavingsOperation`).
`CastVerdict` → VerdictPolicy + IOperationRepository + IDecisionLog + IConfigRepository (threshold), más factores/acta/recálculo según código.

### Debilidades
- Código actual sigue siendo funciones + `UseCaseDeps`; el split a clases es el **refactor contratado** por estos diagramas.

### Pass/Fail
**Pass** para el diseño propuesto; **parcial** en código MVP (honestidad).

---

## 12 — Clases persistencia — **adapters + mappers**

### Propósito
Separar «persistence model» (Prisma `Operation` *Json) del domain `Operation` vía `OperationMapper`.

### Principios
- **DIP / LSP:** `Prisma*Repository` implementan ports; fakes posibles en tests.
- **SoC:** blobs JSON quedan en infra; el domain permanece tipado.
- No se pretende que Prisma IS el dominio.

### Fidelidad
Campos *Json de `schema.prisma` (checklistJson, assessmentJson, calcResultJson, hardRuleHitsJson, verdictsJson, aiAssistanceJson, …).
Adapters nombrados como diseño objetivo (`PrismaOperationRepository`, `LocalOrR2DocumentStore`, `PrismaDecisionLog`, …).

### Debilidades
- Normalización de JSON a tablas = Documento 2 / evolutivo; el mapper es el fix inmediato de diseño.

### Pass/Fail
**Pass** como diseño objetivo de persistencia; documenta deuda *Json sin fingir entidades puras en Prisma.

---

## 14 — Clases antes / después (deuda vs objetivo)

### Propósito
Contraste visual: monolito `use-cases.ts` + UseCaseDeps + *Json vs use cases SRP + ports + mappers.

### Principios
Resume SRP, ISP, DIP en una sola figura de comunicación para Entrega 1.

### Pass/Fail
**Pass** — caption: deuda técnica actual vs diseño objetivo para Entrega 1.

---

## Cumplimiento SOLID / arquitectura (resumen — diseño propuesto vs MVP)

| Principio | Diseño objetivo (diagramas 09–12, 14) | Estado código MVP | Evidencia |
|-----------|--------------------------------------|-------------------|-----------|
| SRP | **Pass** — un UC por clase; motores domain separados | Parcial — domain OK; application monolítica | Figs. 10–11, 14; use-cases.ts |
| OCP | **Pass** — ChecklistTemplate/HardRules/config/factores | Bueno | ChecklistResolver, IConfigRepository, DecisionFactor |
| LSP | **Pass** — ports sustituibles por fakes/adapters | Diseñado (adapters a materializar) | ports.ts; Fig. 12 |
| ISP | **Pass** — ports estrechos por UC | Débil hoy (UseCaseDeps bag) | Fig. 11 vs UseCaseDeps |
| DIP | **Pass** — domain define I*; infra implementa | Bueno en intención | Figs. 09, 12; ports.ts |
| Clean Arch | **Pass** — UI→app→domain←infra | Cumple en packages | Figs. 04, 05, 09 |
| Persistencia | **Pass** con mapper; *Json aislados | Débil sin mapper explícito | schema.prisma; Fig. 12 |
| IA decide | Prohibido | Cumple política | ILlmAssistant; assertCanApprove |

**Conclusión Entrega 1:** los diagramas de clases son el **contrato de arquitectura SOLID** hacia adelante. El MVP ya aporta ports y funciones de domain; falta split SRP de application y mappers de persistencia.

---

## Recomendaciones de mejora (alineadas al diseño objetivo)

1. **Partir `use-cases.ts`** en clases/módulos por UC (CreatePerson, CastVerdict, …) con constructor de ports estrechos — retirar God `UseCaseDeps` como diseño forever.
2. **Introducir OperationMapper / PersonMapper** entre Prisma *Json y entidades domain; luego normalizar JSON críticos en Documento 2 si hace falta.
3. **Materializar adapters** `Prisma*Repository`, `LocalOrR2DocumentStore`, etc., detrás de ports existentes.
4. **Formalizar quórum/empate Consejo** con CRECE y reflejarlo en `VerdictPolicy.resolveFinalDecision`.
5. **UC de CMS landing** cuando se cierre el pendiente Lineamientos vs SCREENS.
6. Mantener caption **«Diseño objetivo (refactor)»** en diagramas de clases hasta que el código alcance el contrato.
7. Añadir secuencia OCR (confirm/correct/discard) en Documento 3/6 si se profundiza asistencia documental.

---

*Auditoría actualizada 17 sep 2026 (GT, UTC-6): diagramas de clases = diseño objetivo SOLID; embeber resumen en Documento-1-Memoria-CRECE.docx § Auditoría de diseño.*

---

## 13 — Estados de Operation

### Propósito
Visualizar ALLOWED_TRANSITIONS del ciclo de vida de la operación de crédito.

### Principios
- **SRP / SoC:** el estado de la operación es independiente de *quién* aprueba (umbral).
- **OCP:** nuevas transiciones se declaran en un solo mapa.
- Fidelidad a máquina de estados explícita (fail-fast con InvalidTransitionError).

### Fidelidad
`operation-state-machine.ts`; use cases `markReadyForReview`, `submitForReview`, `castVerdict`; CONTEXT §8.

### Debilidades
- PACKAGED no tiene función homónima en el extracto de use-cases (cierre post-aprobación SCREENS E/K).
- Empate de Consejo deja UNDER_REVIEW (resolveFinalDecision null) — no es estado aparte.

### Pass/Fail
**Pass** Entrega 1.
