## 1. Contrato y esqueleto del módulo (primero: desbloquea a las fases 1–3)

- [x] 1.1 [shared] Agregar `EvidenceSourceType`, `AiEvidence`, los tipos de alerta `INJECTION_SUSPECTED` y `MISSING_EVIDENCE` y sus labels es-GT; verificar con `packages/shared/src/ai-labels.test.ts` (todos los tipos con label). Sin migración.
- [x] 1.2 [domain] Cambiar `AiAlert.sourceDocumentId` por `evidence: AiEvidence[]` (mínimo 1), exigir motivo al descartar, y cubrir `assertCanApprove` (APPROVE bloqueado con alertas pendientes, RETURN/REJECT no); verificar con `packages/domain/src/ai-alerts.test.ts`. Sin migración (JSON).
- [x] 1.3 [domain] Quitar `OcrProvider`, `LlmAssistant`, `EmbeddingProvider` y `RagStore` de `ports.ts` (los reemplaza el motor); verificar `pnpm --filter @crece/domain build test`.
- [x] 1.4 [ai-engine] Crear `packages/ai-engine` (package.json con `exports` `.` y `./testing`, tsconfig, vitest) y verificar que `pnpm -r build` lo incluye.
- [x] 1.5 [ai-engine] Definir `contracts/`: comandos, hechos del anfitrión, eventos, `CaseSnapshot`, `OcrDocument`, resultados; verificar con `packages/ai-engine/src/contracts/contracts.test.ts` (validación zod de ejemplos válidos e inválidos).
- [x] 1.6 [ai-engine] Definir `ports/` (`OcrProvider`, `EmbeddingProvider`, `LlmProvider`, `KnowledgeStore`, `RunStore`, `ExtractionStore`, `ResultCache`, `EventOutbox`, `JobQueue`, `Clock`, `IdGenerator`, `DocumentSource`, `CaseSnapshotSource`) y fakes en memoria en `src/testing/`; verificar con `packages/ai-engine/src/testing/fakes.test.ts`.
- [x] 1.7 [ai-engine] Escáner léxico de imports y un único test de arquitectura que recorre `packages/` y `apps/` con las 4 reglas de D14 (`src/architecture/architecture.test.ts`; `import-scanner.test.ts` prueba el escáner con comentarios, strings, `require`, `import type` y fixtures de violación); verificado: los fixtures con import prohibido fallan y el árbol real pasa.
- [ ] 1.8 [domain/shared] Abrir un PR pequeño a `main` con 1.1–1.3 y el contrato publicado (`@crece/ai-engine` contratos + fakes), para que las fases 1–3 programen contra él; verificar que `pnpm test && pnpm build && pnpm lint` pasan en ese PR.

## 2. Infraestructura

- [x] 2.1 [compose] Cambiar la imagen de `db` a `pgvector/pgvector:0.8.6-pg18` con volumen nuevo `crece_pg18_data` (D21) y `default_toast_compression=lz4`; `engines.node >=22.12`; `apps/api/tsconfig.json` a `module/moduleResolution: nodenext` (D16); verificar con `docker compose up -d db`, `pnpm --filter @crece/api build` y `SELECT extversion FROM pg_extension WHERE extname='vector'` tras la migración 2.3.
- [x] 2.2 [api] Cargador de configuración `AI_*` con validación zod (flags, backend, auth, dimensiones 128–2000) y `.env.example` actualizado; verificar con `apps/api/src/infrastructure/ai/ai-env.test.ts` (dimensión fuera de rango y key ausente con motor activo fallan al arrancar).
- [x] 2.3 [api] **Migración DB:** migrador del esquema `ai` (advisory lock, checksum, guarda de dimensión) más `db/migrations/001-init.ts`: extensiones `vector` y `unaccent`, configuración de texto `ai.es` (español sin acentos), las tablas de D4, `halfvec(AI_EMBEDDING_DIMENSIONS)`, `tsv` generada, HNSW, GIN, `ai.config` versionada y la vista `knowledge_chunk_active`; verificado con `db/migrations.integration.test.ts` (base vacía, dimensión, idempotencia, reindexación requerida, migración editada, búsqueda sin acentos).
- [x] 2.4 [api] Agregar Vitest a `apps/api`, el script `test` dentro de `pnpm test` y el script `test:integration` (requiere la base de Compose); verificar que `pnpm test` en la raíz ejecuta los tests de la API.
- [x] 2.5 [api] Adaptadores `PgRunStore`, `PgExtractionStore`, `PgResultCache` y `PgEventOutbox`; verificar con `apps/api/src/infrastructure/ai/pg-stores.integration.test.ts`.
- [x] 2.6 [api] `PgBossJobQueue` más el modo worker (`AI_WORKER=true`, contexto Nest sin HTTP) y el servicio `ai-worker` en Compose (perfil `dev`); verificar con `apps/api/src/infrastructure/ai/job-queue.integration.test.ts` (encolar → ejecutar → `SUCCEEDED`; idempotencia por clave única).
- [ ] 2.7 [api] `GoogleClientFactory` (backend y auth por configuración, `enterprise: true` para Agent Platform) más el comando `pnpm --filter @crece/api ai:smoke` que hace una llamada mínima a 3.8 Flash y a Embedding 2; verificar con `google-client-factory.test.ts` (opciones por combinación de variables) y ejecutando el smoke con la key de prueba (confirmar si la authorization key requiere `project`/`location`).
- [x] 2.8 [api] `AiModule` como composition root con `AI_ENGINE_ENABLED`: apagado, los comandos responden `AI_DISABLED`; verificar con `apps/api/src/modules/ai/ai-disabled.test.ts`.

