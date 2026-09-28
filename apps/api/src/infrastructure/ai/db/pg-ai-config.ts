import type { Pool } from "pg";
import { resolveAiEngineConfig, type AiEngineConfig } from "@crece/ai-engine";

/** Secciones de `ai.config` que el motor lee al arrancar (clave = sección). */
const SECTIONS = ["models", "extraction", "prices"] as const;

/**
 * Última versión de cada sección en `ai.config`, mezclada sobre la semilla del motor.
 * Cambiar un modelo o parámetro es insertar una versión nueva (historial = auditoría) y
 * reiniciar la API y el worker.
 */
export async function loadAiEngineConfig(pool: Pool): Promise<AiEngineConfig> {
  const { rows } = await pool.query<{ key: string; value: Record<string, unknown> }>(
    `SELECT DISTINCT ON (key) key, value FROM ai.config
     WHERE key = ANY($1) ORDER BY key, version DESC`,
    [SECTIONS],
  );
  const overrides = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return resolveAiEngineConfig(overrides);
}

export async function setAiConfigSection(
  pool: Pool,
  key: (typeof SECTIONS)[number],
  value: Record<string, unknown>,
  updatedBy: string,
): Promise<number> {
  const { rows } = await pool.query<{ version: number }>(
    `INSERT INTO ai.config (key, version, value, updated_by)
     SELECT $1, COALESCE(MAX(version), 0) + 1, $2, $3 FROM ai.config WHERE key = $1
     RETURNING version`,
    [key, JSON.stringify(value), updatedBy],
  );
  return rows[0]!.version;
}
