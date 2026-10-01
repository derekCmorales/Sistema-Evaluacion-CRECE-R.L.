import { Pool, types, type CustomTypesConfig } from "pg";

/**
 * Parsers solo para el pool del motor: numeric → number (costos) e int8 → number (bigserial del
 * outbox), valores pequeños y acotados. No se tocan los parsers globales de `pg`: otro código del
 * proceso (p. ej. montos del núcleo con Prisma sobre `pg`) debe seguir recibiendo numeric como
 * texto exacto.
 */
export const AI_PG_TYPES: CustomTypesConfig = {
  getTypeParser: ((oid: number, format?: "text" | "binary") => {
    if (oid === types.builtins.NUMERIC || oid === types.builtins.INT8) return (value: string) => Number(value);
    return types.getTypeParser(oid, format);
  }) as CustomTypesConfig["getTypeParser"],
};

/** Pool del esquema `ai`. El resto de la API lo trata como recurso opaco (el SDK queda en infraestructura). */
export type AiPool = Pool;

export function createAiPool(databaseUrl: string, max = 5): AiPool {
  const pool = new Pool({
    connectionString: databaseUrl,
    max,
    application_name: "crece-ai-engine",
    idleTimeoutMillis: 30_000,
    types: AI_PG_TYPES,
  });
  // Una conexión inactiva que el servidor cierra (reinicio, failover) no debe tumbar el proceso:
  // el pool la descarta y abre otra en la siguiente consulta. Solo el mensaje, nunca la URL.
  pool.on("error", (error) => {
    console.error(`[ai-db] conexión inactiva cerrada por el servidor: ${error.message}`);
  });
  return pool;
}
