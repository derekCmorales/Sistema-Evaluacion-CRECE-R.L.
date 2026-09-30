import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { preflightDocument, sniffFileKind } from "./preflight";
import { syntheticJpeg, syntheticPdf, syntheticPng, truncatedPdf } from "../testing/synthetic-files";

const limits = { maxFileBytes: 1024 * 1024, maxPages: 5 };

/** PDF moderno: xref comprimido y páginas dentro de object streams (lo común en estados de cuenta). */
async function objectStreamPdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i += 1) doc.addPage().drawText(`Pagina ${i + 1}`, { font, x: 50, y: 700 });
  return doc.save({ useObjectStreams: true });
}

describe("preflightDocument", () => {
  it("reconoce PDF por magic bytes y cuenta páginas", async () => {
    const result = await preflightDocument(syntheticPdf([["Página uno"], ["Página dos"], ["Página tres"]]), limits);
    expect(result).toEqual({ kind: "PDF", mimeType: "application/pdf", sizeBytes: expect.any(Number), pageCount: 3 });
  });

  it("cuenta páginas de PDFs con object streams (antes quedaban sin contar)", async () => {
    const pdf = await objectStreamPdf(4);
    expect(new TextDecoder("latin1").decode(pdf)).not.toMatch(/\/Type\s*\/Page(?![s\w])/);
    expect((await preflightDocument(pdf, limits)).pageCount).toBe(4);
    await expect(preflightDocument(await objectStreamPdf(6), limits)).rejects.toThrow("tiene 6 páginas; el máximo es 5");
  });

  it("reconoce JPEG y PNG aunque el nombre o Content-Type digan otra cosa", async () => {
    expect((await preflightDocument(syntheticJpeg(), limits)).kind).toBe("JPEG");
    expect((await preflightDocument(syntheticPng(), limits)).kind).toBe("PNG");
    expect(sniffFileKind(new TextEncoder().encode("<html><script>"))).toBeNull();
  });

  it("rechaza formatos no admitidos", async () => {
    const docx = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]);
    await expect(preflightDocument(docx, limits)).rejects.toMatchObject({ code: "AI_INPUT_UNSUPPORTED_TYPE" });
  });

  it("rechaza PDF protegido sin llamar al proveedor", async () => {
    await expect(preflightDocument(syntheticPdf([["Secreto"]], { encrypted: true }), limits)).rejects.toMatchObject({
      code: "AI_INPUT_ENCRYPTED",
      message: expect.stringContaining("PDF protegido"),
    });
  });

  it("rechaza PDF truncado, sin estructura legible y archivos vacíos", async () => {
    await expect(preflightDocument(truncatedPdf(), limits)).rejects.toMatchObject({ code: "AI_INPUT_CORRUPT" });
    await expect(preflightDocument(new Uint8Array(), limits)).rejects.toMatchObject({ code: "AI_INPUT_CORRUPT" });
    const garbage = new TextEncoder().encode("%PDF-1.7\n1 0 obj << /Type /ObjStm >> endobj\ntrailer << >>\n%%EOF\n");
    await expect(preflightDocument(garbage, limits)).rejects.toMatchObject({ code: "AI_INPUT_CORRUPT" });
  });

  it("rechaza exceso de páginas y de tamaño con mensaje que dice el límite", async () => {
    const many = syntheticPdf(Array.from({ length: 6 }, (_, i) => [`Página ${i + 1}`]));
    await expect(preflightDocument(many, limits)).rejects.toThrow("tiene 6 páginas; el máximo es 5");
    await expect(preflightDocument(new Uint8Array(2 * 1024 * 1024).fill(0x25), limits)).rejects.toMatchObject({
      code: "AI_INPUT_TOO_LARGE",
    });
  });
});
