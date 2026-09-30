import { describe, expect, it } from "vitest";
import { FakeHasher } from "../testing/fake-runtime";
import { resolveDocumentSchema, type ResolvedSchema } from "./document-schemas";
import { canonicalJson, EXTRACTION_PIPELINE_VERSION, extractionPipelineFingerprint } from "./pipeline-fingerprint";

const hasher = new FakeHasher();

describe("huella del pipeline de extracción", () => {
  it("es determinística y lleva la versión del pipeline", () => {
    const bureau = resolveDocumentSchema("BUREAU_REPORT");
    const a = extractionPipelineFingerprint(bureau, 64, hasher);
    expect(a).toBe(extractionPipelineFingerprint(bureau, 64, hasher));
    expect(a.startsWith(`${EXTRACTION_PIPELINE_VERSION}:`)).toBe(true);
  });

  it("cambia si cambia lo que se le pide al proveedor, aunque nadie suba la versión del esquema", () => {
    const bureau = resolveDocumentSchema("BUREAU_REPORT");
    const base = extractionPipelineFingerprint(bureau, 64, hasher);
    const editedField: ResolvedSchema = {
      ...bureau,
      schema: {
        ...bureau.schema!,
        fields: bureau.schema!.fields.map((f, i) => (i === 0 ? { ...f, description: "Otra descripción" } : f)),
      },
    };
    expect(extractionPipelineFingerprint(editedField, 64, hasher)).not.toBe(base);
    expect(extractionPipelineFingerprint(bureau, 128, hasher)).not.toBe(base);
    expect(extractionPipelineFingerprint({ ...bureau, classifyImages: true }, 64, hasher)).not.toBe(base);
  });

  it("tipos distintos tienen huellas distintas", () => {
    expect(extractionPipelineFingerprint(resolveDocumentSchema("DPI"), 64, hasher)).not.toBe(
      extractionPipelineFingerprint(resolveDocumentSchema("INCOME_RECEIPT"), 64, hasher),
    );
  });

  it("JSON canónico: el orden de las claves no importa", () => {
    expect(canonicalJson({ b: 1, a: [2, { d: 3, c: undefined }] })).toBe('{"a":[2,{"d":3}],"b":1}');
    expect(canonicalJson({ a: 1, b: 2 })).toBe(canonicalJson({ b: 2, a: 1 }));
  });
});
