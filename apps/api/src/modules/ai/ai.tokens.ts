/** Tokens de inyección explícitos (design D18: Vitest/esbuild no emite metadata de tipos). */
export const AI_RUNTIME = Symbol("AI_RUNTIME");
export const AI_ENGINE = Symbol("AI_ENGINE");
export const AI_ENV = Symbol("AI_ENV");
/** Bus de eventos del motor: los módulos del anfitrión se suscriben aquí (in-process). */
export const AI_EVENTS = Symbol("AI_EVENTS");
