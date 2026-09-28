import { AiEngineError } from "../contracts/errors";

export type FileKind = "PDF" | "JPEG" | "PNG";

export type PreflightResult = {
  kind: FileKind;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  sizeBytes: number;
  /** Páginas detectadas en un PDF; null si no se pueden contar sin descomprimir (object streams). */
  pageCount: number | null;
  /** Páginas a procesar (0-based) cuando hay que acotar el costo; undefined = todas. */
  pagesToProcess?: number[];
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

/**
 * Validación previa sin costo (design D5): tipo real por magic bytes (no por Content-Type),
 * tamaño, cifrado y páginas. Cualquier rechazo ocurre antes de llamar al proveedor.
 */
export function preflightDocument(bytes: Uint8Array, limits: PreflightLimits): PreflightResult {
  if (bytes.length === 0) {
    throw new AiEngineError("AI_INPUT_CORRUPT", "El archivo está vacío");
  }
  if (bytes.length > limits.maxFileBytes) {
    throw new AiEngineError(
      "AI_INPUT_TOO_LARGE",
      `El archivo pesa ${(bytes.length / MB).toFixed(1)} MB; el máximo es ${(limits.maxFileBytes / MB).toFixed(0)} MB`,
    );
  }

  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { kind: "JPEG", mimeType: "image/jpeg", sizeBytes: bytes.length, pageCount: 1 };
  }
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { kind: "PNG", mimeType: "image/png", sizeBytes: bytes.length, pageCount: 1 };
  }
  // %PDF- puede venir precedido de basura en los primeros 1024 bytes (tolerado por lectores).
  const head = latin1(bytes, 0, Math.min(bytes.length, 1024));
  if (!head.includes("%PDF-")) {
    throw new AiEngineError(
      "AI_INPUT_UNSUPPORTED_TYPE",
      "Formato no admitido: sube un PDF, JPG o PNG",
    );
  }

  const text = latin1(bytes);
  if (!text.slice(-2048).includes("%%EOF")) {
    throw new AiEngineError("AI_INPUT_CORRUPT", "El PDF está incompleto o dañado (sin marcador de fin)");
  }
  if (/\/Encrypt\s+\d+\s+\d+\s+R/.test(text) || /\/Encrypt\s*<</.test(text)) {
    throw new AiEngineError("AI_INPUT_ENCRYPTED", "PDF protegido con contraseña: súbelo sin protección");
  }

  const pageMatches = text.match(/\/Type\s*\/Page(?![s\w])/g);
  const pageCount = pageMatches ? pageMatches.length : null;
  if (pageCount != null && pageCount > limits.maxPages) {
    throw new AiEngineError(
      "AI_INPUT_TOO_LARGE",
      `El PDF tiene ${pageCount} páginas; el máximo es ${limits.maxPages}`,
    );
  }

  const result: PreflightResult = { kind: "PDF", mimeType: "application/pdf", sizeBytes: bytes.length, pageCount };
  // Si no se pudieron contar (páginas comprimidas), se acota el procesamiento para no pagar de más.
  if (pageCount == null) {
    result.pagesToProcess = Array.from({ length: limits.maxPages }, (_, i) => i);
  }
  return result;
}