## 3. Extracción de documentos (OCR)

- [x] 3.1 [ai-engine] Validación previa (magic bytes, tamaño, páginas, PDF cifrado) sin llamar al proveedor; verificar con `src/extraction/preflight.test.ts` usando PDFs sintéticos (cifrado, corrupto, enorme).
- [x] 3.2 [ai-engine] Registro versionado de esquemas por tipo de documento (DPI, BUREAU_REPORT, INCOME_RECEIPT, BANK_STATEMENT, UTILITY_BILL, BUSINESS_PHOTO, SKETCH) y el clasificador de imágenes; verificar con `src/extraction/document-schemas.test.ts` (tipo desconocido → sin esquema).
- [x] 3.3 [ai-engine] Normalizador de `OcrDocument` (NFC, guiones de fin de línea, espacios, números de página, mapa de posición → página/bloque, tablas que cruzan páginas) y el mapeo a `OcrCandidate` con umbral de confianza, montos GTQ, fechas y formato CUI; verificar con `src/extraction/ocr-normalizer.test.ts`.
- [x] 3.4 [ai-engine] Caso de uso `ExtractDocument` (deduplicación por hash + modelo + esquema, reintentos con backoff, `FAILED` con motivo, evento `DocumentExtractionCompleted`/`AiRunFailed`, sin tocar `FinancialAssessment`); verificar con `src/use-cases/extract-document.test.ts` usando fakes.
- [ ] 3.5 [api] Adaptador `MistralOcrProvider` (versión fijada, encabezados y pies, confianza por bloque, `image_min_size`, anotaciones solo si el tipo las requiere, sin base64 persistido) más la traducción anticorrupción; verificar con `mistral-ocr.contract.test.ts` (fake siempre; real con `describe.runIf(MISTRAL_API_KEY)`).
- [x] 3.6 [api] `FileSystemDocumentSource` para el lab (`.lab-storage/`, en `.gitignore`); verificar con `fs-document-source.test.ts`.

## 4. Laboratorio: base y pestaña de extracción

- [ ] 4.1 [api] `LabGuard` (404 si `NODE_ENV=production` o si falta `AI_LAB_ENABLED`) y `lab.controller` que solo delega a los comandos del motor; verificar con `apps/api/src/modules/ai/lab.guard.test.ts` y `lab.controller.test.ts`.
- [ ] 4.2 [web] `apps/web/lib/crece-ds.tsx` (único puente al bundle del design system, D17) más el layout `/lab/ia` con guarda (`notFound()` fuera de condiciones), tokens y `bundle.css`, navegación por `Tabs` y aviso permanente de "solo datos sintéticos"; verificar a mano en `pnpm dev:web` y con `pnpm --filter @crece/web lint`.
- [ ] 4.3 [web] Pestaña Extracción: subir PDF o imagen y tipo, estado de la ejecución (consulta cada 1–2 s), texto por página junto al original, candidatos con confianza, imágenes clasificadas, latencia y costo; verificar con el punto "Extracción" de `lab-acceptance.md`.
- [ ] 4.4 [ai-engine] Script de PDFs sintéticos (DPI, buró, recibo, estado de cuenta, PDF con inyección) en `packages/ai-engine/eval/fixtures/` más `eval/extraction-golden.json`; verificar que el script genera los archivos de forma determinística.
- [ ] 4.5 [docs] Crear `openspec/changes/ai-review-engine/lab-acceptance.md` con el checklist manual por pestaña; se verifica al revisarlo en el PR.

## 5. Chunking de políticas

