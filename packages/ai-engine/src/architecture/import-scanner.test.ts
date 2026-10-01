import { describe, expect, it } from "vitest";
import { scanImports } from "./import-scanner";
import { checkBoundaries } from "./boundary-rules";

describe("scanImports", () => {
  it("encuentra import, import type, export from, import() y require()", () => {
    const source = `
      import { z } from "zod";
      import type { Office } from '@crece/shared';
      import "reflect-metadata";
      export * from "./contracts";
      export { a } from './a';
      const lazy = await import("pg-boss");
      const pg = require("pg");
    `;
    expect(scanImports(source).sort()).toEqual(
      ["./a", "./contracts", "@crece/shared", "pg", "pg-boss", "reflect-metadata", "zod"].sort(),
    );
  });

  it("ignora comentarios y strings que parecen imports", () => {
    const source = `
      // import x from "pg";
      /* const y = require("@google/genai"); */
      const text = "from 'pg'";
      const tpl = \`import("pg")\`;
      const ok = 1;
    `;
    expect(scanImports(source)).toEqual([]);
  });

  it("soporta imports multilínea", () => {
    const source = `import {\n  a,\n  b,\n} from "@crece/shared";`;
    expect(scanImports(source)).toEqual(["@crece/shared"]);
  });
});

describe("checkBoundaries", () => {
  it("detecta SDK dentro del motor", () => {
    const v = checkBoundaries([
      { path: "packages/ai-engine/src/use-cases/x.ts", source: `import { GoogleGenAI } from "@google/genai";` },
    ]);
    expect(v.map((x) => x.rule)).toContain("motor-puro");
  });

  it("no confunde pg con pgvector ni con prefijos parecidos", () => {
    const v = checkBoundaries([{ path: "packages/ai-engine/src/a.ts", source: `import x from "pgx-lite";` }]);
    expect(v).toEqual([]);
  });

  it("permite SDKs solo en infrastructure/ai", () => {
    const ok = checkBoundaries([
      { path: "apps/api/src/infrastructure/ai/mistral-ocr.ts", source: `import { Mistral } from "@mistralai/mistralai";` },
    ]);
    const bad = checkBoundaries([
      { path: "apps/api/src/modules/operations/x.ts", source: `import { Mistral } from "@mistralai/mistralai";` },
    ]);
    expect(ok).toEqual([]);
    expect(bad[0]?.rule).toBe("sdk-solo-en-infraestructura");
  });

  it("prohíbe imports internos del motor pero permite /testing", () => {
    const v = checkBoundaries([
      { path: "apps/api/src/modules/ai/x.ts", source: `import { a } from "@crece/ai-engine/src/guards";` },
      { path: "apps/api/src/modules/ai/y.ts", source: `import { b } from "@crece/ai-engine/testing";` },
      { path: "apps/web/lib/z.ts", source: `import { c } from "../../../packages/ai-engine/src/chunking";` },
    ]);
    expect(v.map((x) => x.path)).toEqual(["apps/api/src/modules/ai/x.ts", "apps/web/lib/z.ts"]);
  });

  it("el dominio no depende del motor", () => {
    const v = checkBoundaries([{ path: "packages/domain/src/x.ts", source: `import type { A } from "@crece/ai-engine";` }]);
    expect(v[0]?.rule).toBe("dominio-sin-motor");
  });

  it("los tests del motor pueden usar node:fs", () => {
    const v = checkBoundaries([{ path: "packages/ai-engine/src/a.test.ts", source: `import { readFileSync } from "node:fs";` }]);
    expect(v).toEqual([]);
  });

  it("nada de producción depende del laboratorio; el lab y los composition roots sí pueden", () => {
    const v = checkBoundaries([
      { path: "apps/api/src/modules/operations/x.ts", source: `import { LabModule } from "../ai/lab/lab.module";` },
      { path: "apps/api/src/modules/ai/ai-runtime.ts", source: `import { purgeLabData } from "../../infrastructure/ai/lab/pg-lab-purge";` },
      { path: "apps/web/app/revision/page.tsx", source: `import { labApi } from "../../lib/lab-api";` },
      { path: "apps/api/src/app.module.ts", source: `import { LabModule } from "./modules/ai/lab/lab.module";` },
      { path: "apps/api/src/worker.ts", source: `import { createLabContext } from "./modules/ai/lab/lab-context";` },
      { path: "apps/api/src/modules/ai/lab/lab.controller.ts", source: `import { AI_ENGINE } from "../ai.tokens";` },
      { path: "apps/web/app/lab/ia/page.tsx", source: `import { labApi } from "../../../lib/lab-api";` },
      { path: "apps/api/src/modules/ai/x.integration.test.ts", source: `import { createLabContext } from "./lab/lab-context";` },
      { path: "apps/api/src/modules/ai/labels.ts", source: `import { a } from "./labels-es";` },
    ]);
    expect(v.map((x) => [x.rule, x.path])).toEqual([
      ["nada-depende-del-lab", "apps/api/src/modules/operations/x.ts"],
      ["nada-depende-del-lab", "apps/api/src/modules/ai/ai-runtime.ts"],
      ["nada-depende-del-lab", "apps/web/app/revision/page.tsx"],
    ]);
  });

  it("el código del motor no importa sus fakes", () => {
    const v = checkBoundaries([
      { path: "packages/ai-engine/src/use-cases/x.ts", source: `import { FakeHasher } from "../testing";` },
      { path: "packages/ai-engine/src/testing/index.ts", source: `export * from "./fixtures";` },
      { path: "packages/ai-engine/src/use-cases/x.test.ts", source: `import { FakeHasher } from "../testing";` },
    ]);
    expect(v.map((x) => [x.rule, x.path])).toEqual([["motor-sin-fakes", "packages/ai-engine/src/use-cases/x.ts"]]);
  });
});
