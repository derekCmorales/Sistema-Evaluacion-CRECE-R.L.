/**
 * Genera los PDFs sintéticos del laboratorio y el golden set de extracción.
 *   pnpm --filter @crece/ai-engine eval:fixtures
 * Salida en eval/fixtures/ (ignorada por git: se regenera igual cada vez).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import testing from "../dist/testing/index.js";

const { LAB_FIXTURES, labFixtureBytes } = testing;
const out = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
mkdirSync(out, { recursive: true });

for (const fixture of LAB_FIXTURES) {
  writeFileSync(join(out, fixture.fileName), labFixtureBytes(fixture));
}
const golden = LAB_FIXTURES.map(({ fileName, documentType, description, expected }) => ({ fileName, documentType, description, expected }));
writeFileSync(join(out, "extraction-golden.json"), JSON.stringify(golden, null, 2) + "\n");
console.log(`${LAB_FIXTURES.length} documentos sintéticos + extraction-golden.json en ${out}`);
