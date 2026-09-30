import type { AiEnv } from "../../../infrastructure/ai/ai-env";
import { FileSystemDocumentSource, LAB_REF_PREFIX } from "../../../infrastructure/ai/lab/fs-document-source";
import type { DocumentRoute } from "../../../infrastructure/ai/runtime";

/**
 * Lo que el laboratorio aporta al proceso: su almacenamiento local y la ruta de documentos
 * `lab/*` que el motor usa para leer lo que se sube. Solo lo crean los composition roots
 * (`app.module.ts`, `worker.ts`) y solo con el lab habilitado; nada más depende de esto.
 */
export type LabContext = {
  storage: FileSystemDocumentSource;
  retentionDays: number;
  documentRoute: DocumentRoute;
};

export function createLabContext(env: AiEnv): LabContext | null {
  if (!env.lab.enabled) return null;
  const storage = new FileSystemDocumentSource(env.lab.storageDir);
  return { storage, retentionDays: env.lab.retentionDays, documentRoute: { prefix: LAB_REF_PREFIX, source: storage } };
}
