import { describe, expect, it } from "vitest";
import { resolveDocumentSchema } from "../extraction/document-schemas";
import { comparable } from "../extraction/ocr-normalizer";
import { preflightDocument } from "../extraction/preflight";
import { EXTRACTION_FIXTURES, extractionFixtureBytes } from "../testing/extraction-fixtures";

describe("fixtures sintéticos del laboratorio (golden set de extracción)", () => {
  it("nombres únicos y generación determinística", () => {
    expect(new Set(EXTRACTION_FIXTURES.map((f) => f.fileName)).size).toBe(EXTRACTION_FIXTURES.length);
    for (const fixture of EXTRACTION_FIXTURES) {
      expect(extractionFixtureBytes(fixture)).toEqual(extractionFixtureBytes(fixture));
    }
  });

  it("cada PDF pasa el preflight con su número de páginas", async () => {
    for (const fixture of EXTRACTION_FIXTURES) {
      const result = await preflightDocument(extractionFixtureBytes(fixture), { maxFileBytes: 1024 * 1024, maxPages: 60 });
      expect(result.pageCount, fixture.fileName).toBe(fixture.pages.length);
    }
  });

  it("los campos esperados existen en el esquema del tipo", () => {
    for (const fixture of EXTRACTION_FIXTURES) {
      const keys = resolveDocumentSchema(fixture.documentType).schema?.fields.map((f) => f.key) ?? [];
      for (const key of Object.keys(fixture.expected)) expect(keys, `${fixture.fileName}:${key}`).toContain(key);
    }
  });

  it("cada valor esperado aparece en el texto del documento (un OCR honesto lo puede encontrar)", () => {
    for (const fixture of EXTRACTION_FIXTURES) {
      const text = comparable(fixture.pages.flat().join(" "));
      for (const [key, value] of Object.entries(fixture.expected)) {
        const needle = comparable(value).replace(/^q/, "");
        expect(text.includes(needle), `${fixture.fileName}:${key}=${value}`).toBe(true);
      }
    }
  });

  it("solo caracteres Latin-1 (la fuente del PDF es WinAnsi)", () => {
    for (const fixture of EXTRACTION_FIXTURES) {
      for (const line of fixture.pages.flat()) expect([...line].every((c) => c.charCodeAt(0) <= 0xff), line).toBe(true);
    }
  });

  it("incluye un caso red-team de inyección", () => {
    expect(EXTRACTION_FIXTURES.some((f) => /ignora las instrucciones/i.test(f.pages.flat().join(" ")))).toBe(true);
  });
});
