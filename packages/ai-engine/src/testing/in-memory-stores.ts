import { EMPTY_USAGE } from "../contracts/common";
import type { AiEngineEvent } from "../contracts/events";
import type { DocumentExtraction } from "../contracts/ocr";
import type {
  AiRun,
  ExtractionKey,
  ExtractionStore,
  KnowledgeChunk,
  KnowledgeSearchHit,
  KnowledgeSearchQuery,
  KnowledgeSource,
  KnowledgeStore,
  NewAiRun,
  ResultCache,
  RunFailure,
  RunFilter,
  RunStore,
  RunSuccessPatch,
} from "../ports";

export class InMemoryRunStore implements RunStore {
  readonly runs = new Map<string, AiRun>();
  /** Outbox: eventos publicados junto con el cambio de estado. */
  readonly events: AiEngineEvent[] = [];

  async createOrGet(run: NewAiRun): Promise<{ run: AiRun; created: boolean }> {
    if (run.idempotencyKey) {
      const existing = [...this.runs.values()].find(
        (r) => r.idempotencyKey === run.idempotencyKey && r.task === run.task,
      );
      if (existing) return { run: structuredClone(existing), created: false };
    }
    const created: AiRun = {
      status: "QUEUED",
      retrievedChunkIds: [],
      usage: { ...EMPTY_USAGE },
      attempts: 0,
      ...run,
    };
    this.runs.set(created.id, created);
    return { run: structuredClone(created), created: true };
  }

  async get(id: string): Promise<AiRun | null> {
    const run = this.runs.get(id);
    return run ? structuredClone(run) : null;
  }

  async markRunning(id: string, at: string): Promise<void> {
    const run = this.require(id);
    run.status = "RUNNING";
    run.startedAt = at;
  }

  async markSucceeded(id: string, patch: RunSuccessPatch, at: string, events: AiEngineEvent[]): Promise<void> {
    const run = this.require(id);
    Object.assign(run, patch, { status: patch.status ?? "SUCCEEDED", finishedAt: at });
    this.events.push(...events);
  }

  async markFailed(id: string, failure: RunFailure, at: string, events: AiEngineEvent[]): Promise<void> {
    const run = this.require(id);
    Object.assign(run, failure, { status: "FAILED", finishedAt: at });
    this.events.push(...events);
  }

  async findReusable(q: {
    task: AiRun["task"];
    inputSha256: string;
    modelId: string;
    promptVersion: string;
    isLab: boolean;
  }): Promise<AiRun | null> {
    const match = [...this.runs.values()]
      .filter(
        (r) =>
          r.task === q.task &&
          r.status === "SUCCEEDED" &&
          r.inputSha256 === q.inputSha256 &&
          r.modelId === q.modelId &&
          r.promptVersion === q.promptVersion &&
          r.isLab === q.isLab,
      )
      .at(-1);
    return match ? structuredClone(match) : null;
  }

  async list(filter: RunFilter): Promise<AiRun[]> {
    return [...this.runs.values()]
      .filter((r) => (filter.operationId ? r.operationId === filter.operationId : true))
      .filter((r) => (filter.task ? r.task === filter.task : true))
      .filter((r) => (filter.isLab == null ? true : r.isLab === filter.isLab))
      .reverse()
      .slice(0, filter.limit ?? 50)
      .map((r) => structuredClone(r));
  }

  private require(id: string): AiRun {
    const run = this.runs.get(id);
    if (!run) throw new Error(`Run ${id} no existe`);
    return run;
  }
}

const extractionKey = (k: ExtractionKey) =>
  `${k.fileSha256}|${k.ocrModel}|${k.schemaCode}|${k.schemaVersion}`;

export class InMemoryExtractionStore implements ExtractionStore {
  readonly extractions = new Map<string, DocumentExtraction>();
  readonly rawResponses = new Map<string, unknown>();
  readonly links = new Map<string, string>();

  async findByKey(key: ExtractionKey): Promise<DocumentExtraction | null> {
    const found = [...this.extractions.values()].find(
      (e) =>
        extractionKey({
          fileSha256: e.fileSha256,
          ocrModel: e.ocrModel,
          schemaCode: e.schemaCode,
          schemaVersion: e.schemaVersion,
        }) === extractionKey(key),
    );
    return found ? structuredClone(found) : null;
  }

  async save(extraction: DocumentExtraction, rawResponse?: unknown): Promise<DocumentExtraction> {
    const existing = await this.findByKey(extraction);
    if (existing) return existing;
    this.extractions.set(extraction.id, structuredClone(extraction));
    if (rawResponse !== undefined) this.rawResponses.set(extraction.id, rawResponse);
    return structuredClone(extraction);
  }

  async get(id: string): Promise<DocumentExtraction | null> {
    const found = this.extractions.get(id);
    return found ? structuredClone(found) : null;
  }

  async linkDocument(documentRef: string, extractionId: string): Promise<void> {
    this.links.set(documentRef, extractionId);
  }

  async findByDocumentRef(documentRef: string): Promise<DocumentExtraction | null> {
    const id = this.links.get(documentRef);
    return id ? this.get(id) : null;
  }
}

const lexicalTokens = (text: string) =>
  new Set(
    text
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length >= 2),
  );

