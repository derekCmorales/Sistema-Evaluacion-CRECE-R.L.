import type { Pool, PoolClient } from "pg";
import type { Transaction } from "@crece/ai-engine";

/**
 * Transacción de Postgres que el motor ve como opaca (`Transaction`). Los adaptadores de la misma
 * base (stores y cola) la desenvuelven para escribir en ella: así "crear la ejecución" y
 * "encolar el trabajo" se confirman o se revierten juntos.
 */
class PgTransaction {
  constructor(readonly client: PoolClient) {}
}

export function asTransaction(client: PoolClient): Transaction {
  return new PgTransaction(client) as unknown as Transaction;
}

/** El cliente de la transacción, o error si no la abrió un adaptador de Postgres. */
export function pgClientOf(tx: Transaction): PoolClient {
  if (!(tx instanceof PgTransaction)) {
    throw new Error("La transacción no pertenece al adaptador de Postgres del motor de IA");
  }
  return tx.client;
}

export async function inTransaction<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
