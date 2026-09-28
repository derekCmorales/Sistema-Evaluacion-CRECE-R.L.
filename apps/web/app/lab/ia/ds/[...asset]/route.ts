import { readFile } from "node:fs/promises";
import path from "node:path";
import { isLabEnabled } from "../../../../../lib/lab-flags";

/**
 * Sirve archivos del design system al laboratorio sin copiarlos ni editarlos (design D17).
 * Lista blanca explícita: ninguna ruta del cliente llega al sistema de archivos.
 * `crece-tokens.css` pide sus fuentes en `./fonts/…`; se mapean a `design-system/fonts/`.
 */
const DS_ROOT = path.resolve(process.cwd(), "../../design-system");

const ASSETS: Record<string, { file: string; type: string }> = {
  "tokens.css": { file: "assets/Platforms/crece-tokens.css", type: "text/css; charset=utf-8" },
  "components.css": { file: "components/bundle.css", type: "text/css; charset=utf-8" },
  "components.js": { file: "components/bundle.js", type: "text/javascript; charset=utf-8" },
  "fonts/figtree-latin-wght-normal.woff2": { file: "fonts/figtree-latin-wght-normal.woff2", type: "font/woff2" },
  "fonts/urbanist-latin-wght-normal.woff2": { file: "fonts/urbanist-latin-wght-normal.woff2", type: "font/woff2" },
};

export async function GET(_request: Request, context: { params: Promise<{ asset: string[] }> }) {
  if (!isLabEnabled()) return new Response("Not found", { status: 404 });
  const { asset } = await context.params;
  const entry = ASSETS[asset.join("/")];
  if (!entry) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(path.join(DS_ROOT, entry.file));
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": entry.type,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
