/**
 * @crece/ai-engine — API pública del motor de IA.
 * Contratos (comandos, hechos, eventos, DTOs, errores), puertos y la fachada `AiEngine`.
 * Todo lo demás es interno y no se puede importar desde fuera del paquete.
 */
export * from "./contracts";
export type * from "./ports";
export * from "./engine-api";
export { createAiEngine, type AiEngineDeps } from "./engine";
export {
  AI_ENGINE_CONFIG_SEED,
  AiEngineConfigError,
  resolveAiEngineConfig,
  type AiEngineConfig,
  type AiEngineConfigOverrides,
  type InjectionPattern,
} from "./config/engine-config";
export { documentTypeCatalog, DOCUMENT_TYPE_LABELS, type DocumentTypeInfo } from "./catalog";
