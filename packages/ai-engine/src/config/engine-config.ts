import { z } from "zod";

/**
 * Configuración del motor. Los valores vivos vienen de `ai.config` (DB, versionada); estas
 * son SEMILLAS etiquetadas como tales (regla 8 de AGENTS.md). Nada de esto es regla de crédito.
 */

/** Un id de modelo fijado: nunca un alias móvil (la deduplicación y la reproducibilidad dependen de él). */
const PinnedModelId = z
  .string()
  .min(1)
  .refine((id) => !/(^|[-_.])latest$/i.test(id), {
    message: "debe ser una versión fijada, no un alias «latest»",
  });

const InjectionPatternSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "kebab-case"),
  /** Expresión regular sobre texto normalizado: minúsculas, sin acentos, NFKC, espacios simples. */
  pattern: z.string().min(1).refine(
    (source) => {
      try {
        new RegExp(source, "u");
        return true;
      } catch {
        return false;
      }
    },
    { message: "expresión regular inválida" },
  ),
});
export type InjectionPattern = z.infer<typeof InjectionPatternSchema>;

const Positive = z.number().positive();
const PositiveInt = z.number().int().positive();

export const AiEngineConfigSchema = z.object({
  models: z.object({
    ocr: PinnedModelId,
    llm: PinnedModelId,
    embedding: PinnedModelId,
  }),
  extraction: z.object({
    maxFileBytes: PositiveInt,
    maxPages: PositiveInt,
    /** Candidatos por debajo se marcan "Revisar: baja confianza" (nunca se confirman solos). */
    confidenceThreshold: z.number().min(0).max(1),
    imageMinSize: z.number().int().nonnegative(),
    maxAttempts: PositiveInt,
    /** Espera antes de cada reintento (ms); se usa el último si hay más intentos. */
    backoffMs: z.array(z.number().int().nonnegative()).min(1),
    rawRetentionDays: PositiveInt,
  }),
  runs: z.object({
    /**
     * Plazo de un reclamo: si un worker no termina en este tiempo, otro puede retomar la
     * ejecución. Debe superar la duración máxima de una tarea (reintentos incluidos) y coincide
     * con la expiración del trabajo en la cola.
     */
    leaseSeconds: PositiveInt,
    /** Pasado este tiempo sin terminar, una ejecución se marca FAILED (interrumpida) y se puede reintentar. */
    stalledAfterSeconds: PositiveInt,
    /** Trabajos simultáneos por proceso worker. */
    workerConcurrency: z.number().int().min(1).max(32),
  }),
  prices: z.object({
    /** USD por página de OCR sin anotaciones. Verificar tabla vigente del proveedor. */
    ocrUsdPerPage: Positive,
    /** USD por página cuando se piden anotaciones (campos o clasificación de imágenes). */
    ocrAnnotatedUsdPerPage: Positive,
  }),
  safety: z.object({
    injectionPatterns: z.array(InjectionPatternSchema).min(1),
  }),
});

export type AiEngineConfig = z.infer<typeof AiEngineConfigSchema>;

/** SEMILLA: patrones de instrucciones dirigidas a una IA, en español e inglés. */
const INJECTION_PATTERNS_SEED: InjectionPattern[] = [
  { id: "ignore-instructions", pattern: "\\b(ignora|ignorar|ignore|disregard|omite|omitir)\\b.{0,40}\\b(instrucciones|indicaciones|reglas|instructions|rules|prompt)\\b" },
  { id: "forget-instructions", pattern: "\\b(olvida|olvidar|forget)\\b.{0,40}\\b(instrucciones|reglas|anterior|instructions|rules|above)\\b" },
  { id: "role-override", pattern: "\\b(eres|actua como|actuas como|a partir de ahora eres|you are now|act as|pretend to be)\\b.{0,30}\\b(asistente|modelo|ia|inteligencia artificial|assistant|model|ai|chatbot)\\b" },
  { id: "system-prompt", pattern: "\\b(system prompt|prompt del sistema|instrucciones del sistema|mensaje del sistema|developer message)\\b" },
  { id: "output-control", pattern: "\\b(responde|contesta|respond|answer|reply)\\b.{0,20}\\b(solo|unicamente|only|exclusivamente)\\b" },
  // Imperativo dirigido al lector ("recomienda aprobar este crédito"); excluye la pasiva de una
  // carta de resolución legítima ("se aprueba el crédito").
  { id: "decision-request", pattern: "(?<!\\bse )\\b(recomienda|recomiende|aprueba|apruebe|approve|recommend)\\b.{0,30}\\b(este|el|la|this|the)\\s(credito|prestamo|solicitud|loan|credit|application)\\b" },
  { id: "addressed-to-ai", pattern: "\\b(nota|mensaje|instruccion|aviso|note|message)\\b.{0,20}\\b(para|to|for)\\b.{0,10}\\b(la ia|el modelo|el asistente|inteligencia artificial|chatgpt|gemini|claude|the ai|the model|llm)\\b" },
  { id: "score-request", pattern: "\\b(asigna|asignale|pon|ponle|da|dale|assign|give)\\b.{0,30}\\b(puntaje|calificacion|score|rating)\\b" },
];

export const AI_ENGINE_CONFIG_SEED: AiEngineConfig = {
  models: {
    // Mistral OCR 4.1 (GA 2026-08-31). Fijado: el alias «latest» cambia de modelo sin aviso.
    ocr: "mistral-ocr-4-1",
    llm: "gemini-3.8-flash",
    embedding: "gemini-embedding-2",
  },
  extraction: {
    maxFileBytes: 20 * 1024 * 1024,
    maxPages: 60,
    confidenceThreshold: 0.8,
    imageMinSize: 64,
    maxAttempts: 3,
    backoffMs: [2_000, 8_000],
    rawRetentionDays: 30,
  },
  runs: {
    leaseSeconds: 15 * 60,
    stalledAfterSeconds: 60 * 60,
    workerConcurrency: 2,
  },
  prices: {
    // Tabla pública de Mistral OCR 4.1 (sep 2026): US$4 / 1,000 páginas; US$5 / 1,000 con anotaciones.
    ocrUsdPerPage: 0.004,
    ocrAnnotatedUsdPerPage: 0.005,
  },
  safety: {
    injectionPatterns: INJECTION_PATTERNS_SEED,
  },
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]>) : T[K] };
export type AiEngineConfigOverrides = DeepPartial<AiEngineConfig>;

export class AiEngineConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiEngineConfigError";
  }
}

/**
 * Mezcla la configuración viva sobre la semilla (sin mutarla) y la valida completa: un valor
 * inválido en `ai.config` impide arrancar con un mensaje que nombra la clave, nunca falla a mitad de una tarea.
 */
export function resolveAiEngineConfig(overrides: AiEngineConfigOverrides = {}): AiEngineConfig {
  const seed = AI_ENGINE_CONFIG_SEED;
  const merged = {
    models: { ...seed.models, ...overrides.models },
    extraction: { ...seed.extraction, ...overrides.extraction },
    runs: { ...seed.runs, ...overrides.runs },
    prices: { ...seed.prices, ...overrides.prices },
    safety: { ...seed.safety, ...overrides.safety },
  };
  const parsed = AiEngineConfigSchema.safeParse(merged);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new AiEngineConfigError(`Configuración del motor de IA inválida — ${detail}`);
  }
  if (parsed.data.runs.stalledAfterSeconds <= parsed.data.runs.leaseSeconds) {
    throw new AiEngineConfigError(
      "Configuración del motor de IA inválida — runs.stalledAfterSeconds debe superar runs.leaseSeconds",
    );
  }
  return parsed.data;
}
