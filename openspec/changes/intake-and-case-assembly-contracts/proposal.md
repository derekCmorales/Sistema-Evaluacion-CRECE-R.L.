# Proposal: intake-and-case-assembly-contracts

## Why
El proyecto requiere que dos desarrolladores trabajen en simultáneo sobre las Fases 1, 2 y 3 definidas en `instrucciones.txt`. Para evitar dependencias en cascada (que el desarrollador de la Fase 3 deba esperar la persistencia y pantallas de las Fases 1 y 2), se establece una arquitectura guiada por contratos (Contract-First). Esto formaliza los DTOs, entidades de dominio, validadores de casos de uso, mocks/fixtures y adaptadores en memoria para desacoplar el ciclo de desarrollo.

## What
1. **Contratos en `@crece/shared`**:
   - DTOs para registro de solicitante con deduplicación por DPI (`CreatePersonInput`, `PersonSummaryDto`).
   - DTOs para apertura de solicitud borrador (`CreateDraftOperationInput`, `DraftOperationSummaryDto`).
   - DTOs para armado de expediente (`UpdateChecklistItemInput`, `UpdateFinancialAssessmentInput`, `UpdateGuarantorInput`, `RecordWatchlistCheckInput`, `CaseAssemblyStatusDto`).
2. **Entidades y Fixtures en `@crece/domain`**:
   - Trazabilidad en `Person` (`source`, `registeredByUserId`, `interest`).
   - Trazabilidad en `Operation` (`assembledByUserId`, `assembledAt`, `watchlistChecks`).
   - Semillas mock centralizadas (`MOCK_PERSON_PROSPECT`, `MOCK_PERSON_ACTIVE`, `MOCK_DRAFT_OPERATION_NO_GUARANTOR`, `MOCK_DRAFT_OPERATION_WITH_GUARANTOR`, `MOCK_WATCHLIST_CHECKS`).
3. **Validadores de Aplicación en `@crece/application`**:
   - Normalización de DPI (13 dígitos) y obligatoriedad de usuario registrador para asesores (`person-contracts.ts`).
   - Validación de apertura de crédito en borrador e instanciación de checklist dinámico (`operation-contracts.ts`).
   - Invariante obligatoria de justificación en casillas del checklist marcadas como "No aplica" (`case-assembly-contracts.ts`).
   - Validación de evaluación financiera manual y consultas a listas (OFAC/ONU/Guatecompras).
4. **Adaptadores HTTP y Stores en Memoria en `apps/api`**:
   - Módulo `persons` (`GET /persons`, `GET /persons/by-dpi/:dpi`, `POST /persons`) con prevención de duplicados.
   - Módulo `operations` (`GET /operations/:id`, `POST /operations`, `PATCH /operations/:id/checklist`, `POST /operations/:id/assessment`, `POST /operations/:id/guarantor`, `POST /operations/:id/watchlist`, `POST /operations/:id/assemble`).

## Capas Afectadas
- `packages/shared`: DTOs, tipos primitivos, marcas y constantes de API.
- `packages/domain`: Entidades puras, fixtures para desarrollo sin dependencias de NestJS ni Next.js.
- `packages/application`: Casos de uso y validación estricta de invariantes de negocio.
- `apps/api`: Adaptadores HTTP NestJS con stores en memoria (`InMemoryPersonStore`, `InMemoryOperationStore`).

## Límites de IA
- La IA no emite veredictos, aprobaciones, rechazos ni sugerencias de scoring en ninguna fase.
- La evaluación financiera es capturada manualmente y calculada exclusivamente mediante el motor determinístico (`calculateCreditMetrics`).

## No Objetivos
- No incluye integración contable con CENSYT.
- No incluye cableado a PostgreSQL vía Prisma para operaciones en este change (se utiliza el store en memoria de proceso hasta el change de persistencia).
- No incluye servicios de OCR ni llamadas a APIs de LLM en runtime.
