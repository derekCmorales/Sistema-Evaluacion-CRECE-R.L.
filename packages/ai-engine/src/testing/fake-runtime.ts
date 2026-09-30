import type { CaseSnapshot } from "../contracts/case-snapshot";
import type {
  AiJob,
  CaseSnapshotSource,
  Clock,
  Delay,
  DocumentSource,
  EngineLogger,
  LogLevel,
  Hasher,
  IdGenerator,
  JobQueue,
  StoredDocument,
  Transaction,
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

/** Logger que guarda cada registro para asertarlo. */
export class RecordingLogger implements EngineLogger {
  readonly entries: Array<{ level: LogLevel; event: string; fields: Record<string, string | number | boolean | null> }> = [];
  log(level: LogLevel, event: string, fields: Record<string, string | number | boolean | null>): void {
    this.entries.push({ level, event, fields });
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
  /** Transacción con la que llegó cada trabajo (para asertar que se encoló dentro de una). */
  readonly transactions: Array<Transaction | undefined> = [];
  /** Si se programa, el próximo `enqueue` falla (para probar el rollback de la admisión). */
  failNext: Error | null = null;

  async enqueue(job: AiJob, tx?: Transaction): Promise<void> {
    if (this.failNext) {
      const error = this.failNext;
      this.failNext = null;
      throw error;
    }
    if (this.jobs.some((j) => j.runId === job.runId)) return; // mismo run: no se duplica
    this.jobs.push(job);
    this.transactions.push(tx);
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
