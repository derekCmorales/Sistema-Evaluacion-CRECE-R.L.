import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileSystemDocumentSource, safeFileName, sniffLabMimeType } from "./fs-document-source";

describe("FileSystemDocumentSource (lab)", () => {
  let root: string;
  let store: FileSystemDocumentSource;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "crece-lab-"));
    store = new FileSystemDocumentSource(root);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("guarda y recupera bytes y metadatos con una referencia opaca", async () => {
    const pdf = new TextEncoder().encode("%PDF-1.4 contenido");
    const saved = await store.put({ bytes: pdf, fileName: "buró de prueba.pdf" });
    expect(saved.ref).toMatch(/^lab\/[0-9a-f-]{36}$/);
    const loaded = await store.get(saved.ref);
    expect(loaded).toMatchObject({ fileName: "buró de prueba.pdf", mimeType: "application/pdf" });
    expect([...loaded!.bytes]).toEqual([...pdf]);
  });

  it("el tipo sale de los bytes, nunca del navegador (sin HTML/SVG servible)", async () => {
    const html = await store.put({ bytes: new TextEncoder().encode("<html><script>alert(1)</script>"), fileName: "x.pdf" });
    expect((await store.get(html.ref))?.mimeType).toBe("application/octet-stream");
    expect(sniffLabMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffLabMimeType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
  });

  it("rechaza referencias con rutas (path traversal)", async () => {
    for (const ref of ["../../etc/passwd", "lab/../../x", "lab/abc", "/lab/x", "lab/00000000-0000-0000-0000-000000000000/../x"]) {
      expect(await store.get(ref)).toBeNull();
    }
  });

  it("limpia nombres de archivo", () => {
    expect(safeFileName("../../secret/../dpi.pdf")).toBe("dpi.pdf");
    expect(safeFileName("C:\\Users\\x\\recibo<1>.png")).toBe("recibo_1_.png");
    expect(safeFileName("...")).toBe("archivo");
  });

  it("purga lo que supera la retención y conserva lo reciente", async () => {
    const now = new Date("2026-09-28T12:00:00.000Z");
    const old = await store.put({ bytes: new Uint8Array([1]), fileName: "viejo.pdf", at: new Date("2026-09-10T00:00:00.000Z") });
    const fresh = await store.put({ bytes: new Uint8Array([2]), fileName: "nuevo.pdf", at: new Date("2026-09-27T00:00:00.000Z") });
    expect(await store.purgeOlderThan(7, now)).toBe(1);
    expect(await store.get(old.ref)).toBeNull();
    expect(await store.get(fresh.ref)).not.toBeNull();
  });
});
