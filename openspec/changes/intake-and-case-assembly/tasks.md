# Tasks: intake-and-case-assembly

- [x] 1. Reglas de captación y expediente en dominio
  - Paquete: `@crece/domain`
  - Archivo: `packages/domain/src/intake-rules.ts`
  - Migración DB: No
  - Prueba: `packages/domain/src/intake-rules.test.ts`

- [x] 2. Casos de uso con permiso y bitácora
  - Paquete: `@crece/application`
  - Archivo: `packages/application/src/intake-use-cases.ts`
  - Migración DB: No
  - Prueba: `packages/application/src/intake-use-cases.test.ts`

- [x] 3. Un solo repositorio y adaptadores HTTP
  - Paquete: `apps/api`
  - Archivos: `apps/api/src/modules/memory/`, controladores de persons, prospects y operations
  - Migración DB: No
  - Prueba: `apps/api/src/modules/persons/persons.flow.spec.ts`

- [x] 4. Expediente en la web solo con el design system
  - Paquete: `apps/web`
  - Archivos: `apps/web/app/operations/[id]/page.tsx`, `apps/web/lib/crece-ds.tsx`
  - Migración DB: No
  - Verificación: `pnpm --filter @crece/web build`
