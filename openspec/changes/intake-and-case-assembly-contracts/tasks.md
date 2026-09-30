# Tasks: intake-and-case-assembly-contracts

- [x] 1. Definir contratos y DTOs compartidos <!-- id: 1 -->
  - Paquete: `@crece/shared`
  - Archivo: `packages/shared/src/index.ts`
  - Migración DB: No
  - Prueba: `packages/shared/src/format.test.ts`

- [x] 2. Actualizar entidades y crear fixtures de desarrollo <!-- id: 2 -->
  - Paquete: `@crece/domain`
  - Archivos: `packages/domain/src/entities.ts`, `packages/domain/src/fixtures/mock-data.ts`, `packages/domain/src/fixtures/index.ts`
  - Migración DB: No
  - Prueba: `packages/domain/src/checklist-resolver.test.ts`

- [x] 3. Implementar validadores y casos de uso de Fase 1 (Personas) <!-- id: 3 -->
  - Paquete: `@crece/application`
  - Archivo: `packages/application/src/person-contracts.ts`
  - Migración DB: No
  - Prueba: `packages/application/src/person-contracts.test.ts`

- [x] 4. Implementar validadores y casos de uso de Fase 2 (Operaciones Borrador) <!-- id: 4 -->
  - Paquete: `@crece/application`
  - Archivo: `packages/application/src/operation-contracts.ts`
  - Migración DB: No
  - Prueba: `packages/application/src/operation-contracts.test.ts`

- [x] 5. Implementar validadores y casos de uso de Fase 3 (Armado de Expediente) <!-- id: 5 -->
  - Paquete: `@crece/application`
  - Archivo: `packages/application/src/case-assembly-contracts.ts`
  - Migración DB: No
  - Prueba: `packages/application/src/case-assembly-contracts.test.ts`

- [x] 6. Implementar adaptadores HTTP y store en memoria para Personas <!-- id: 6 -->
  - Paquete: `apps/api`
  - Archivos: `apps/api/src/modules/persons/in-memory-person.store.ts`, `apps/api/src/modules/persons/persons.controller.ts`, `apps/api/src/modules/persons/persons.module.ts`
  - Migración DB: No
  - Verificación: `pnpm --filter @crece/api build`

- [x] 7. Implementar adaptadores HTTP y store en memoria para Operaciones <!-- id: 7 -->
  - Paquete: `apps/api`
  - Archivos: `apps/api/src/modules/operations/in-memory-operation.store.ts`, `apps/api/src/modules/operations/operations.controller.ts`, `apps/api/src/modules/operations/operations.module.ts`
  - Migración DB: No
  - Verificación: `pnpm --filter @crece/api build`

- [x] 8. Vincular dependencias de dominio para frontend Next.js <!-- id: 8 -->
  - Paquete: `apps/web`
  - Archivo: `apps/web/package.json`
  - Migración DB: No
  - Verificación: `pnpm --filter @crece/web lint`
