import { describe, expect, it } from "vitest";
import { preflightDocument } from "./preflight";
import { syntheticJpeg, syntheticPdf, syntheticPng, truncatedPdf } from "../testing/synthetic-files";

const limits = { maxFileBytes: 1024 * 1024, maxPages: 5 };

describe("preflightDocument", () => {
  it("reconoce PDF por magic bytes y cuenta páginas", () => {
    const result = preflightDocument(syntheticPdf([["Página uno"], ["Página dos"], ["Página tres"]]), limits);
    expect(result).toMatchObject({ kind: "PDF", mimeType: "application/pdf", pageCount: 3 });
    expect(result.pagesToProcess).toBeUndefined();
  });

  it("reconoce JPEG y PNG aunque el nombre o Content-Type digan otra cosa", () => {
    expect(preflightDocument(syntheticJpeg(), limits).kind).toBe("JPEG");
    expect(preflightDocument(syntheticPng(), limits).kind).toBe("PNG");
  });

  it("rechaza formatos no admitidos", () => {
    const docx = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]);
    expect(() => preflightDocument(docx, limits)).toThrow(
      expect.objectContaining({ code: "AI_INPUT_UNSUPPORTED_TYPE" }),
    );
  });

  it("rechaza PDF protegido con contraseña sin llamar al proveedor", () => {
    expect(() => preflightDocument(syntheticPdf([["Secreto"]], { encrypted: true }), limits)).toThrow(
      "PDF protegido con contraseña",
    );
  });

  it("rechaza PDF truncado y archivos vacíos", () => {
    expect(() => preflightDocument(truncatedPdf(), limits)).toThrow(expect.objectContaining({ code: "AI_INPUT_CORRUPT" }));
    expect(() => preflightDocument(new Uint8Array(), limits)).toThrow(expect.objectContaining({ code: "AI_INPUT_CORRUPT" }));
  });

  it("rechaza exceso de páginas y de tamaño con mensaje que dice el límite", () => {
    const many = syntheticPdf(Array.from({ length: 6 }, (_, i) => [`Página ${i + 1}`]));
    expect(() => preflightDocument(many, limits)).toThrow("tiene 6 páginas; el máximo es 5");
    expect(() => preflightDocument(new Uint8Array(2 * 1024 * 1024).fill(0x25), limits)).toThrow(
      expect.objectContaining({ code: "AI_INPUT_TOO_LARGE" }),
    );
  });

  it("si no puede contar páginas, acota las que se procesan", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj << /Type /ObjStm >> endobj\ntrailer << >>\n%%EOF\n");
    const result = preflightDocument(pdf, limits);
    expect(result.pageCount).toBeNull();
    expect(result.pagesToProcess).toEqual([0, 1, 2, 3, 4]);
  });
});
