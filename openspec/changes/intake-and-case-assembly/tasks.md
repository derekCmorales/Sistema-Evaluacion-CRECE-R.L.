# Tasks: intake-and-case-assembly

## 1. Integración de ramas

- [x] 1.1 Integrar #3 (fase 3, Benjamin) y #4 (fases 1–2, Josué) en una sola rama desde `main`, conservando autoría.

## 2. Dominio

- [x] 2.1 [domain] `person-identity`: `normalizeDpi`, `createProspect` (siempre `PROSPECT`), `assignDpi` (DPI inmutable). Prueba: `packages/domain/src/person-identity.test.ts`. Sin migración.
- [x] 2.2 [domain] `case-assembly`: estado editable, `applyChecklistUpdate`, `reconcileChecklist`, `applyGuarantor`, `summarizeWatchlist`, `evaluateCaseAssembly`, `markAssembled`. Prueba: `packages/domain/src/case-assembly.test.ts`.
- [x] 2.3 [domain] Sacar las fixtures de `@crece/domain` (no son dominio). `WatchlistCheck` como entidad.

## 3. Aplicación

- [x] 3.1 [application] Contratos de entrada sin origen ni autor en el cuerpo; opcionales no numéricos fallan. Prueba: `*-contracts.test.ts`.
- [x] 3.2 [application] Casos de uso `person-intake` (landing, agencia, DPI, directorio, perfil, búsqueda) con RBAC y bitácora. Prueba: `person-intake.test.ts`.
- [x] 3.3 [application] Casos de uso `case-file` (apertura, checklist, evaluación, fiador, listas, armado, cola, bitácora). Prueba: `case-file.test.ts`.

## 4. API

- [x] 4.1 [api] Adaptadores en memoria de los puertos y `CaptureModule` global; semilla de demo fuera de producción. Prueba: `demo-seed.test.ts`.
- [x] 4.2 [api] Controladores delgados de prospectos, personas y operaciones; actor por cabeceras; filtro 401/403/404/409. Prueba: `capture.http.test.ts`.
- [x] 4.3 [api] Vitest con alias desde `src` y `*.test.ts` (F6).

## 5. Web

- [x] 5.1 [web] Design system vía bundle publicado en `/ds`; sin componentes, íconos ni fuentes propias.
- [x] 5.2 [web] Pantallas: vista general, directorio, registro, perfil, apertura, expediente, simulador, sesión de prueba. Prueba: `apps/web/lib/*.test.ts`; recorrido E2E manual de fases 1→3 documentado en el PR.

## 6. Docs

- [x] 6.1 `docs/uso.md`, `docs/testing.md`, `docs/diagramas/20-secuencia-captacion.md`.
- [ ] 6.2 Al mergear: `openspec archive intake-and-case-assembly` (sincroniza `person-operations`, `checklist` y crea `case-assembly`).
