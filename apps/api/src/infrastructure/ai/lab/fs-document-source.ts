import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import type { DocumentSource, StoredDocument } from "@crece/ai-engine";

/** Prefijo de las referencias de documentos del laboratorio. */
export const LAB_REF_PREFIX = "lab/";
const REF_PATTERN = /^lab\/([0-9a-f-]{36})$/;

type Meta = { fileName: string; mimeType: string; uploadedAt: string };

/** Nombre de archivo apto para mostrar: sin rutas ni caracteres de control. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "archivo";
  const cleaned = base.replace(/[^\p{L}\p{N}._ -]+/gu, "_").replace(/^\.+/, "").slice(0, 120).trim();
  return cleaned || "archivo";
}

const startsWith = (bytes: Uint8Array, signature: number[]) => signature.every((b, i) => bytes[i] === b);

/**
 * Tipo por magic bytes, nunca el que declara el navegador: el archivo se vuelve a servir al lab y
 * un Content-Type elegido por el cliente (text/html, image/svg+xml) permitiría ejecutar scripts.
 * Lo que no es PDF, JPEG o PNG se sirve como binario opaco.
 */
export function sniffLabMimeType(bytes: Uint8Array): "application/pdf" | "image/jpeg" | "image/png" | "application/octet-stream" {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  const head = Buffer.from(bytes.buffer, bytes.byteOffset, Math.min(bytes.byteLength, 1024)).toString("latin1");
  if (head.includes("%PDF-")) return "application/pdf";
  return "application/octet-stream";
}

/**
 * Almacenamiento local del laboratorio (sustituye a R2 solo en /lab/ia). Cada archivo vive en
 * `<raíz>/<uuid>/` con su metadato; la referencia es opaca (`lab/<uuid>`) y no admite rutas.
 */
export class FileSystemDocumentSource implements DocumentSource {
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  async put(input: { bytes: Uint8Array; fileName: string; at?: Date }): Promise<StoredDocument> {
    const id = randomUUID();
    const dir = join(this.root, id);
    await mkdir(dir, { recursive: true });
    const meta: Meta = {
      fileName: safeFileName(input.fileName),
      mimeType: sniffLabMimeType(input.bytes),
      uploadedAt: (input.at ?? new Date()).toISOString(),
    };
    await writeFile(join(dir, "content.bin"), input.bytes, { mode: 0o600 });
    await writeFile(join(dir, "meta.json"), JSON.stringify(meta), { mode: 0o600 });
    return { ref: `${LAB_REF_PREFIX}${id}`, fileName: meta.fileName, mimeType: meta.mimeType, bytes: input.bytes };
  }

  async get(ref: string): Promise<StoredDocument | null> {
    const dir = this.dirFor(ref);
    if (!dir) return null;
    try {
      const [bytes, metaRaw] = await Promise.all([readFile(join(dir, "content.bin")), readFile(join(dir, "meta.json"), "utf8")]);
      const meta = JSON.parse(metaRaw) as Meta;
      return { ref, fileName: meta.fileName, mimeType: meta.mimeType, bytes: new Uint8Array(bytes) };
    } catch {
      return null;
    }
  }

  /** Borra archivos más viejos que la retención. Devuelve cuántos borró. */
  async purgeOlderThan(days: number, now = new Date()): Promise<number> {
    let removed = 0;
    let entries: string[];
    try {
      entries = await readdir(this.root);
    } catch {
      return 0;
    }
    const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
    for (const entry of entries) {
      const dir = this.dirFor(`${LAB_REF_PREFIX}${entry}`);
      if (!dir) continue;
      try {
        const meta = JSON.parse(await readFile(join(dir, "meta.json"), "utf8")) as Meta;
        const uploaded = Date.parse(meta.uploadedAt);
        const tooOld = Number.isFinite(uploaded) ? uploaded < cutoff : (await stat(dir)).mtimeMs < cutoff;
        if (tooOld) {
          await rm(dir, { recursive: true, force: true });
          removed += 1;
        }
      } catch {
        // metadato ilegible: se deja para revisión manual
      }
    }
    return removed;
  }

  private dirFor(ref: string): string | null {
    const match = REF_PATTERN.exec(ref);
    if (!match) return null;
    const dir = resolve(this.root, match[1]!);
    return dir.startsWith(this.root + sep) ? dir : null;
  }
}
