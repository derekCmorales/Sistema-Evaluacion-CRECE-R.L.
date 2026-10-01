import path from "node:path";
import { defineConfig } from "vitest/config";

/** Pruebas de la web: helpers de presentación y cliente HTTP. Las reglas se prueban en domain/application. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@crece/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
});
