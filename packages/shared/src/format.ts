export function formatGtq(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "Q0.00";
  const [int, dec] = n.toFixed(2).split(".");
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Q${withSep}.${dec}`;
}

/** Enmascara un DPI de 13 dígitos para listados. El valor completo no va en la URL. */
export function maskDpi(dpi: string): string {
  const digits = dpi.replace(/\D/g, "");
  if (digits.length !== 13) return "•••••••••••••";
  return `${digits.slice(0, 4)}•••••${digits.slice(-4)}`;
}

export function formatDateTimeGt(iso: string): string {
  return new Date(iso).toLocaleString("es-GT", {
    timeZone: "America/Guatemala",
    dateStyle: "short",
    timeStyle: "short",
  });
}
