import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@crece/shared": path.resolve(__dirname, "../shared/src/index.ts"),
      "@crece/domain": path.resolve(__dirname, "../domain/src/index.ts"),
    },
  },
});