- [ ] 5.1 [ai-engine] `StructureParser`: markdown → bloques (`markdown-it`, D6), promoción de encabezados legales, árbol con ruta y páginas, fallback plano; verificar con `src/chunking/structure-parser.test.ts` (reglamento sintético con Título/Capítulo/Artículo/Anexo y uno sin encabezados).
- [ ] 5.2 [ai-engine] `SentenceSplitter` sobre `Intl.Segmenter('es')` con protección de abreviaturas; verificar con `src/chunking/sentence-splitter.test.ts` ("Art. 12", "No. 5", "Q. 1,500.00", "Lic.").
- [ ] 5.3 [ai-engine] Estimador de tokens para español (con factor configurable); verificar con `src/chunking/token-estimator.test.ts`.
- [ ] 5.4 [ai-engine] `StructureAwareChunker` (`struct-v1`): empaquetado por hoja, fusión dentro del mismo padre, división por párrafo y oración con solape, tablas atómicas o por filas con encabezado, `context_header`; verificar con `src/chunking/structure-aware-chunker.test.ts` más pruebas *property-based* de las cinco invariantes de la spec.

## 6. Embeddings, base de conocimiento y búsqueda

- [ ] 6.1 [api] `GeminiEmbeddingProvider` (Embedding 2, prefijos de consulta y documento, dimensión desde el entorno, lotes, batch opcional); verificar con `gemini-embedding.contract.test.ts` (dimensión del vector = configurada; real con `runIf`).
- [ ] 6.2 [api] `PgVectorKnowledgeStore`: upsert de fuente y chunks, activación de versión (`SUPERSEDED` sin borrar), búsqueda híbrida RRF (D7) con `hnsw.iterative_scan`, `unaccent` y sinónimos, guarda de dimensión/modelo y fusión de chunks contiguos; verificar con `pgvector-knowledge-store.integration.test.ts` (ranking de "artículo 12 fiador", versión reemplazada, error de reindexación). **Migración DB:** `002_synonyms.sql` (diccionario de sinónimos semilla).
- [ ] 6.3 [ai-engine] Caso de uso `IngestKnowledgeSource` (solo `SYSTEM_ADMIN`, OCR → normalizar → parsear → chunkear → reutilizar embeddings por hash → guardar → `KnowledgeSourceIndexed`); verificar con `src/use-cases/ingest-knowledge-source.test.ts`.
- [ ] 6.4 [ai-engine] `SearchKnowledge` más `CaseQueryBuilder` (plantilla determinística desde hechos del caso) y caché de embedding de consulta; verificar con `src/retrieval/case-query-builder.test.ts` (el texto de documentos no altera la consulta) y `src/use-cases/search-knowledge.test.ts`.
- [ ] 6.5 [web] Pestañas Conocimiento (ingestar, ver chunks) y Búsqueda (parámetros, puntajes semántico/texto/fusionado lado a lado, `EXPLAIN ANALYZE`); verificar con los puntos correspondientes de `lab-acceptance.md`.
- [ ] 6.6 [ai-engine] `eval/retrieval-golden.json` (30–50 preguntas sobre el reglamento sintético) y la evaluación recall@5/MRR; verificar con `src/eval/retrieval-eval.test.ts` (métricas sobre un set mínimo con resultado conocido).

## 7. Generación y seguridad

- [ ] 7.1 [ai-engine] `Pseudonymizer` determinístico (nombres del snapshot con acentos y apóstrofos, CUI, NIT, teléfonos, correos, direcciones) con rehidratación; verificar con `src/guards/pseudonymizer.test.ts` (incluye "K'iche'").
- [ ] 7.2 [ai-engine] `CaseContextBuilder` más `TokenBudget` (prioridad de recorte, nunca a mitad de página, marca de recortado); verificar con `src/context/case-context-builder.test.ts` y `src/context/token-budget.test.ts`.
- [ ] 7.3 [ai-engine] Prompts versionados `prompts/draft-5c/v1.ts` y `prompts/review/v1.ts` con el layout de D9 y esquemas zod → JSON Schema; verificar con `src/prompts/prompt-layout.test.ts` (orden estable del prefijo, prefijo ≥ 4,096 tokens estimados, datos entre delimitadores) y `src/generation/output-schemas.test.ts`.
- [ ] 7.4 [ai-engine] Guardas: `InjectionDetector`, `ForbiddenContentFilter` (patrones desde configuración), `EvidenceGrounding` (exacta y luego difusa ≥ umbral), deduplicación por huella, idioma y largo; verificar con `src/guards/injection-detector.test.ts`, `forbidden-content.test.ts` y `evidence-grounding.test.ts`.
- [ ] 7.5 [api] `GeminiLlmProvider` (3.8 Flash, salida con esquema, sin herramientas, `thinking_level` por tarea, uso con tokens cacheados, mapeo de `finishReason`); verificar con `gemini-llm.contract.test.ts` (real con `runIf`).
- [ ] 7.6 [ai-engine] Caso de uso `RequestDraft5C` (sugerencia de cinco secciones, nunca escribe la opinión, idempotencia); verificar con `src/use-cases/request-draft-5c.test.ts`.
- [ ] 7.7 [ai-engine] Caso de uso `RunReviewAnalysis` (snapshot + hash, búsqueda, guardas en orden, reintento único, persistencia atómica, evento, detección de desactualizado, sin ruta ni umbral en la entrada, aislamiento de escritura); verificar con `src/use-cases/run-review-analysis.test.ts`.

