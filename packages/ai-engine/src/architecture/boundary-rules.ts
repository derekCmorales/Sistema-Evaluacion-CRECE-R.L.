import { scanImports } from "./import-scanner";

/** Reglas de frontera del motor de IA (design D14). Rutas relativas a la raíz del monorepo. */

export type SourceFile = { path: string; source: string };
export type Violation = { rule: string; path: string; specifier: string };

const SDKS = ["@google/genai", "@mistralai/", "pg", "pg-boss", "pgvector"];
const ENGINE_FORBIDDEN = [
  ...SDKS,
  "@prisma/",
  "@nestjs/",
  "next",
  "react",
  "@crece/domain",
  "@crece/application",
  "node:fs",
  "node:net",
  "node:http",
  "node:https",
  "node:child_process",
  "fs",
  "net",
  "http",
  "https",
  "child_process",
];

/** Coincide exacto o como prefijo de paquete (`pg` no coincide con `pgvector`). */
function matches(specifier: string, target: string): boolean {
  if (target.endsWith("/")) return specifier.startsWith(target);
  return specifier === target || specifier.startsWith(`${target}/`);
}

const isTest = (path: string) => /\.test\.tsx?$/.test(path);
const inEngine = (path: string) => path.startsWith("packages/ai-engine/");
const inEngineSrc = (path: string) => path.startsWith("packages/ai-engine/src/");
const inAiInfrastructure = (path: string) => path.startsWith("apps/api/src/infrastructure/ai/");

export function checkBoundaries(files: SourceFile[]): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    for (const specifier of scanImports(file.source)) {
      // 1. El motor es puro: sin SDKs, IO, frameworks ni el dominio de crédito.
      if (inEngineSrc(file.path) && !isTest(file.path)) {
        const hit = ENGINE_FORBIDDEN.find((target) => matches(specifier, target));
        if (hit) violations.push({ rule: "motor-puro", path: file.path, specifier });
        if (specifier.startsWith("../../")) {
          violations.push({ rule: "motor-sin-escapes", path: file.path, specifier });
        }
      }
      // 2. Los SDKs de proveedores solo en la infraestructura de IA.
      if (!inAiInfrastructure(file.path) && !inEngine(file.path)) {
        const sdk = SDKS.find((target) => matches(specifier, target));
        if (sdk) violations.push({ rule: "sdk-solo-en-infraestructura", path: file.path, specifier });
      }
      // 3. Nadie importa internos del motor.
      if (!inEngine(file.path)) {
        const deepPackage =
          specifier.startsWith("@crece/ai-engine/") && specifier !== "@crece/ai-engine/testing";
        const deepPath = /(^|\/)ai-engine\/src(\/|$)/.test(specifier);
        if (deepPackage || deepPath) {
          violations.push({ rule: "sin-imports-internos", path: file.path, specifier });
        }
      }
      // 4. El dominio y shared no dependen del motor.
      if (
        (file.path.startsWith("packages/domain/") || file.path.startsWith("packages/shared/")) &&
        matches(specifier, "@crece/ai-engine")
      ) {
        violations.push({ rule: "dominio-sin-motor", path: file.path, specifier });
      }
    }
  }
  return violations;
}
