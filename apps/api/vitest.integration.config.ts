import { defineConfig } from "vitest/config";
import { loadRootEnv, workspaceAliases } from "./vitest.shared";

loadRootEnv();

/**
 * Integración (requiere `docker compose up -d db`) y contratos con proveedores reales
 * (se saltan solos si faltan credenciales). Nunca corren en `pnpm test`.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts", "src/**/*.contract.test.ts"],
    exclude: ["node_modules", "dist"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
  resolve: { alias: workspaceAliases },
});
