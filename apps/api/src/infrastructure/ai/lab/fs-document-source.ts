import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import type { DocumentSource, StoredDocument } from "@crece/ai-engine";

const REF_PATTERN = /^lab\/([0-9a-f-]{36})$/;

type Meta = { fileName: string; mimeType: string; uploadedAt: string };

/** Nombre de archivo apto para mostrar: sin rutas ni caracteres de control. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "archivo";
  const cleaned = base.replace(/[^\p{L}\p{N}._ -]+/gu, "_").replace(/^\.+/, "").slice(0, 120).trim();
  return cleaned || "archivo";
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

  async put(input: { bytes: Uint8Array; fileName: string; mimeType: string; at?: Date }): Promise<StoredDocument> {
    const id = randomUUID();
    const dir = join(this.root, id);
    await mkdir(dir, { recursive: true });
    const meta: Meta = {
      fileName: safeFileName(input.fileName),
      mimeType: input.mimeType,
      uploadedAt: (input.at ?? new Date()).toISOString(),
    };
    await writeFile(join(dir, "content.bin"), input.bytes, { mode: 0o600 });
    await writeFile(join(dir, "meta.json"), JSON.stringify(meta), { mode: 0o600 });
    return { ref: `lab/${id}`, fileName: meta.fileName, mimeType: meta.mimeType, bytes: input.bytes };
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
      const dir = this.dirFor(`lab/${entry}`);
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
