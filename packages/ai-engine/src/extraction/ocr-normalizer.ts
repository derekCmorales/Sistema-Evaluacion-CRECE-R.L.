import type {
  BoundingBox,
  DocumentExtraction,
  ExtractedFieldCandidate,
  OcrDocument,
  OcrPage,
} from "../contracts/ocr";
import { detectInjection, stripInvisible, type CompiledInjectionPatterns } from "../guards/injection-detector";
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

/**
 * Normaliza el markdown de una página (design D5): NFC, sin caracteres invisibles, palabras
 * partidas por guion al final de línea, espacios y números de página. Los marcadores de imagen
 * se quitan: la descripción de una imagen la escribe el modelo de OCR, así que vive en
 * `images` y nunca se mezcla con el texto del documento (que es lo único citable como evidencia).
 */
export function normalizePageText(markdown: string): string {
  return stripInvisible(markdown.normalize("NFC"))
    .replace(/\r\n?/g, "\n")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
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

type LocatedValue = { page?: number; confidence?: number; bbox?: BoundingBox };

const tokens = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/**
 * Ubica un valor en el texto para darle página, confianza y región. Valores de 2+ caracteres:
 * por subcadena comparable. Valores cortos ("7", "0"): la línea debe contener el valor como token
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
    return {
      page: page.index,
      ...((block?.confidence ?? page.confidence) != null ? { confidence: block?.confidence ?? page.confidence } : {}),
      ...(block?.bbox ? { bbox: block.bbox } : {}),
    };
  }
  return {};
}

export type BuildExtractionInput = {
  id: string;
  fileSha256: string;
  documentType: string;
  schemaCode: string;
  schemaVersion: number;
  pipelineFingerprint: string;
  schema: DocumentSchema | null;
  ocr: OcrDocument;
  confidenceThreshold: number;
  injectionPatterns: CompiledInjectionPatterns;
  createdAt: string;
  isLab: boolean;
};

const INJECTION_ATTENTION = "La página contiene texto dirigido a una IA: verificar el valor contra el documento";

/**
 * Traduce el `OcrDocument` del proveedor a una extracción del motor: páginas normalizadas con
 * sus señales de inyección, candidatos para confirmación humana (nunca confirmados) e imágenes
 * clasificadas.
 */
export function buildExtraction(input: BuildExtractionInput): DocumentExtraction {
  const { ocr } = input;
  const texts = ocr.pages.map((p) => normalizePageText(p.markdown));

  const pages: DocumentExtraction["pages"] = ocr.pages.map((page, i) => {
    const previousHeader = i > 0 ? lastTableHeader(texts[i - 1]!) : null;
    // Encabezado, pie y descripciones de imágenes también se revisan: una instrucción puede
    // esconderse ahí (p. ej. texto dentro de una imagen que el OCR describe).
    const imageTexts = page.images.map((img) => img.classification?.description ?? "");
    const signals = detectInjection(
      [page.header ?? "", texts[i]!, page.footer ?? "", ...imageTexts].join("\n"),
      input.injectionPatterns,
    );
    return {
      index: page.index,
      text: texts[i]!,
      ...(page.header ? { header: stripInvisible(page.header).trim() } : {}),
      ...(page.footer ? { footer: stripInvisible(page.footer).trim() } : {}),
      ...(page.confidence != null ? { confidence: page.confidence } : {}),
      ...(previousHeader && firstLine(texts[i]!) === previousHeader ? { tableContinuesFromPrevious: true } : {}),
      ...(signals.length ? { injectionSignals: signals } : {}),
    };
  });
  const pagesWithSignals = new Set(pages.filter((p) => p.injectionSignals?.length).map((p) => p.index));

  const candidates: ExtractedFieldCandidate[] = [];
  for (const field of input.schema?.fields ?? []) {
    const raw = ocr.annotation?.[field.key];
    if (raw == null) continue;
    const rawText = stripInvisible(String(raw)).trim();
    if (!rawText || rawText.toLowerCase() === "null") continue;

    const normalized = normalizeFieldValue(field.type, rawText);
    const located = locate(normalized.value, rawText, field.label, ocr.pages, texts);
    const reasons: string[] = [];
    if (normalized.attention) reasons.push(normalized.attention);
    if (located.page == null) reasons.push("No aparece en el texto extraído: verificar contra el documento");
    if (located.confidence != null && located.confidence < input.confidenceThreshold) {
      reasons.push("Revisar: baja confianza");
    }
    // Un valor ubicado en una página con instrucciones para la IA pudo ser plantado ahí.
    if (located.page != null ? pagesWithSignals.has(located.page) : pagesWithSignals.size > 0) {
      reasons.push(INJECTION_ATTENTION);
    }
    candidates.push({
      id: `${input.id}:${field.key}`,
      fieldKey: field.key,
      fieldLabel: field.label,
      value: normalized.value,
      ...(located.page != null ? { page: located.page } : {}),
      ...(located.bbox ? { bbox: located.bbox } : {}),
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
        description: PRESENCE_ONLY[c.kind] ?? stripInvisible(c.description).trim(),
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
    pipelineFingerprint: input.pipelineFingerprint,
    injectionSuspected: pagesWithSignals.size > 0,
    pages,
    candidates,
    images,
    createdAt: input.createdAt,
    isLab: input.isLab,
  };
}
