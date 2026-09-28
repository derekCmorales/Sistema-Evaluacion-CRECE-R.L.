import { createHash, randomUUID } from "node:crypto";
import type { Clock, Delay, DocumentSource, Hasher, IdGenerator, StoredDocument } from "@crece/ai-engine";

export const systemClock: Clock = { now: () => new Date() };

export const uuidGenerator: IdGenerator = { newId: () => randomUUID() };

export const nodeHasher: Hasher = {
  sha256Hex: (data) => createHash("sha256").update(data).digest("hex"),
};

export const timerDelay: Delay = {
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/**
 * Enruta referencias de documentos: `lab/*` al almacenamiento local del laboratorio y el resto
 * a la fuente del anfitrión (R2, a cargo de las fases 1–3). Sin fuente del anfitrión aún, esas
 * referencias no existen para el motor.
 */
export class RoutingDocumentSource implements DocumentSource {
  constructor(
    private readonly lab: DocumentSource | null,
    private readonly host: DocumentSource | null,
  ) {}

  async get(ref: string): Promise<StoredDocument | null> {
    if (ref.startsWith("lab/")) return this.lab ? this.lab.get(ref) : null;
    return this.host ? this.host.get(ref) : null;
  }
}
