/**
 * Configuración del motor. Los valores vivos vienen de `ai.config` (DB, versionada); estas
 * son SEMILLAS etiquetadas como tales (regla 8 de AGENTS.md). Nada de esto es regla de crédito.
 */
export type AiEngineConfig = {
  models: {
    /** Modelo OCR fijado (no alias) cuando se conozca el id; la extracción guarda el real. */
    ocr: string;
    llm: string;
    embedding: string;
  };
  extraction: {
    maxFileBytes: number;
    maxPages: number;
    /** Candidatos por debajo se marcan "Revisar: baja confianza" (nunca se confirman solos). */
    confidenceThreshold: number;
    imageMinSize: number;
    maxAttempts: number;
    /** Espera antes de cada reintento (ms); se usa el último si hay más intentos. */
    backoffMs: number[];
    rawRetentionDays: number;
  };
  prices: {
    /** USD por página de OCR. Provisional: verificar tabla vigente del proveedor. */
    ocrUsdPerPage: number;
  };
};

export const AI_ENGINE_CONFIG_SEED: AiEngineConfig = {
  models: {
    ocr: "mistral-ocr-latest",
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
  prices: {
    ocrUsdPerPage: 0.004,
  },
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]>) : T[K] };

/** Mezcla la configuración viva sobre la semilla (sin mutar la semilla). */
export function resolveAiEngineConfig(overrides: DeepPartial<AiEngineConfig> = {}): AiEngineConfig {
  return {
    models: { ...AI_ENGINE_CONFIG_SEED.models, ...overrides.models },
    extraction: { ...AI_ENGINE_CONFIG_SEED.extraction, ...overrides.extraction } as AiEngineConfig["extraction"],
    prices: { ...AI_ENGINE_CONFIG_SEED.prices, ...overrides.prices },
  };
}
