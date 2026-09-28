import type { AiTask, RunStatus, TokenUsage } from "../contracts/common";
import type { AiErrorCode } from "../contracts/errors";
import type { AiEngineEvent } from "../contracts/events";
import type { DocumentExtraction } from "../contracts/ocr";

// ---------------------------------------------------------------- ejecuciones

export type AiRun = {
  id: string;
  task: AiTask;
  idempotencyKey?: string;
  operationId?: string;
  documentRef?: string;
  status: RunStatus;
  modelId?: string;
  promptVersion?: string;
  inputSha256?: string;
  retrievedChunkIds: string[];
  usage: TokenUsage;
  costEstimateUsd?: number;
  latencyMs?: number;
  guardReport?: unknown;
  output?: unknown;
  errorCode?: AiErrorCode;
  errorMessage?: string;
  requestedBy?: string;
  forced: boolean;
  isLab: boolean;
  attempts: number;
  /** Parámetros del comando (sin datos crudos de documentos). */
  input?: unknown;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
};

export type NewAiRun = Pick<AiRun, "id" | "task" | "forced" | "isLab" | "createdAt"> &
  Partial<Pick<AiRun, "idempotencyKey" | "operationId" | "documentRef" | "requestedBy" | "input" | "status">>;

export type RunSuccessPatch = Partial<
  Pick<
    AiRun,
    | "modelId"
    | "promptVersion"
    | "inputSha256"
    | "retrievedChunkIds"
    | "usage"
    | "costEstimateUsd"
    | "latencyMs"
    | "guardReport"
    | "output"
    | "attempts"
  >
> & { status?: Extract<RunStatus, "SUCCEEDED" | "REUSED"> };

export type RunFailure = {
  errorCode: AiErrorCode;
  errorMessage: string;
  attempts: number;
  latencyMs?: number;
  usage?: TokenUsage;
  guardReport?: unknown;
};

export type RunFilter = {
  operationId?: string;
  task?: AiTask;
  isLab?: boolean;
  limit?: number;
};

export type RunStore = {
  /** Crea la ejecución o, si la clave de idempotencia ya existe, devuelve la existente. */
  createOrGet(run: NewAiRun): Promise<{ run: AiRun; created: boolean }>;
  get(id: string): Promise<AiRun | null>;
  markRunning(id: string, at: string): Promise<void>;
  /** Actualiza la ejecución y publica los eventos en la misma transacción (outbox). */
  markSucceeded(id: string, patch: RunSuccessPatch, at: string, events: AiEngineEvent[]): Promise<void>;
  markFailed(id: string, failure: RunFailure, at: string, events: AiEngineEvent[]): Promise<void>;
  /** Última ejecución exitosa con la misma entrada, modelo y versión de prompt. */
  findReusable(query: {
    task: AiTask;
    inputSha256: string;
    modelId: string;
    promptVersion: string;
    isLab: boolean;
  }): Promise<AiRun | null>;
  list(filter: RunFilter): Promise<AiRun[]>;
};

// ---------------------------------------------------------------- extracciones

export type ExtractionKey = {
  fileSha256: string;
  ocrModel: string;
  schemaCode: string;
  schemaVersion: number;
};

export type ExtractionStore = {
  findByKey(key: ExtractionKey): Promise<DocumentExtraction | null>;
  /** Idempotente por clave: si ya existe, devuelve la existente. */
  save(extraction: DocumentExtraction, rawResponse?: unknown): Promise<DocumentExtraction>;
  get(id: string): Promise<DocumentExtraction | null>;
  linkDocument(documentRef: string, extractionId: string, operationId?: string): Promise<void>;
  findByDocumentRef(documentRef: string): Promise<DocumentExtraction | null>;
};

// ---------------------------------------------------------------- base de conocimiento

export type KnowledgeSourceStatus = "DRAFT" | "APPROVED" | "SUPERSEDED";

export type KnowledgeSource = {
  id: string;
  code: string;
  version: number;
  status: KnowledgeSourceStatus;
  title: string;
  effectiveFrom: string;
  fileSha256: string;
  structure: "STRUCTURED" | "FLAT";
  approvedBy?: string;
  approvedAt?: string;
  isLab: boolean;
  createdAt: string;
};

export type KnowledgeChunk = {
  id: string;
  sourceId: string;
  ordinal: number;
  sectionPath: string[];
  pageStart: number;
  pageEnd: number;
  contextHeader: string;
  content: string;
  tokenCount: number;
  contentSha256: string;
  chunkerVersion: string;
  embeddingModel: string;
  embeddingDims: number;
  embedding: number[];
};

export type KnowledgeSearchQuery = {
  embedding: number[];
  text: string;
  limit: number;
  candidateDepth: number;
  semanticWeight: number;
  lexicalWeight: number;
  efSearch: number;
  includeDrafts: boolean;
  /** El lab ve fuentes de lab y de producción; producción nunca ve fuentes de lab. */
  includeLab: boolean;
  includeQueryPlan: boolean;
};

export type KnowledgeSearchHit = {
  chunkId: string;
  sourceId: string;
  sourceCode: string;
  sourceTitle: string;
  version: number;
  sectionPath: string[];
  pageStart: number;
  pageEnd: number;
  ordinal: number;
  content: string;
  semanticRank: number | null;
  lexicalRank: number | null;
  semanticDistance: number | null;
  lexicalScore: number | null;
  fusedScore: number;
};

export type KnowledgeStore = {
  /** Modelo y dimensión del índice activo (null si aún no hay chunks). */
  indexInfo(): Promise<{ embeddingModel: string | null; embeddingDims: number }>;
  nextVersion(code: string): Promise<number>;
  saveSource(source: KnowledgeSource, chunks: KnowledgeChunk[]): Promise<void>;
  /** Embeddings existentes por hash de contenido, mismo modelo y dimensión. */
  findEmbeddingsByHash(hashes: string[], model: string, dims: number): Promise<Map<string, number[]>>;
  /** Aprueba una versión y marca SUPERSEDED las demás del mismo código. */
  approveSource(sourceId: string, byUserId: string, at: string): Promise<void>;
  search(query: KnowledgeSearchQuery): Promise<{ hits: KnowledgeSearchHit[]; queryPlan?: string }>;
  getChunks(ids: string[]): Promise<Array<Omit<KnowledgeChunk, "embedding">>>;
  listSources(filter?: { isLab?: boolean }): Promise<KnowledgeSource[]>;
  listChunks(sourceId: string): Promise<Array<Omit<KnowledgeChunk, "embedding">>>;
};

// ---------------------------------------------------------------- caché genérico

export type ResultCache = {
  get<T>(namespace: string, key: string): Promise<T | null>;
  put<T>(namespace: string, key: string, value: T): Promise<void>;
};
