import { defineConfig } from "vitest/config";
import { workspaceAliases } from "./vitest.shared";

/** Pruebas unitarias de la API: sin red ni base de datos. Integración: vitest.integration.config.ts */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.integration.test.ts", "src/**/*.contract.test.ts", "node_modules", "dist"],
  },
  resolve: { alias: workspaceAliases },
});
