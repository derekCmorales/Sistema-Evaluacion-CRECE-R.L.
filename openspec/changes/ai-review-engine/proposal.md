## Why

La fase 6 del proceso de crédito (revisión con IA) y el borrador 5C de la fase 5 solo existen como puertos sin implementar (`OcrProvider`, `LlmAssistant`, `EmbeddingProvider`, `RagStore` en `packages/domain/src/ports.ts`), y su forma actual no alcanza para el uso real: el OCR devuelve texto plano sin campos, la recuperación pierde la procedencia que exige `AiAlert.sourceDocumentId`, y el LLM recibe la `Operation` completa, con datos personales. Hace falta un motor de IA **desacoplado**, seguro frente a prompt injection y eficiente en tokens. La cooperativa lo operará a largo plazo, así que conviene construirlo y validarlo con pruebas humanas antes de conectarlo al flujo que arman las fases 1–3.

## What Changes

- **Nuevo paquete `@crece/ai-engine`**, un bounded context propio. Expone solo contratos (comandos, eventos, DTOs y los puertos que el sistema anfitrión implementa) y oculta todo lo interno. Depende únicamente de `@crece/shared`.
- **Extracción de documentos (OCR):** Mistral OCR 4.1, llamado directo a la API de Mistral. Salida normalizada a un modelo propio, con campos por tipo de documento como candidatos `PENDING`, clasificación de imágenes y deduplicación por hash del archivo. El OCR se dispara **al subir el documento (fase 3)**, no solo al enviar a revisión.
- **Base de conocimiento (RAG) solo con políticas de CRECE:** ingesta versionada, chunking estructural (Título › Capítulo › Artículo), embeddings `gemini-embedding-2` con **dimensión configurable**, y búsqueda híbrida (vector + texto completo en español) en pgvector sobre el mismo PostgreSQL 18. El expediente del solicitante **no** se vectoriza.
- **Generación asistida con Gemini 3.8 Flash**, a través de Gemini Enterprise Agent Platform (antes Vertex AI) y autenticada con API key atada a una service account:
  - borrador 5C a pedido del asesor (fase 5);
  - análisis de revisión con resumen y alertas citadas (fase 6), que sirve igual para dos firmas (< umbral) y para el Consejo (≥ umbral).
- **Seguridad de IA:** el modelo no tiene herramientas; los documentos se tratan como datos no confiables; salida con esquema estricto; verificación determinística de citas; filtro de contenido prohibido (puntaje, recomendación, veredicto); detección de inyección como alerta; seudonimización de datos personales.
- **Control de costos:** cachés propios (OCR, embeddings, consultas, memo de resultados), prompts ordenados para el caché implícito de Gemini, batch para tareas no interactivas, y registro de tokens y costo por ejecución.
- **Laboratorio interno (`/lab/ia`)**, solo fuera de producción: subir PDFs de prueba y ver la extracción, los chunks, la búsqueda, el prompt, la respuesta, las validaciones y el costo. Usa los mismos casos de uso que producción.
- **Integración por comandos y eventos:** las fases 1–3 emiten hechos (documento subido, enviado a revisión) y el motor responde con eventos. El motor escribe **solo** en su propio esquema de base de datos (`ai`).
- **BREAKING (dominio):** `AiAlert.sourceDocumentId` se reemplaza por una lista de evidencias `{ sourceType: DOCUMENT | POLICY | CALC, sourceId, quote, page? }`. Los puertos de IA salen de `packages/domain/src/ports.ts` y pasan a `@crece/ai-engine`. En dominio quedan solo las invariantes que el proceso de crédito necesita: resolución de alertas y bloqueo de aprobación.
- **Infraestructura:** la imagen de base de datos pasa de `postgres:18-alpine` a una con pgvector para PostgreSQL 18. Se agrega una cola de trabajos sobre PostgreSQL y un proceso worker.

## No objetivos

