/** Extracción de texto desde documentos escaneados (confirmación humana obligatoria en UI). */
export interface OcrProvider {
  extractText(input: { documentRef: string; mimeType: string }): Promise<string>;
}
