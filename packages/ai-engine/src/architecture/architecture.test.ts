import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkBoundaries, type SourceFile } from "./boundary-rules";

const repoRoot = resolve(__dirname, "../../../..");
const SKIP = new Set(["node_modules", "dist", ".next", ".turbo", "coverage", ".lab-storage"]);

function collect(dir: string, out: SourceFile[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collect(full, out);
    else if (/\.(ts|tsx|mts|cts)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      out.push({ path: relative(repoRoot, full).split("\\").join("/"), source: readFileSync(full, "utf8") });
    }
  }
}

describe("frontera del motor de IA en el monorepo", () => {
  const files: SourceFile[] = [];
  collect(join(repoRoot, "packages"), files);
  collect(join(repoRoot, "apps"), files);

  it("escanea el árbol real", () => {
    expect(files.some((f) => f.path.startsWith("packages/ai-engine/src/"))).toBe(true);
    expect(files.some((f) => f.path.startsWith("apps/api/src/"))).toBe(true);
  });

  it("no hay violaciones de frontera", () => {
    expect(checkBoundaries(files)).toEqual([]);
  });
});
