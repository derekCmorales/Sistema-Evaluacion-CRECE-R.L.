import { AiEngineError, isAiEngineError } from "../contracts/errors";
import type { Delay } from "../ports";

export type RetryPolicy = { maxAttempts: number; backoffMs: number[] };

/** Un error desconocido de un adaptador se trata como error del proveedor (reintentable). */
export function toAiEngineError(error: unknown): AiEngineError {
  if (isAiEngineError(error)) return error;
  return new AiEngineError("AI_PROVIDER_ERROR", "El proveedor de IA devolvió un error inesperado");
}

export class RetriesExhaustedError extends Error {
  constructor(
    readonly last: AiEngineError,
    readonly attempts: number,
  ) {
    super(last.message);
  }
}

/**
 * Reintenta solo errores reintentables (timeout, límite de tasa, error del proveedor), con
 * espera creciente. Un error no reintentable (credenciales, entrada inválida) corta de inmediato.
 */
export async function withRetries<T>(
  operation: (attempt: number) => Promise<T>,
  policy: RetryPolicy,
  delay: Delay,
): Promise<{ value: T; attempts: number }> {
  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      return { value: await operation(attempt), attempts: attempt };
    } catch (raw) {
      const error = toAiEngineError(raw);
      if (!error.retryable || attempt >= policy.maxAttempts) {
        throw new RetriesExhaustedError(error, attempt);
      }
      const wait = policy.backoffMs[Math.min(attempt - 1, policy.backoffMs.length - 1)] ?? 0;
      await delay.wait(wait);
    }
  }
}