- La IA **no decide**: no aprueba, no rechaza, no puntúa, no produce banda de riesgo ni "recomendado: aprobar". No escribe `Verdict`, `CalcResult` ni `FinancialAssessment`.
- No se vectoriza el expediente del solicitante ni se buscan "casos similares" entre solicitantes.
- No hay verificación biométrica de firmas ni de rostros.
- No hay agentes ni function calling: el modelo no ejecuta acciones.
- No se implementan R2 ni la persistencia de operaciones con Prisma: son de las fases 1–3. El motor las consume por puertos.
- No se integra nada de CENSYT.
- No se usa LangChain ni frameworks de orquestación de LLM.
- El caché explícito de Gemini queda fuera hasta que el volumen real lo justifique.

## Capabilities

### New Capabilities
- `ai-engine-boundary`: contrato del módulo de IA (comandos, eventos, puertos del anfitrión), aislamiento de datos, activación por flag y degradación cuando la IA no está disponible.
- `ai-document-extraction`: OCR de documentos del expediente, campos por tipo de documento, clasificación de imágenes, deduplicación y trazabilidad hacia la página de origen.
- `ai-knowledge-base`: ingesta versionada de políticas de CRECE, chunking estructural, embeddings configurables y búsqueda híbrida con procedencia.
- `ai-generation`: borrador 5C y análisis de revisión (resumen y alertas con evidencia) sobre un contexto de caso minimizado, con salida estructurada.
- `ai-safety`: defensa contra prompt injection, verificación de citas, filtro de contenido prohibido y seudonimización.
- `ai-cost-control`: cachés, reutilización de resultados, límites de tokens y registro de uso y costo por ejecución.
- `ai-lab`: laboratorio interno para pruebas humanas y evaluación, limitado a ambientes que no son de producción.

### Modified Capabilities
- `ai-assist`:
  - el OCR se genera al subir el documento;
  - las alertas llevan evidencia tipada en lugar de un único `sourceDocumentId`;
  - el borrador 5C es a pedido y queda marcado como sugerencia;
  - enviar a revisión no se bloquea si la IA no está disponible (se avisa y se puede reintentar);
  - se mantiene que no se aprueba con alertas sin resolver.

## Impact

- **domain** (`packages/domain`): `AiAlert`/`AiAssistance` con evidencias; salida de los puertos de IA de `ports.ts`; tests de `assertCanApprove` (hoy sin cobertura).
- **shared** (`packages/shared`): tipos de evidencia y labels es-GT de alertas nuevas (`INJECTION_SUSPECTED`, `MISSING_EVIDENCE`).
- **ai-engine** (nuevo `packages/ai-engine`): casos de uso, chunking, prompts, guardas y fakes para pruebas.
- **application** (`packages/application`): `SubmitForReview` publica el hecho; ningún caso de uso de crédito llama al proveedor de IA.
- **api** (`apps/api`): `modules/ai` (HTTP del lab y comandos) e `infrastructure/ai` (adaptadores de Mistral, Google y pgvector); modo worker.
- **web** (`apps/web`): rutas `/lab/ia/*` con componentes de `design-system/`, detrás de flag.
- **DB:** migración con la extensión `vector` y esquema `ai` (`knowledge_source`, `knowledge_chunk`, `document_extraction`, `ai_run`, `ai_alert`, `ai_cache`) más las tablas de la cola.
- **Compose / docs:** imagen de DB con pgvector; variables de entorno `AI_*`; `docs/stack.md`, `docs/arquitectura.md`, `docs/diagramas/16-terceros.md` y el Mermaid de `06-secuencia-flujo.md`.
- **Dependencias nuevas:** `@google/genai`, `@mistralai/mistralai`, `pg`, `pg-boss`, `pgvector`, `zod`, `markdown-it`, y `vitest` en `apps/api`. La frontera se verifica con un test de arquitectura propio, sin `dependency-cruiser` (ver design D14 y D16).
- **Cuentas externas:** proyecto GCP de prueba con Agent Platform y API key restringida; cuenta de Mistral de prueba. Solo datos sintéticos mientras se usen cuentas de prueba.
