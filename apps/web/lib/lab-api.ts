/**
 * Cliente HTTP del laboratorio de IA. La web no importa el motor: estos tipos describen el
 * contrato JSON de `apps/api` (`/lab/ia/*`), nada más.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type LabDocumentType = {
  type: string;
  label: string;
  schemaCode: string;
  schemaVersion: number;
  classifiesImages: boolean;
  fields: Array<{ key: string; label: string }>;
};

export type LabMeta = {
  documentTypes: LabDocumentType[];
  limits: { maxFileBytes: number; maxPages: number };
  models: { ocr: string; llm: string; embedding: string };
  retentionDays: number;
  notice: string;
};

export type RunStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "REUSED";

export type LabRun = {
  id: string;
  task: string;
  status: RunStatus;
  documentRef?: string;
  modelId?: string;
  attempts: number;
  latencyMs?: number;
  costEstimateUsd?: number;
  errorCode?: string;
  errorMessage?: string;
  output?: { extractionId?: string; pages?: number; candidateCount?: number; needsAttentionCount?: number; reused?: boolean };
  createdAt: string;
  finishedAt?: string;
};

export type LabCandidate = {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  value: string;
  page?: number;
  confidence?: number;
  needsAttention: boolean;
  attentionReason?: string;
};

export type LabExtraction = {
  id: string;
  ocrModel: string;
  documentType: string;
  schemaCode: string;
  schemaVersion: number;
  pages: Array<{ index: number; text: string; header?: string; footer?: string; confidence?: number; tableContinuesFromPrevious?: boolean }>;
  candidates: LabCandidate[];
  images: Array<{ page: number; id: string; kind: string; relevant: boolean; description: string }>;
  createdAt: string;
};

export class LabApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init });
  } catch {
    throw new LabApiError(0, "No hay conexión con la API. Revisa que esté corriendo en " + API_URL);
  }
  if (response.status === 404 && path === "/lab/ia/meta") {
    throw new LabApiError(404, "El laboratorio está apagado en la API (AI_ENGINE_ENABLED y AI_LAB_ENABLED deben ser true).");
  }
  const body = (await response.json().catch(() => ({}))) as { message?: string | string[]; code?: string };
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message.join(" · ") : body.message;
    throw new LabApiError(response.status, message ?? `Error ${response.status}`, body.code);
  }
  return body as T;
}

export const labApi = {
  meta: () => request<LabMeta>("/lab/ia/meta"),
  runs: (task?: string) => request<LabRun[]>(`/lab/ia/runs${task ? `?task=${encodeURIComponent(task)}` : ""}`),
  run: (id: string) => request<LabRun>(`/lab/ia/runs/${id}`),
  extraction: (id: string) => request<LabExtraction>(`/lab/ia/extractions/${id}`),
  upload(file: File, documentType: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", documentType);
    return request<{ runId: string; status: RunStatus; documentRef: string; fileName: string }>("/lab/ia/documents", {
      method: "POST",
      body: form,
    });
  },
  fileUrl: (documentRef: string) => `${API_URL}/lab/ia/documents/${documentRef.replace(/^lab\//, "")}/file`,
};

export const TERMINAL_STATUSES: RunStatus[] = ["SUCCEEDED", "REUSED", "FAILED"];

/** Consulta el run cada `intervalMs` hasta que termine (o se cancele). */
export async function waitForRun(
  runId: string,
  onUpdate: (run: LabRun) => void,
  signal: AbortSignal,
  intervalMs = 1500,
): Promise<LabRun> {
  for (;;) {
    const run = await labApi.run(runId);
    onUpdate(run);
    if (TERMINAL_STATUSES.includes(run.status)) return run;
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, intervalMs);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("cancelado", "AbortError"));
      });
    });
  }
}

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  QUEUED: "En cola",
  RUNNING: "Procesando",
  SUCCEEDED: "Listo",
  REUSED: "Reutilizado",
  FAILED: "Falló",
};

export const RUN_STATUS_TONE: Record<RunStatus, "info" | "success" | "warning" | "danger" | "neutral"> = {
  QUEUED: "neutral",
  RUNNING: "info",
  SUCCEEDED: "success",
  REUSED: "success",
  FAILED: "danger",
};

export const TASK_LABELS: Record<string, string> = {
  EXTRACT: "Extracción",
  INGEST: "Ingesta de política",
  SEARCH: "Búsqueda",
  DRAFT_5C: "Borrador 5C",
  REVIEW: "Análisis de revisión",
  EVAL: "Evaluación",
};

export const IMAGE_KIND_LABELS: Record<string, string> = {
  LOGO: "Logo",
  DECORATION: "Decoración",
  SIGNATURE: "Firma",
  SEAL: "Sello",
  SKETCH: "Croquis",
  BUSINESS_PHOTO: "Foto del negocio",
  CHART: "Gráfica",
  TABLE_SCAN: "Tabla escaneada",
  ID_PHOTO: "Foto de identificación",
  OTHER: "Otra",
};

export function formatUsd(value?: number): string {
  if (value == null) return "—";
  return `US$${value.toFixed(value < 0.01 ? 4 : 2)}`;
}

export function formatSeconds(ms?: number): string {
  return ms == null ? "—" : `${(ms / 1000).toFixed(1)} s`;
}
