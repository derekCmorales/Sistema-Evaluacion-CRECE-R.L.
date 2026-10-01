import path from "node:path";
import { defineConfig } from "vitest/config";

const root = path.resolve(__dirname);

/** Los tests importan el fuente. No hace falta `pnpm build` antes. */
export function creceVitest(include: string) {
  return defineConfig({
    test: {
      environment: "node",
      include: [include],
    },
    resolve: {
      alias: {
        "@crece/shared": path.resolve(root, "packages/shared/src/index.ts"),
        "@crece/domain": path.resolve(root, "packages/domain/src/index.ts"),
        "@crece/application": path.resolve(root, "packages/application/src/index.ts"),
      },
    },
  });
}
