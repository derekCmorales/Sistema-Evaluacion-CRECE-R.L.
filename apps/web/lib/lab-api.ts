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

export type LabStatus = {
  enabled: boolean;
  queued: number;
  running: number;
  oldestQueuedAt: string | null;
  workersOnline: number;
  workerLastSeenAt: string | null;
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
  retryOf?: string;
  output?: {
    extractionId?: string;
    pages?: number;
    candidateCount?: number;
    needsAttentionCount?: number;
    injectionSuspected?: boolean;
    reused?: boolean;
  };
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

export type LabInjectionSignal = { patternId: string; excerpt: string };

export type LabExtraction = {
  id: string;
  ocrModel: string;
  documentType: string;
  schemaCode: string;
  schemaVersion: number;
  pipelineFingerprint: string;
  injectionSuspected: boolean;
  pages: Array<{
    index: number;
    text: string;
    header?: string;
    footer?: string;
    confidence?: number;
    tableContinuesFromPrevious?: boolean;
    injectionSignals?: LabInjectionSignal[];
  }>;
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

type Accepted = { runId: string; status: RunStatus; reused: boolean };

export const labApi = {
  meta: () => request<LabMeta>("/lab/ia/meta"),
  status: () => request<LabStatus>("/lab/ia/status"),
  runs: (task?: string) => request<LabRun[]>(`/lab/ia/runs${task ? `?task=${encodeURIComponent(task)}` : ""}`),
  run: (id: string) => request<LabRun>(`/lab/ia/runs/${id}`),
  retry: (id: string) => request<Accepted>(`/lab/ia/runs/${id}/retry`, { method: "POST" }),
  extraction: (id: string) => request<LabExtraction>(`/lab/ia/extractions/${id}`),
  upload(file: File, documentType: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", documentType);
    return request<Accepted & { documentRef: string; fileName: string }>("/lab/ia/documents", {
      method: "POST",
      body: form,
    });
  },
  fileUrl: (documentRef: string) => `${API_URL}/lab/ia/documents/${documentRef.replace(/^lab\//, "")}/file`,
};

export const TERMINAL_STATUSES: RunStatus[] = ["SUCCEEDED", "REUSED", "FAILED"];

/** Pasado este tiempo sin terminar, la vista deja de consultar y sugiere revisar el worker. */
const MAX_WAIT_MS = 10 * 60 * 1000;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("cancelado", "AbortError"));
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("cancelado", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/** Consulta el run cada `intervalMs` hasta que termine, se cancele o pase el tiempo máximo. */
export async function waitForRun(
  runId: string,
  onUpdate: (run: LabRun) => void,
  signal: AbortSignal,
  intervalMs = 1500,
): Promise<LabRun> {
  const started = Date.now();
  for (;;) {
    const run = await labApi.run(runId);
    onUpdate(run);
    if (TERMINAL_STATUSES.includes(run.status)) return run;
    if (Date.now() - started > MAX_WAIT_MS) {
      throw new LabApiError(0, "La ejecución sigue sin terminar tras 10 minutos. Revisa que el worker esté corriendo y recarga.");
    }
    await sleep(intervalMs, signal);
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

export const INJECTION_PATTERN_LABELS: Record<string, string> = {
  "ignore-instructions": "Pide ignorar instrucciones",
  "forget-instructions": "Pide olvidar instrucciones",
  "role-override": "Intenta cambiar el rol de la IA",
  "system-prompt": "Menciona el prompt del sistema",
  "output-control": "Dicta la respuesta",
  "decision-request": "Pide aprobar o recomendar",
  "addressed-to-ai": "Mensaje dirigido a la IA",
  "score-request": "Pide un puntaje",
  "bidi-control": "Texto oculto u ofuscado",
};

export function formatUsd(value?: number): string {
  if (value == null) return "—";
  return `US$${value.toFixed(value < 0.01 ? 4 : 2)}`;
}

export function formatSeconds(ms?: number): string {
  return ms == null ? "—" : `${(ms / 1000).toFixed(1)} s`;
}
