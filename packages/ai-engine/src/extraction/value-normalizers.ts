import { formatGtq } from "@crece/shared";
import type { FieldType } from "./document-schemas";

export type NormalizedValue = { value: string; attention?: string };

const MONTHS: Record<string, number> = {
  ene: 1, enero: 1, feb: 2, febrero: 2, mar: 3, marzo: 3, abr: 4, abril: 4, may: 5, mayo: 5,
  jun: 6, junio: 6, jul: 7, julio: 7, ago: 8, agosto: 8, sep: 9, sept: 9, septiembre: 9, setiembre: 9,
  oct: 10, octubre: 10, nov: 11, noviembre: 11, dic: 12, diciembre: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

function validDate(d: number, m: number, y: number): boolean {
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1) return false;
  return d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Montos es-GT: "Q12,500.00". Formatos europeos se convierten pero se marcan para revisión. */
export function normalizeMoney(raw: string): NormalizedValue {
  const cleaned = raw.replace(/\s+/g, "").replace(/^(GTQ|Q\.?)/i, "");
  if (/^\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(cleaned) || /^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { value: formatGtq(cleaned.replace(/,/g, "")) };
  }
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(cleaned) || /^\d+,\d{1,2}$/.test(cleaned)) {
    const asNumber = cleaned.replace(/\./g, "").replace(",", ".");
    return { value: formatGtq(asNumber), attention: `Formato de monto inusual ("${raw.trim()}"): verificar` };
  }
  return { value: raw.trim(), attention: "Monto no reconocido: verificar contra el documento" };
}

/** Fechas a dd/mm/aaaa. Acepta numéricas, ISO y con mes en español ("12 MAR 2030"). */
export function normalizeDate(raw: string): NormalizedValue {
  const text = raw.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  let d: number | undefined;
  let m: number | undefined;
  let y: number | undefined;

  const numeric = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (numeric) [d, m, y] = [Number(numeric[1]), Number(numeric[2]), Number(numeric[3])];
  if (d == null) {
    const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  }
  if (d == null) {
    const named = text.match(/^(\d{1,2})\s*(?:de\s+)?([a-z]+)\.?\s*(?:de(?:l)?\s+)?(\d{4})$/);
    if (named && MONTHS[named[2]!]) [d, m, y] = [Number(named[1]), MONTHS[named[2]!], Number(named[3])];
  }

  if (d != null && m != null && y != null && validDate(d, m, y)) {
    return { value: `${pad(d)}/${pad(m)}/${y}` };
  }
  return { value: raw.trim(), attention: "Fecha no reconocida: verificar contra el documento" };
}

/** CUI: 13 dígitos (8 correlativo + 1 verificador + 2 departamento + 2 municipio). */
export function normalizeCui(raw: string): NormalizedValue {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 13) {
    return { value: raw.trim(), attention: "CUI con formato inválido (deben ser 13 dígitos)" };
  }
  const formatted = `${digits.slice(0, 4)} ${digits.slice(4, 9)} ${digits.slice(9)}`;
  const department = Number(digits.slice(9, 11));
  if (department < 1 || department > 22) {
    return { value: formatted, attention: "El código de departamento del CUI no es válido" };
  }
  return { value: formatted };
}

export function normalizeInteger(raw: string): NormalizedValue {
  const match = raw.trim().match(/^(\d{1,6})\b/);
  if (match) return { value: String(Number(match[1])) };
  return { value: raw.trim(), attention: "Número no reconocido: verificar" };
}

export function normalizeFieldValue(type: FieldType, raw: string): NormalizedValue {
  switch (type) {
    case "money":
      return normalizeMoney(raw);
    case "date":
      return normalizeDate(raw);
    case "cui":
      return normalizeCui(raw);
    case "integer":
      return normalizeInteger(raw);
    case "text":
      return { value: raw.replace(/\s+/g, " ").trim() };
  }
}
