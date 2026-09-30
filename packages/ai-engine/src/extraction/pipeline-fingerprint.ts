import type { Hasher } from "../ports";
import { IMAGE_CLASSIFICATION_SCHEMA, toAnnotationSchema, type ResolvedSchema } from "./document-schemas";

/**
 * Versión del código que transforma la respuesta del proveedor en una extracción (normalizador,
 * candidatos, clasificación). Subirla cuando ese código cambie el resultado guardado.
 *   extract-v2: descripciones de imágenes fuera del texto, invisibles eliminados, señales de inyección, bbox.
 */
export const EXTRACTION_PIPELINE_VERSION = "extract-v2";

/** JSON con claves ordenadas: el mismo contenido produce siempre el mismo texto. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Huella de todo lo que determina una extracción, además de los bytes y el modelo: la versión del
 * pipeline y exactamente lo que se le pide al proveedor (esquema y prompt de anotación, clasificador
 * de imágenes, tamaño mínimo de imagen). Cambiar cualquier descripción de campo invalida la
 * deduplicación sin depender de que alguien suba una versión a mano.
 */
export function extractionPipelineFingerprint(resolved: ResolvedSchema, imageMinSize: number, hasher: Hasher): string {
  const request = {
    pipeline: EXTRACTION_PIPELINE_VERSION,
    schemaCode: resolved.code,
    annotation: resolved.schema ? (toAnnotationSchema(resolved.schema) ?? null) : null,
    fields: resolved.schema?.fields.map((f) => ({ key: f.key, type: f.type })) ?? [],
    imageClassification: resolved.classifyImages ? IMAGE_CLASSIFICATION_SCHEMA : null,
    imageMinSize,
  };
  return `${EXTRACTION_PIPELINE_VERSION}:${hasher.sha256Hex(canonicalJson(request)).slice(0, 32)}`;
}
