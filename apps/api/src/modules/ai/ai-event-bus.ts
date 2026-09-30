import type { AiEngineEvent } from "@crece/ai-engine";

export type AiEventHandler = (event: AiEngineEvent) => Promise<void> | void;

/**
 * Bus in-process de eventos del motor (design D2). Los módulos del anfitrión (operaciones,
 * documentos) se suscriben inyectando `AI_EVENTS`. La entrega es "al menos una vez": un handler
 * debe ser idempotente por `event.eventId`. Si un handler lanza, el relay reintenta el evento.
 */
export class AiEventBus {
  private readonly handlers = new Set<AiEventHandler>();

  subscribe(handler: AiEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  get subscriberCount(): number {
    return this.handlers.size;
  }

  async publish(event: AiEngineEvent): Promise<void> {
    for (const handler of this.handlers) await handler(event);
  }
}
