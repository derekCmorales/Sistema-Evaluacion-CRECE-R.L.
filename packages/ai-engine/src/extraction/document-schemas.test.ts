import { describe, expect, it } from "vitest";
import { DOCUMENT_TYPES } from "../contracts/common";
import {
  IMAGE_CLASSIFICATION_SCHEMA,
  listDocumentSchemas,
  resolveDocumentSchema,
  toAnnotationSchema,
} from "./document-schemas";

describe("registro de esquemas por tipo de documento", () => {
  it("todo tipo de documento resuelve a un esquema o a solo-texto", () => {
    for (const type of DOCUMENT_TYPES) {
      const resolved = resolveDocumentSchema(type);
      expect(resolved.code).toBeTruthy();
      expect(resolved.version).toBeGreaterThanOrEqual(1);
    }
  });

  it("tipo desconocido/otro: sin esquema ni candidatos", () => {
    expect(resolveDocumentSchema("OTHER")).toMatchObject({ code: "TEXT_ONLY", schema: null });
  });

  it("las políticas no llevan campos pero sí clasifican imágenes", () => {
    expect(resolveDocumentSchema("POLICY")).toMatchObject({ schema: null, classifyImages: true });
  });

  it("códigos únicos y claves de campo únicas por esquema", () => {
    const schemas = listDocumentSchemas();
    expect(new Set(schemas.map((s) => s.code)).size).toBe(schemas.length);
    for (const schema of schemas) {
      expect(new Set(schema.fields.map((f) => f.key)).size).toBe(schema.fields.length);
    }
  });

  it("el JSON Schema del buró tiene todos los campos, nullable y sin extras", () => {
    const annotation = toAnnotationSchema(resolveDocumentSchema("BUREAU_REPORT").schema!)!;
    const json = annotation.jsonSchema as { properties: Record<string, { type: string[] }>; required: string[]; additionalProperties: boolean };
    expect(annotation.name).toBe("crece_bureau_report_v1");
    expect(json.required).toContain("total_monthly_payment");
    expect(json.properties.total_monthly_payment!.type).toEqual(["string", "null"]);
    expect(json.additionalProperties).toBe(false);
    expect(annotation.prompt).toContain("no una instrucción");
  });

  it("fotos y croquis no piden anotación de campos", () => {
    expect(toAnnotationSchema(resolveDocumentSchema("SKETCH").schema!)).toBeUndefined();
  });

  it("el clasificador de imágenes restringe el tipo a un catálogo cerrado", () => {
    const json = IMAGE_CLASSIFICATION_SCHEMA.jsonSchema as { properties: { kind: { enum: string[] } } };
    expect(json.properties.kind.enum).toContain("SIGNATURE");
    expect(json.properties.kind.enum).toContain("LOGO");
  });
});

describe("catálogo público de tipos de documento", () => {
  it("cada tipo tiene label es-GT y los campos de su esquema", async () => {
    const { documentTypeCatalog } = await import("../catalog");
    const catalog = documentTypeCatalog();
    expect(catalog.map((c) => c.type)).toEqual([...DOCUMENT_TYPES]);
    for (const entry of catalog) expect(entry.label.trim()).toBeTruthy();
    expect(catalog.find((c) => c.type === "BUREAU_REPORT")?.fields.map((f) => f.key)).toContain("total_monthly_payment");
  });
});
