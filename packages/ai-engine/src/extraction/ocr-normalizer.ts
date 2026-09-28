import type {
  DocumentExtraction,
  ExtractedFieldCandidate,
  OcrDocument,
  OcrImage,
  OcrPage,
} from "../contracts/ocr";
import type { DocumentSchema } from "./document-schemas";
import { normalizeFieldValue } from "./value-normalizers";

const DISCARDED_IMAGE_KINDS = new Set(["LOGO", "DECORATION"]);
const PRESENCE_ONLY: Record<string, string> = { SIGNATURE: "Firma presente", SEAL: "Sello presente" };

/** Texto comparable: sin acentos, minúsculas, sin espacios ni puntuación. */
export function comparable(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function imageDescription(image: OcrImage): string | null {
  const c = image.classification;
  if (!c || DISCARDED_IMAGE_KINDS.has(c.kind)) return null;
  if (PRESENCE_ONLY[c.kind]) return PRESENCE_ONLY[c.kind]!;
  return c.relevant ? c.description.trim() : null;
}

/**
 * Normaliza el markdown de una página (design D5): NFC, palabras partidas por guion al final de
 * línea, espacios, números de página y marcadores de imagen (se reemplazan por su descripción si
 * es relevante; logos y decoración desaparecen).
 */
export function normalizePageText(markdown: string, images: OcrImage[] = []): string {
  const byId = new Map(images.map((img) => [img.id, img]));
  return markdown
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/!\[[^\]]*\]\(([^)]+)\)/g, (_all, id: string) => {
      const image = byId.get(id);
      const description = image ? imageDescription(image) : null;
      return description ? `[Imagen: ${description}]` : "";
    })
    .replace(/(\p{L})-\n(\p{Ll})/gu, "$1$2")
    .split("\n")
    .map((line) => (line.trimStart().startsWith("|") ? line.trimEnd() : line.replace(/[ \t]+/g, " ").trim()))
    .filter((line) => !/^(p[aá]g(ina)?\.?\s*)?\d{1,3}(\s*(de|\/)\s*\d{1,3})?$/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function lastTableHeader(text: string): string | null {
  const lines = text.split("\n");
  let i = lines.length - 1;
  if (!lines[i]?.startsWith("|")) return null;
  while (i > 0 && lines[i - 1]!.startsWith("|")) i -= 1;
  return lines[i] ?? null;
}

const firstLine = (text: string) => text.split("\n")[0] ?? "";

type LocatedValue = { page?: number; confidence?: number };

const tokens = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/**
 * Ubica un valor en el texto para darle página y confianza. Valores de 2+ caracteres: por
 * subcadena comparable. Valores cortos ("7", "0"): la línea debe contener el valor como token
 * aislado y alguna palabra de la etiqueta del campo; si no, se considera no encontrado.
 */
function locate(value: string, raw: string, label: string, pages: OcrPage[], normalizedTexts: string[]): LocatedValue {
  const needles = [comparable(raw), comparable(value)].filter((n) => n.length >= 2);
  const shortValue = needles.length === 0 ? comparable(raw) : null;
  const labelWords = tokens(label).filter((w) => w.length >= 4);

  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i]!;
    let hit: ((text: string) => boolean) | null = null;
    if (shortValue) {
      const matchesLine = (line: string) => {
        const words = tokens(line);
        return words.includes(shortValue) && labelWords.some((w) => words.some((t) => t.startsWith(w)));
      };
      if (normalizedTexts[i]!.split("\n").some(matchesLine)) hit = matchesLine;
    } else if (needles.some((n) => comparable(normalizedTexts[i]!).includes(n))) {
      hit = (text: string) => needles.some((n) => comparable(text).includes(n));
    }
    if (!hit) continue;
    const block = page.blocks.find((b) => hit!(b.text));
    return { page: page.index, confidence: block?.confidence ?? page.confidence };
  }
  return {};
}

export type BuildExtractionInput = {
  id: string;
  fileSha256: string;
  documentType: string;
  schemaCode: string;
  schemaVersion: number;
  schema: DocumentSchema | null;
  ocr: OcrDocument;
  confidenceThreshold: number;
  createdAt: string;
  isLab: boolean;
};

/**
 * Traduce el `OcrDocument` del proveedor a una extracción del motor: páginas normalizadas,
 * candidatos para confirmación humana (nunca confirmados) e imágenes clasificadas.
 */
export function buildExtraction(input: BuildExtractionInput): DocumentExtraction {
  const { ocr } = input;
  const texts = ocr.pages.map((p) => normalizePageText(p.markdown, p.images));

  const pages: DocumentExtraction["pages"] = ocr.pages.map((page, i) => {
    const previousHeader = i > 0 ? lastTableHeader(texts[i - 1]!) : null;
    return {
      index: page.index,
      text: texts[i]!,
      ...(page.header ? { header: page.header.trim() } : {}),
      ...(page.footer ? { footer: page.footer.trim() } : {}),
      ...(page.confidence != null ? { confidence: page.confidence } : {}),
      ...(previousHeader && firstLine(texts[i]!) === previousHeader ? { tableContinuesFromPrevious: true } : {}),
    };
  });

  const candidates: ExtractedFieldCandidate[] = [];
  for (const field of input.schema?.fields ?? []) {
    const raw = ocr.annotation?.[field.key];
    if (raw == null) continue;
    const rawText = String(raw).trim();
    if (!rawText || rawText.toLowerCase() === "null") continue;

    const normalized = normalizeFieldValue(field.type, rawText);
    const located = locate(normalized.value, rawText, field.label, ocr.pages, texts);
    const reasons: string[] = [];
    if (normalized.attention) reasons.push(normalized.attention);
    if (located.page == null) reasons.push("No aparece en el texto extraído: verificar contra el documento");
    if (located.confidence != null && located.confidence < input.confidenceThreshold) {
      reasons.push("Revisar: baja confianza");
    }
    candidates.push({
      id: `${input.id}:${field.key}`,
      fieldKey: field.key,
      fieldLabel: field.label,
      value: normalized.value,
      ...(located.page != null ? { page: located.page } : {}),
      ...(located.confidence != null ? { confidence: located.confidence } : {}),
      needsAttention: reasons.length > 0,
      ...(reasons.length ? { attentionReason: reasons.join(" · ") } : {}),
    });
  }

  const images: DocumentExtraction["images"] = [];
  for (const page of ocr.pages) {
    for (const image of page.images) {
      const c = image.classification;
      if (!c || DISCARDED_IMAGE_KINDS.has(c.kind)) continue;
      images.push({
        page: page.index,
        id: image.id,
        kind: c.kind,
        relevant: PRESENCE_ONLY[c.kind] ? false : c.relevant,
        description: PRESENCE_ONLY[c.kind] ?? c.description.trim(),
      });
    }
  }

  return {
    id: input.id,
    fileSha256: input.fileSha256,
    ocrModel: ocr.model,
    documentType: input.documentType,
    schemaCode: input.schemaCode,
    schemaVersion: input.schemaVersion,
    pages,
    candidates,
    images,
    createdAt: input.createdAt,
    isLab: input.isLab,
  };
}
