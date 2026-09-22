/** Asistencia IA en revisión — nunca emite veredicto ni puntaje. */
export interface LlmAssistant {
  summarizeReview(input: { operationId: string; excerpt: string }): Promise<string>;
}
