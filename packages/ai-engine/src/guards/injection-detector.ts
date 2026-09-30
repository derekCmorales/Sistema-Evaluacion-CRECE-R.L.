import type { InjectionPattern } from "../config/engine-config";
import type { InjectionSignal } from "../contracts/ocr";

/**
 * Caracteres invisibles o de control de dirección. No aportan nada a un documento del
 * expediente y sirven para ocultar u ofuscar instrucciones (spec ai-safety).
 */
export const INVISIBLE_CHARS = /[­​-‏‪-‮⁠-⁤⁦-⁩﻿]/gu;
const BIDI_CONTROLS = /[‪-‮⁦-⁩]/u;

/** Quita los invisibles sin alterar el resto del texto (lo que se guarda y se muestra). */
export function stripInvisible(text: string): string {
  return text.replace(INVISIBLE_CHARS, "");
}

/**
 * Forma canónica para detectar: NFKC (letras de ancho completo, ligaduras, homóglifos de
 * compatibilidad), sin invisibles, sin acentos, minúsculas y espacios simples.
 */
export function canonicalForDetection(text: string): string {
  return stripInvisible(text)
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const EXCERPT_MAX = 160;

function excerptAround(canonical: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(canonical.length, index + length + 40);
  const slice = canonical.slice(start, end);
  return (start > 0 ? "…" : "") + slice.slice(0, EXCERPT_MAX) + (end < canonical.length ? "…" : "");
}

export type CompiledInjectionPatterns = Array<{ id: string; regex: RegExp }>;

export function compileInjectionPatterns(patterns: InjectionPattern[]): CompiledInjectionPatterns {
  return patterns.map((p) => ({ id: p.id, regex: new RegExp(p.pattern, "u") }));
}

/**
 * Señales de texto dirigido a una IA. Determinístico y sin llamadas externas. Una señal es
 * para revisión humana: el texto se sigue tratando como dato y nunca se descarta.
 * Una sola señal por patrón y texto (el primer fragmento que coincide).
 */
export function detectInjection(text: string, patterns: CompiledInjectionPatterns): InjectionSignal[] {
  const signals: InjectionSignal[] = [];
  if (BIDI_CONTROLS.test(text)) {
    signals.push({ patternId: "bidi-control", excerpt: "Caracteres de control de dirección de texto (texto oculto u ofuscado)" });
  }
  const canonical = canonicalForDetection(text);
  for (const { id, regex } of patterns) {
    const match = regex.exec(canonical);
    if (match) signals.push({ patternId: id, excerpt: excerptAround(canonical, match.index, match[0].length) });
  }
  return signals;
}
