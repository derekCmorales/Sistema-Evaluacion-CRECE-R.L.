import type { OcrDocument } from "../contracts/ocr";
import { EMPTY_USAGE } from "../contracts/common";
import type {
  EmbeddingInput,
  EmbeddingProvider,
  LlmProvider,
  LlmRequest,
  LlmResponse,
  OcrProvider,
  OcrRequest,
} from "../ports";

type OcrScript = OcrDocument | Error | ((request: OcrRequest) => OcrDocument | Promise<OcrDocument>);

/** OCR guionado: devuelve lo programado por nombre de archivo, o el guion por defecto. */
export class FakeOcrProvider implements OcrProvider {
  readonly calls: OcrRequest[] = [];
  private readonly byFileName = new Map<string, OcrScript[]>();
  constructor(
    readonly modelId = "fake-ocr-1",
    private readonly fallback?: OcrScript,
  ) {}

  script(fileName: string, ...responses: OcrScript[]): this {
    this.byFileName.set(fileName, responses);
    return this;
  }

  async extract(request: OcrRequest): Promise<OcrDocument> {
    this.calls.push(request);
    const queue = this.byFileName.get(request.fileName);
    const next = queue && queue.length > 1 ? queue.shift()! : (queue?.[0] ?? this.fallback);
    if (!next) throw new Error(`FakeOcrProvider sin guion para ${request.fileName}`);
    if (next instanceof Error) throw next;
    return typeof next === "function" ? next(request) : structuredClone(next);
  }
}

const normalizeToken = (t: string) =>
  t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Bolsa de palabras con hashing: similitud semántica burda pero determinística. */
export function bagOfWordsVector(text: string, dimensions: number): number[] {
  const vector = new Array<number>(dimensions).fill(0);
  for (const raw of text.split(/[^\p{L}\p{N}]+/u)) {
    if (raw.length < 3) continue;
    const token = normalizeToken(raw);
    let h = 2166136261;
    for (let i = 0; i < token.length; i += 1) {
      h ^= token.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    vector[Math.abs(h) % dimensions]! += 1;
  }
  const norm = Math.hypot(...vector) || 1;
  return vector.map((v) => v / norm);
}

export class FakeEmbeddingProvider implements EmbeddingProvider {
  readonly documentCalls: EmbeddingInput[][] = [];
  readonly queryCalls: string[] = [];
  constructor(readonly modelId = "fake-embedding-1") {}

  async embedDocuments(items: EmbeddingInput[], dimensions: number) {
    this.documentCalls.push(items);
    return {
      vectors: items.map((item) => bagOfWordsVector(`${item.title} ${item.text}`, dimensions)),
      inputTokens: items.reduce((sum, item) => sum + Math.ceil((item.title.length + item.text.length) / 4), 0),
    };
  }

  async embedQuery(text: string, dimensions: number) {
    this.queryCalls.push(text);
    return { vector: bagOfWordsVector(text, dimensions), inputTokens: Math.ceil(text.length / 4) };
  }
}

type LlmScript = Partial<LlmResponse> & { rawText: string } | Error | ((request: LlmRequest) => LlmResponse);

/** LLM guionado: consume respuestas en orden y registra cada solicitud. */
export class FakeLlmProvider implements LlmProvider {
  readonly requests: LlmRequest[] = [];
  private readonly queue: LlmScript[] = [];

  respond(...responses: LlmScript[]): this {
    this.queue.push(...responses);
    return this;
  }

  async generateStructured(request: LlmRequest): Promise<LlmResponse> {
    this.requests.push(request);
    const next = this.queue.shift();
    if (!next) throw new Error("FakeLlmProvider sin respuestas programadas");
    if (next instanceof Error) throw next;
    if (typeof next === "function") return next(request);
    return { finishReason: "STOP", usage: { ...EMPTY_USAGE }, ...next };
  }
}
