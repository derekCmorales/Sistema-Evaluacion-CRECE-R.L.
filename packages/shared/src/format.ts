export function formatGtq(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "Q0.00";
  const [int, dec] = n.toFixed(2).split(".");
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Q${withSep}.${dec}`;
}

export function formatDateTimeGt(iso: string): string {
  return new Date(iso).toLocaleString("es-GT", {
    timeZone: "America/Guatemala",
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** DPI para mostrar: `2345 67890 0101`. Acepta el DPI normalizado de 13 dígitos. */
export function formatDpi(dpi: string): string {
  const digits = dpi.replace(/\D/g, "");
  if (digits.length !== 13) return dpi;
  return `${digits.slice(0, 4)} ${digits.slice(4, 9)} ${digits.slice(9)}`;
}

/** DPI enmascarado para listados: solo los últimos 4 dígitos quedan visibles. */
export function maskDpi(dpi: string): string {
  const digits = dpi.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `•••• ••••• ${digits.slice(-4)}`;
}
