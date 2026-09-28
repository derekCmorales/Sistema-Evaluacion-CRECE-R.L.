import { isAbsolute, resolve } from "node:path";
import { z } from "zod";

const Flag = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const Int = (min: number, max: number, fallback: number) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (v == null || v.trim() === "") return fallback;
      const n = Number(v);
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: `debe ser un entero entre ${min} y ${max}` });
        return z.NEVER;
      }
      return n;
    });

const Optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

/**
 * Variables de entorno del motor de IA (design D3/D15). Secretos e infraestructura solo;
 * modelos, parámetros y umbrales viven en `ai.config`.
 */
const AiEnvSchema = z
  .object({
    NODE_ENV: z.string().default("development"),
    AI_ENGINE_ENABLED: Flag,
    AI_WORKER: Flag,
    AI_LAB_ENABLED: Flag,
    AI_LAB_RETENTION_DAYS: Int(1, 365, 7),
    AI_LAB_STORAGE_DIR: z.string().default(".lab-storage"),
    AI_GOOGLE_BACKEND: z.enum(["agent-platform", "developer-api"]).default("agent-platform"),
    AI_GOOGLE_AUTH: z.enum(["api-key", "adc"]).default("api-key"),
    AI_GOOGLE_API_KEY: Optional,
    AI_GOOGLE_PROJECT: Optional,
    AI_GOOGLE_LOCATION: Optional,
    MISTRAL_API_KEY: Optional,
    /** Global: fija la columna halfvec(N); cambiarla exige reindexar (D7). */
    AI_EMBEDDING_DIMENSIONS: Int(128, 2000, 1536),
    AI_DATABASE_URL: Optional,
    DATABASE_URL: Optional,
  })
  .superRefine((env, ctx) => {
    if (!env.AI_ENGINE_ENABLED) return;
    const missing: string[] = [];
    if (!env.AI_DATABASE_URL && !env.DATABASE_URL) missing.push("AI_DATABASE_URL o DATABASE_URL");
    if (!env.MISTRAL_API_KEY) missing.push("MISTRAL_API_KEY");
    if (env.AI_GOOGLE_AUTH === "api-key" && !env.AI_GOOGLE_API_KEY) missing.push("AI_GOOGLE_API_KEY");
    if (env.AI_GOOGLE_AUTH === "adc" && env.AI_GOOGLE_BACKEND === "agent-platform" && !env.AI_GOOGLE_PROJECT) {
      missing.push("AI_GOOGLE_PROJECT (requerido con AI_GOOGLE_AUTH=adc)");
    }
    if (env.AI_GOOGLE_BACKEND === "developer-api" && env.AI_GOOGLE_AUTH === "adc") {
      ctx.addIssue({ code: "custom", message: "developer-api solo admite AI_GOOGLE_AUTH=api-key" });
    }
    if (missing.length) {
      ctx.addIssue({ code: "custom", message: `Faltan variables para el motor de IA: ${missing.join(", ")}` });
    }
  });

export type AiEnv = {
  nodeEnv: string;
  isProduction: boolean;
  engineEnabled: boolean;
  worker: boolean;
  lab: { enabled: boolean; retentionDays: number; storageDir: string };
  google: {
    backend: "agent-platform" | "developer-api";
    auth: "api-key" | "adc";
    apiKey?: string;
    project?: string;
    location?: string;
  };
  mistralApiKey?: string;
  embeddingDimensions: number;
  databaseUrl?: string;
};

export class AiEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiEnvError";
  }
}

/** Lee y valida el entorno. Los mensajes nombran variables, nunca valores. */
export function loadAiEnv(source: Record<string, string | undefined> = process.env, cwd = process.cwd()): AiEnv {
  const parsed = AiEnvSchema.safeParse(source);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message))
      .join("; ");
    throw new AiEnvError(`Configuración del motor de IA inválida — ${detail}`);
  }
  const env = parsed.data;
  const isProduction = env.NODE_ENV === "production";
  return {
    nodeEnv: env.NODE_ENV,
    isProduction,
    engineEnabled: env.AI_ENGINE_ENABLED,
    worker: env.AI_WORKER,
    lab: {
      // El lab nunca existe en producción, aunque el flag esté activo (spec ai-lab).
      enabled: env.AI_LAB_ENABLED && !isProduction,
      retentionDays: env.AI_LAB_RETENTION_DAYS,
      storageDir: isAbsolute(env.AI_LAB_STORAGE_DIR) ? env.AI_LAB_STORAGE_DIR : resolve(cwd, env.AI_LAB_STORAGE_DIR),
    },
    google: {
      backend: env.AI_GOOGLE_BACKEND,
      auth: env.AI_GOOGLE_AUTH,
      apiKey: env.AI_GOOGLE_API_KEY,
      project: env.AI_GOOGLE_PROJECT,
      location: env.AI_GOOGLE_LOCATION,
    },
    mistralApiKey: env.MISTRAL_API_KEY,
    embeddingDimensions: env.AI_EMBEDDING_DIMENSIONS,
    databaseUrl: env.AI_DATABASE_URL ?? env.DATABASE_URL,
  };
}
