import { EncryptedPDFError, ParseSpeeds, PDFDocument } from "pdf-lib";
import { AiEngineError } from "../contracts/errors";

export type FileKind = "PDF" | "JPEG" | "PNG";

export type PreflightResult = {
  kind: FileKind;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  sizeBytes: number;
  /** Páginas del documento (1 para imágenes). Siempre conocidas: un PDF que no se puede contar se rechaza. */
  pageCount: number;
};

export type PreflightLimits = { maxFileBytes: number; maxPages: number };

const MB = 1024 * 1024;

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((b, i) => bytes[i] === b);
}

/** Latin-1 conserva cada byte como un carácter: sirve para buscar marcadores del PDF. */
function latin1(bytes: Uint8Array, from = 0, to = bytes.length): string {
  let out = "";
  const chunk = 0x8000;
  for (let i = from; i < to; i += chunk) {
    out += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, to)));
  }
  return out;
}

/** Tipo real por magic bytes (no por nombre ni Content-Type). null si no es un formato admitido. */
export function sniffFileKind(bytes: Uint8Array): { kind: FileKind; mimeType: PreflightResult["mimeType"] } | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { kind: "JPEG", mimeType: "image/jpeg" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: "PNG", mimeType: "image/png" };
  // %PDF- puede venir precedido de basura en los primeros 1024 bytes (tolerado por lectores).
  if (latin1(bytes, 0, Math.min(bytes.length, 1024)).includes("%PDF-")) return { kind: "PDF", mimeType: "application/pdf" };
  return null;
}

const ENCRYPTED_MESSAGE =
  "PDF protegido (contraseña o restricciones): ábrelo y guárdalo o imprímelo como PDF sin protección";

/** Cuenta páginas con un parser real: incluye PDFs con object streams y xref comprimido. */
async function countPdfPages(bytes: Uint8Array): Promise<number> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, {
      ignoreEncryption: false,
      updateMetadata: false,
      throwOnInvalidObject: false,
      parseSpeed: ParseSpeeds.Fastest,
    });
  } catch (error) {
    if (error instanceof EncryptedPDFError) throw new AiEngineError("AI_INPUT_ENCRYPTED", ENCRYPTED_MESSAGE);
    throw new AiEngineError("AI_INPUT_CORRUPT", "No se pudo leer la estructura del PDF: vuelve a exportarlo o sube una foto");
  }
  let pages: number;
  try {
    pages = doc.getPageCount();
  } catch {
    throw new AiEngineError("AI_INPUT_CORRUPT", "El PDF tiene el árbol de páginas dañado: vuelve a exportarlo");
  }
  if (pages < 1) throw new AiEngineError("AI_INPUT_CORRUPT", "El PDF no tiene páginas");
  return pages;
}

/**
 * Validación previa sin costo (design D5): tipo real por magic bytes, tamaño, cifrado y páginas.
 * Cualquier rechazo ocurre antes de llamar al proveedor, y el número de páginas siempre se conoce
 * (nunca se le pide al proveedor un rango adivinado).
 */
export async function preflightDocument(bytes: Uint8Array, limits: PreflightLimits): Promise<PreflightResult> {
  if (bytes.length === 0) {
    throw new AiEngineError("AI_INPUT_CORRUPT", "El archivo está vacío");
  }
  if (bytes.length > limits.maxFileBytes) {
    throw new AiEngineError(
      "AI_INPUT_TOO_LARGE",
      `El archivo pesa ${(bytes.length / MB).toFixed(1)} MB; el máximo es ${(limits.maxFileBytes / MB).toFixed(0)} MB`,
    );
  }

  const sniffed = sniffFileKind(bytes);
  if (!sniffed) {
    throw new AiEngineError("AI_INPUT_UNSUPPORTED_TYPE", "Formato no admitido: sube un PDF, JPG o PNG");
  }
  if (sniffed.kind !== "PDF") {
    return { ...sniffed, sizeBytes: bytes.length, pageCount: 1 };
  }

  const tail = latin1(bytes, Math.max(0, bytes.length - 2048));
  if (!tail.includes("%%EOF")) {
    throw new AiEngineError("AI_INPUT_CORRUPT", "El PDF está incompleto o dañado (sin marcador de fin)");
  }
  // El diccionario del trailer (o del xref stream) nunca va comprimido: /Encrypt se ve en claro.
  const text = latin1(bytes);
  if (/\/Encrypt\s+\d+\s+\d+\s+R/.test(text) || /\/Encrypt\s*<</.test(text)) {
    throw new AiEngineError("AI_INPUT_ENCRYPTED", ENCRYPTED_MESSAGE);
  }

  const pageCount = await countPdfPages(bytes);
  if (pageCount > limits.maxPages) {
    throw new AiEngineError("AI_INPUT_TOO_LARGE", `El PDF tiene ${pageCount} páginas; el máximo es ${limits.maxPages}`);
  }
  return { ...sniffed, sizeBytes: bytes.length, pageCount };
}
