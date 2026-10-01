// Copia los archivos generados del design system a public/ds para servirlos tal cual.
// No edita design-system/ (es copia de Claude Design): solo lo publica. public/ds no se versiona.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ds = path.resolve(here, "../../../design-system");
const out = path.resolve(here, "../public/ds");

const files = [
  ["assets/Platforms/crece-tokens.css", "crece-tokens.css"],
  ["components/bundle.css", "bundle.css"],
  ["components/bundle.js", "bundle.js"],
  // crece-tokens.css pide sus fuentes en ./fonts/
  ["fonts/figtree-latin-wght-normal.woff2", "fonts/figtree-latin-wght-normal.woff2"],
  ["fonts/urbanist-latin-wght-normal.woff2", "fonts/urbanist-latin-wght-normal.woff2"],
];

rmSync(out, { recursive: true, force: true });
mkdirSync(path.join(out, "fonts"), { recursive: true });
for (const [from, to] of files) {
  cpSync(path.join(ds, from), path.join(out, to));
}
console.log(`design system → ${path.relative(process.cwd(), out)} (${files.length} archivos)`);
