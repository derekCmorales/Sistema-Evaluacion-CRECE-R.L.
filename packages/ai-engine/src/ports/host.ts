import type { CaseSnapshot } from "../contracts/case-snapshot";

/** Puertos que implementa el anfitrión (fases 1–3). El motor nunca lee tablas del núcleo. */

export type StoredDocument = {
  ref: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
};

/** R2 en producción; sistema de archivos local en el lab. */
export type DocumentSource = {
  get(ref: string): Promise<StoredDocument | null>;
};

/** Snapshot minimizado y de solo lectura de una operación. */
export type CaseSnapshotSource = {
  get(operationId: string): Promise<CaseSnapshot | null>;
};
