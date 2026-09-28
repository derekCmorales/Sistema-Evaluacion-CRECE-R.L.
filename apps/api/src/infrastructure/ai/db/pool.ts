import { Pool, types } from "pg";

// numeric → number (costos); int8 (bigserial del outbox) → number. Valores pequeños y acotados.
types.setTypeParser(types.builtins.NUMERIC, (v) => Number(v));
types.setTypeParser(types.builtins.INT8, (v) => Number(v));

export function createAiPool(databaseUrl: string, max = 5): Pool {
  const pool = new Pool({
    connectionString: databaseUrl,
    max,
    application_name: "crece-ai-engine",
    idleTimeoutMillis: 30_000,
  });
  // Una conexión inactiva que el servidor cierra (reinicio, failover) no debe tumbar el proceso:
  // el pool la descarta y abre otra en la siguiente consulta. Solo el mensaje, nunca la URL.
  pool.on("error", (error) => {
    console.error(`[ai-db] conexión inactiva cerrada por el servidor: ${error.message}`);
  });
  return pool;
}
