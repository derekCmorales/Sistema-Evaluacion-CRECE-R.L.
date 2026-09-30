import { describe, expect, it } from "vitest";
import { AI_ENGINE_CONFIG_SEED, AiEngineConfigError, resolveAiEngineConfig } from "./engine-config";

describe("configuración del motor", () => {
  it("la semilla es válida y usa un modelo de OCR fijado", () => {
    expect(resolveAiEngineConfig()).toEqual(AI_ENGINE_CONFIG_SEED);
    expect(AI_ENGINE_CONFIG_SEED.models.ocr).toBe("mistral-ocr-4-1");
  });

  it("mezcla sin mutar la semilla", () => {
    const config = resolveAiEngineConfig({ extraction: { maxPages: 10 } });
    expect(config.extraction.maxPages).toBe(10);
    expect(config.extraction.maxFileBytes).toBe(AI_ENGINE_CONFIG_SEED.extraction.maxFileBytes);
    expect(AI_ENGINE_CONFIG_SEED.extraction.maxPages).toBe(60);
  });

  it("rechaza alias móviles de modelo (la deduplicación depende de la versión)", () => {
    expect(() => resolveAiEngineConfig({ models: { ocr: "mistral-ocr-latest" } })).toThrow(AiEngineConfigError);
    expect(() => resolveAiEngineConfig({ models: { llm: "gemini-flash-latest" } })).toThrow("models.llm");
  });

  it("valida tipos y rangos de ai.config al arrancar, nombrando la clave", () => {
    expect(() => resolveAiEngineConfig({ extraction: { confidenceThreshold: 1.5 } })).toThrow("extraction.confidenceThreshold");
    expect(() => resolveAiEngineConfig({ extraction: { maxPages: "60" as never } })).toThrow("extraction.maxPages");
    expect(() => resolveAiEngineConfig({ runs: { workerConcurrency: 0 } })).toThrow("runs.workerConcurrency");
  });

  it("el plazo de ejecución trabada debe superar el de reclamo", () => {
    expect(() => resolveAiEngineConfig({ runs: { leaseSeconds: 600, stalledAfterSeconds: 600 } })).toThrow("stalledAfterSeconds");
  });

  it("los patrones de inyección son configuración y se validan como expresiones regulares", () => {
    const config = resolveAiEngineConfig({ safety: { injectionPatterns: [{ id: "custom", pattern: "palabra clave" }] } });
    expect(config.safety.injectionPatterns).toEqual([{ id: "custom", pattern: "palabra clave" }]);
    expect(() => resolveAiEngineConfig({ safety: { injectionPatterns: [{ id: "roto", pattern: "(" }] } })).toThrow("expresión regular inválida");
    expect(() => resolveAiEngineConfig({ safety: { injectionPatterns: [] } })).toThrow("safety.injectionPatterns");
  });
});
