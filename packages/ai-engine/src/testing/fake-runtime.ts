import type { CaseSnapshot } from "../contracts/case-snapshot";
import type {
  AiJob,
  CaseSnapshotSource,
  Clock,
  Delay,
  DocumentSource,
  Hasher,
  IdGenerator,
  JobQueue,
  StoredDocument,
} from "../ports";

export class FixedClock implements Clock {
  private current: Date;
  constructor(iso = "2026-09-28T10:00:00.000Z") {
    this.current = new Date(iso);
  }
  now(): Date {
    return new Date(this.current);
  }
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

/** No duerme: registra las esperas pedidas para poder asertarlas. */
export class RecordingDelay implements Delay {
  readonly waits: number[] = [];
  async wait(ms: number): Promise<void> {
    this.waits.push(ms);
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private n = 0;
  constructor(private readonly prefix = "id") {}
  newId(): string {
    this.n += 1;
    return `${this.prefix}-${this.n}`;
  }
}

/** FNV-1a 64 bits: determinístico y sin IO. Solo para pruebas (no criptográfico). */
export class FakeHasher implements Hasher {
  sha256Hex(data: Uint8Array | string): string {
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    let hash = 0xcbf29ce484222325n;
    for (const byte of bytes) {
      hash ^= BigInt(byte);
      hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
    }
    return hash.toString(16).padStart(16, "0").repeat(4);
  }
}

export class InMemoryJobQueue implements JobQueue {
  readonly jobs: AiJob[] = [];
  async enqueue(job: AiJob): Promise<void> {
    this.jobs.push(job);
  }
  /** Ejecuta y vacía los trabajos pendientes, en orden. */
  async drain(handler: (job: AiJob) => Promise<void>): Promise<void> {
    while (this.jobs.length > 0) {
      const job = this.jobs.shift()!;
      await handler(job);
    }
  }
}

export class InMemoryDocumentSource implements DocumentSource {
  private readonly docs = new Map<string, StoredDocument>();
  put(doc: StoredDocument): void {
    this.docs.set(doc.ref, doc);
  }
  async get(ref: string): Promise<StoredDocument | null> {
    return this.docs.get(ref) ?? null;
  }
}

export class InMemoryCaseSnapshotSource implements CaseSnapshotSource {
  private readonly snapshots = new Map<string, CaseSnapshot>();
  put(snapshot: CaseSnapshot): void {
    this.snapshots.set(snapshot.operationId, snapshot);
  }
  async get(operationId: string): Promise<CaseSnapshot | null> {
    const snapshot = this.snapshots.get(operationId);
    return snapshot ? structuredClone(snapshot) : null;
  }
}
