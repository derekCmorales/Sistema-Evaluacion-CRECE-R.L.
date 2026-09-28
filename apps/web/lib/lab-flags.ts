/**
 * El laboratorio de IA solo existe fuera de producción y con AI_LAB_ENABLED=true (spec ai-lab).
 * Se evalúa en el servidor; la API aplica la misma regla por su lado.
 */
export function isLabEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.AI_LAB_ENABLED === "true";
}