function cosineDistance(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return 1 - dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

/** Emula la búsqueda híbrida RRF de pgvector (D7) en memoria. */
export class InMemoryKnowledgeStore implements KnowledgeStore {
  readonly sources = new Map<string, KnowledgeSource>();
  readonly chunks = new Map<string, KnowledgeChunk>();

  async indexInfo() {
    const retrievable = [...this.chunks.values()].filter((c) => {
      const s = this.sources.get(c.sourceId);
      return s && s.status !== "SUPERSEDED";
    });
    const first = retrievable[0];
    return first
      ? { embeddingModel: first.embeddingModel, embeddingDims: first.embeddingDims }
      : { embeddingModel: null, embeddingDims: 0 };
  }

  async nextVersion(code: string): Promise<number> {
    const versions = [...this.sources.values()].filter((s) => s.code === code).map((s) => s.version);
    return versions.length ? Math.max(...versions) + 1 : 1;
  }

  async saveSource(source: KnowledgeSource, chunks: KnowledgeChunk[]): Promise<void> {
    this.sources.set(source.id, structuredClone(source));
    for (const chunk of chunks) this.chunks.set(chunk.id, structuredClone(chunk));
  }

  async findEmbeddingsByHash(hashes: string[], model: string, dims: number): Promise<Map<string, number[]>> {
    const wanted = new Set(hashes);
    const found = new Map<string, number[]>();
    for (const chunk of this.chunks.values()) {
      if (wanted.has(chunk.contentSha256) && chunk.embeddingModel === model && chunk.embeddingDims === dims) {
        found.set(chunk.contentSha256, [...chunk.embedding]);
      }
    }
    return found;
  }

  async approveSource(sourceId: string, byUserId: string, at: string): Promise<void> {
    const source = this.sources.get(sourceId);
    if (!source) throw new Error(`Fuente ${sourceId} no existe`);
    for (const other of this.sources.values()) {
      if (other.code === source.code && other.id !== sourceId && other.status === "APPROVED") {
        other.status = "SUPERSEDED";
      }
    }
    Object.assign(source, { status: "APPROVED", approvedBy: byUserId, approvedAt: at });
  }

  async search(q: KnowledgeSearchQuery): Promise<{ hits: KnowledgeSearchHit[]; queryPlan?: string }> {
    const eligible = [...this.chunks.values()].filter((c) => {
      const s = this.sources.get(c.sourceId);
      if (!s || s.status === "SUPERSEDED") return false;
      if (s.status === "DRAFT" && !q.includeDrafts) return false;
      if (s.isLab && !q.includeLab) return false;
      return true;
    });

    const semantic = eligible
      .map((c) => ({ c, d: cosineDistance(q.embedding, c.embedding) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, q.candidateDepth);

    const queryTokens = lexicalTokens(q.text);
    const lexical = eligible
      .map((c) => {
        const tokens = lexicalTokens(`${c.contextHeader} ${c.content}`);
        let score = 0;
        for (const t of queryTokens) if (tokens.has(t)) score += 1;
        return { c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, q.candidateDepth);

    const byId = new Map<string, KnowledgeSearchHit>();
    const hitFor = (c: KnowledgeChunk): KnowledgeSearchHit => {
      const existing = byId.get(c.id);
      if (existing) return existing;
      const s = this.sources.get(c.sourceId)!;
      const hit: KnowledgeSearchHit = {
        chunkId: c.id,
        sourceId: s.id,
        sourceCode: s.code,
        sourceTitle: s.title,
        version: s.version,
        sectionPath: c.sectionPath,
        pageStart: c.pageStart,
        pageEnd: c.pageEnd,
        ordinal: c.ordinal,
        content: c.content,
        semanticRank: null,
        lexicalRank: null,
        semanticDistance: null,
        lexicalScore: null,
        fusedScore: 0,
      };
      byId.set(c.id, hit);
      return hit;
    };
    semantic.forEach(({ c, d }, i) => {
      const hit = hitFor(c);
      hit.semanticRank = i + 1;
      hit.semanticDistance = d;
      hit.fusedScore += q.semanticWeight / (60 + i + 1);
    });
    lexical.forEach(({ c, score }, i) => {
      const hit = hitFor(c);
      hit.lexicalRank = i + 1;
      hit.lexicalScore = score;
      hit.fusedScore += q.lexicalWeight / (60 + i + 1);
    });

    const hits = [...byId.values()].sort((a, b) => b.fusedScore - a.fusedScore).slice(0, q.limit);
    return q.includeQueryPlan ? { hits, queryPlan: "in-memory: sin plan" } : { hits };
  }

  async getChunks(ids: string[]) {
    return ids
      .map((id) => this.chunks.get(id))
      .filter((c): c is KnowledgeChunk => !!c)
      .map(({ embedding: _embedding, ...rest }) => structuredClone(rest));
  }

  async listSources(filter?: { isLab?: boolean }) {
    return [...this.sources.values()]
      .filter((s) => (filter?.isLab == null ? true : s.isLab === filter.isLab))
      .map((s) => structuredClone(s));
  }

  async listChunks(sourceId: string) {
    return [...this.chunks.values()]
      .filter((c) => c.sourceId === sourceId)
      .sort((a, b) => a.ordinal - b.ordinal)
      .map(({ embedding: _embedding, ...rest }) => structuredClone(rest));
  }
}

export class InMemoryResultCache implements ResultCache {
  readonly entries = new Map<string, unknown>();
  async get<T>(namespace: string, key: string): Promise<T | null> {
    const value = this.entries.get(`${namespace}:${key}`);
    return value === undefined ? null : (structuredClone(value) as T);
  }
  async put<T>(namespace: string, key: string, value: T): Promise<void> {
    this.entries.set(`${namespace}:${key}`, structuredClone(value));
  }
}
