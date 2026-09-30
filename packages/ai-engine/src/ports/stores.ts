import type { AiTask, RunStatus, TokenUsage } from "../contracts/common";
import type { AiErrorCode } from "../contracts/errors";
import type { AiEngineEvent } from "../contracts/events";
import type { DocumentExtraction } from "../contracts/ocr";
import type { Transaction } from "./runtime";

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
  /** Ejecución fallida que esta reintenta (historial). */
  retryOf?: string;
  attempts: number;
  /** Parámetros del comando (sin datos crudos de documentos). */
  input?: unknown;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
};

export type NewAiRun = Pick<AiRun, "id" | "task" | "forced" | "isLab" | "createdAt"> &
  Partial<Pick<AiRun, "idempotencyKey" | "operationId" | "documentRef" | "requestedBy" | "input" | "retryOf">>;

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

export type StalledRunsQuery = {
  /** QUEUED creadas antes de este instante. */
  queuedBefore: string;
  /** RUNNING iniciadas antes de este instante. */
  runningBefore: string;
  limit: number;
};

export type RunStore = {
  /**
   * Crea la ejecución en estado QUEUED o, si ya hay una viva (no FAILED) con la misma clave de
   * idempotencia, devuelve esa. Una FAILED no bloquea la clave: pedir de nuevo crea otra.
   * `onCreated` corre dentro de la misma transacción, solo si se creó (p. ej. encolar).
   */
  createOrGet(
    run: NewAiRun,
    onCreated?: (tx: Transaction) => Promise<void>,
  ): Promise<{ run: AiRun; created: boolean }>;
  get(id: string): Promise<AiRun | null>;
  /**
   * Reclama la ejecución para un worker (compare-and-set): pasa a RUNNING si está QUEUED, o si
   * está RUNNING con `startedAt` anterior a `staleBefore` (el worker anterior murió). Devuelve
   * la ejecución reclamada o null si otro la tiene o ya terminó.
   */
  claim(id: string, at: string, staleBefore: string): Promise<AiRun | null>;
  /**
   * Termina una ejecución RUNNING y publica los eventos en la misma transacción (outbox).
   * Devuelve false (sin cambios ni eventos) si ya no estaba RUNNING.
   */
  markSucceeded(id: string, patch: RunSuccessPatch, at: string, events: AiEngineEvent[]): Promise<boolean>;
  markFailed(id: string, failure: RunFailure, at: string, events: AiEngineEvent[]): Promise<boolean>;
  /**
   * Marca FAILED una ejecución trabada, solo si sigue en `expected.status` desde antes de
   * `expected.before` (creación para QUEUED, inicio para RUNNING). Devuelve si se aplicó.
   */
  markInterrupted(
    id: string,
    expected: { status: "QUEUED" | "RUNNING"; before: string },
    failure: RunFailure,
    at: string,
    events: AiEngineEvent[],
  ): Promise<boolean>;
  findStalled(query: StalledRunsQuery): Promise<AiRun[]>;
  countActive(): Promise<{ queued: number; running: number; oldestQueuedAt: string | null }>;
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
  pipelineFingerprint: string;
  /** El laboratorio y producción nunca comparten extracciones. */
  isLab: boolean;
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
