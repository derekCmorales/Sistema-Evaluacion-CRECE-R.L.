/**
 * Archivos sintéticos mínimos para pruebas (no son documentos reales ni tienen PII).
 * PDF válido de N páginas con texto; variantes cifrada y truncada.
 */

const encoder = new TextEncoder();

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** PDF 1.4 sin compresión con una línea de texto por página (Helvetica, WinAnsi). */
export function syntheticPdf(pages: string[][], options: { encrypted?: boolean } = {}): Uint8Array {
  const objects: string[] = [];
  const pageIds: number[] = [];
  const fontId = 3;
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[fontId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  let next = 4;
  for (const lines of pages) {
    const contentId = next++;
    const pageId = next++;
    const body = lines
      .map((line, i) => `BT /F1 11 Tf 50 ${780 - i * 16} Td (${escapePdfText(line)}) Tj ET`)
      .join("\n");
    objects[contentId] = `<< /Length ${body.length} >>\nstream\n${body}\nendstream`;
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R ` +
      `/Resources << /Font << /F1 ${fontId} 0 R >> >> >>`;
    pageIds.push(pageId);
  }
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  const encrypt = options.encrypted ? " /Encrypt 99 0 R" : "";
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R${encrypt} >>\nstartxref\n${xref}\n%%EOF\n`;
  return encoder.encode(pdf);
}

export function truncatedPdf(): Uint8Array {
  const full = syntheticPdf([["Documento truncado"]]);
  return full.subarray(0, full.length - 40);
}

/** Cabecera PNG válida + relleno (suficiente para el preflight). */
export function syntheticPng(): Uint8Array {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82]);
}

export function syntheticJpeg(): Uint8Array {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0]);
}