## 8. Control de costos

- [ ] 8.1 [ai-engine] Reutilización de resultados por `input_sha256 + task + model + prompt_version` con regeneración forzada auditada; verificar con `src/use-cases/result-reuse.test.ts`.
- [ ] 8.2 [ai-engine] `CostEstimator` con precios por fecha de vigencia desde configuración (incluye el cambio del 2027-01-01) y agregados por ejecución, operación y mes; verificar con `src/usage/cost-estimator.test.ts`.
- [ ] 8.3 [ai-engine] Límite de concurrencia y backoff ante límite de tasa; verificar con `src/usage/rate-limit.test.ts`.
- [ ] 8.4 [api] Alerta mensual de gasto a `SYSTEM_ADMIN` (vía el puerto `Notifier` existente) y purga de `raw_response` y del lab por retención (job programado en pg-boss); verificar con `apps/api/src/modules/ai/cost-alert.test.ts` y `packages/ai-engine/src/use-cases/lab-retention.test.ts`.

## 9. Laboratorio: ejecuciones y evaluación

- [ ] 9.1 [web] Pestaña Ejecuciones: elegir un caso sintético (`eval/cases/*.json`), lanzar 5C o revisión, ver prompt seudonimizado, respuesta cruda, informe de guardas (incluye alertas descartadas y motivo), tokens (entrada, cache, salida, razonamiento) y costo; verificar con `lab-acceptance.md`.
- [ ] 9.2 [ai-engine] Batería red-team `eval/red-team/*.json` (inyecciones en recibos y buró, tentaciones de recomendar o puntuar) con puerta de activación de prompt y modelo; verificar con `src/eval/red-team-gate.test.ts` (una salida prohibida impide activar la versión).
- [ ] 9.3 [web] Pestaña Evaluación: correr los sets (extracción, recuperación, red-team) y comparar ejecuciones por modelo, prompt, versión de chunker y dimensión (768/1024/1536); verificar con `lab-acceptance.md`.

## 10. Integración con las fases 1–3

- [ ] 10.1 [application] `SubmitForReview` publica `OperationSubmittedForReview` y la operación llega a `UNDER_REVIEW` aunque la IA esté apagada o falle; verificar con `packages/application/src/submit-for-review.test.ts`.
- [ ] 10.2 [api] Suscriptores en `modules/ai` para `DocumentUploaded` → `ExtractDocument` y `OperationSubmittedForReview` → `RunReviewAnalysis`, y relay del outbox al bus de eventos; verificar con `apps/api/src/modules/ai/subscribers.test.ts`.
- [ ] 10.3 [api] Adaptador `CaseSnapshotSource` y `DocumentSource` (R2) con el equipo de operaciones y documentos (ellos implementan, el coordinador revisa el PR); verificar con el test de contrato de `@crece/ai-engine/testing` ejecutado contra su adaptador.
- [ ] 10.4 [raíz] Verificación de extremo a extremo en dev: subir un documento sintético → candidatos; enviar a revisión → análisis con alertas citadas; resolver alertas → aprobación permitida. Se deja registrado en `lab-acceptance.md` más `pnpm test && pnpm build && pnpm lint` en verde.

## 11. Documentación

- [ ] 11.1 [docs] `docs/ia.md`: arquitectura del motor, contrato para el equipo, variables `AI_*`, pasos en GCP (service account, política de organización, authorization key restringida por servicio e IP, rotación), cuenta Mistral y reglas del lab; se verifica al revisarlo en el PR.
- [ ] 11.2 [docs] Actualizar `docs/diagramas/06-secuencia-flujo.md` (Mermaid completo según el PNG, más el flujo de IA), `16-terceros.md` (Mistral directo, Embedding 2, 3.8 Flash vía Agent Platform, pgvector) y `04-contenedores.md` (ai-worker); se verifica que no hay PNG nuevos en el diff.
- [ ] 11.3 [docs] Actualizar `docs/stack.md` (dependencias nuevas y versiones), `docs/arquitectura.md` (bounded context `ai`, dos mecanismos de migración), `docs/docker.md` (imagen pgvector, ai-worker), `docs/testing.md` (runner de API, `test:integration`, contratos y evaluación) y `docs/glosario.md` (Evidencia, Chunk, Base de conocimiento, Laboratorio de IA); se verifica al revisarlo en el PR.
- [ ] 11.4 [openspec] Al cerrar: `openspec validate ai-review-engine --strict` y luego archive/sync; confirmar que `openspec/specs/ai-assist/spec.md` ya no dice "Not implemented" y que cada spec nueva tiene su sección Tests.
