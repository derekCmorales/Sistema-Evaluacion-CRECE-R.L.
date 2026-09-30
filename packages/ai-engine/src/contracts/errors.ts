import { DomainError } from "@crece/shared";

export const AI_ERROR_CODES = [
  "AI_DISABLED",
  "AI_FORBIDDEN",
  "AI_INPUT_UNSUPPORTED_TYPE",
  "AI_INPUT_TOO_LARGE",
  "AI_INPUT_ENCRYPTED",
  "AI_INPUT_CORRUPT",
  "AI_PROVIDER_TIMEOUT",
  "AI_PROVIDER_RATE_LIMITED",
  "AI_PROVIDER_AUTH",
  "AI_PROVIDER_ERROR",
  "AI_OUTPUT_INVALID",
  "AI_OUTPUT_FORBIDDEN",
  "AI_REINDEX_REQUIRED",
  "AI_NOT_FOUND",
  "AI_TASK_UNAVAILABLE",
  "AI_RUN_INTERRUPTED",
  "AI_INTERNAL",
] as const;

export type AiErrorCode = (typeof AI_ERROR_CODES)[number];

/** Errores que un reintento podría resolver. */
export const RETRYABLE_AI_ERROR_CODES: readonly AiErrorCode[] = [
  "AI_PROVIDER_TIMEOUT",
  "AI_PROVIDER_RATE_LIMITED",
  "AI_PROVIDER_ERROR",
  "AI_RUN_INTERRUPTED",
];

/**
 * Error del motor con código estable y mensaje es-GT. Nunca incluye material de
 * credenciales ni cuerpos crudos del proveedor.
 */
export class AiEngineError extends DomainError {
  constructor(
    readonly aiCode: AiErrorCode,
    message: string,
  ) {
    super(message, aiCode);
    this.name = "AiEngineError";
  }

  get retryable(): boolean {
    return RETRYABLE_AI_ERROR_CODES.includes(this.aiCode);
  }
}

export function isAiEngineError(error: unknown): error is AiEngineError {
  return error instanceof AiEngineError;
}
