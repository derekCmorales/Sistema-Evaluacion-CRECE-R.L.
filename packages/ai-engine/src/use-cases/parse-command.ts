import { ValidationError } from "@crece/shared";
import type { z } from "zod";

/** Valida un comando en la frontera; un error de forma es 400 con los campos, no un 500. */
export function parseCommand<S extends z.ZodType>(schema: S, raw: unknown): z.output<S> {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  const detail = result.error.issues
    .map((issue) => (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message))
    .join("; ");
  throw new ValidationError(`Solicitud inválida — ${detail}`);
}
