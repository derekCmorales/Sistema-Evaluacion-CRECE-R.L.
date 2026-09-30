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

/** Una fuente adicional de documentos para las referencias que empiezan con `prefix`. */
export type DocumentRoute = { prefix: string; source: DocumentSource };

/**
 * Enruta referencias de documentos: las que coinciden con una ruta registrada van a su fuente
 * (p. ej. almacenamiento de pruebas) y el resto a la fuente del anfitrión (R2, a cargo de las
 * fases 1–3). Sin fuente del anfitrión aún, esas referencias no existen para el motor.
 */
export class RoutingDocumentSource implements DocumentSource {
  constructor(
    private readonly routes: DocumentRoute[],
    private readonly host: DocumentSource | null,
  ) {}

  async get(ref: string): Promise<StoredDocument | null> {
    const route = this.routes.find((r) => ref.startsWith(r.prefix));
    if (route) return route.source.get(ref);
    return this.host ? this.host.get(ref) : null;
  }
}
