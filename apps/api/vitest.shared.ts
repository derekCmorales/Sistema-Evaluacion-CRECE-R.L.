import path from "node:path";

const pkg = (name: string, file = "index.ts") => path.resolve(__dirname, `../../packages/${name}/src/${file}`);

/** Los paquetes del monorepo se resuelven desde src: las pruebas no dependen de un build previo. */
export const workspaceAliases = [
  { find: "@crece/ai-engine/testing", replacement: pkg("ai-engine", "testing/index.ts") },
  { find: "@crece/ai-engine", replacement: pkg("ai-engine") },
  { find: "@crece/application", replacement: pkg("application") },
  { find: "@crece/domain", replacement: pkg("domain") },
  { find: "@crece/shared", replacement: pkg("shared") },
];

/** Carga el `.env` de la raíz sin pisar variables ya definidas (Node ≥ 20.12). */
export function loadRootEnv(): void {
  try {
    process.loadEnvFile(path.resolve(__dirname, "../../.env"));
  } catch {
    // Sin .env: se usan las variables del entorno o los valores por defecto.
  }
}
