import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
  resolve: {
    alias: {
      "@crece/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      "@crece/domain": path.resolve(__dirname, "../../packages/domain/src/index.ts"),
      "@crece/application": path.resolve(__dirname, "../../packages/application/src/index.ts"),
    },
  },
});
