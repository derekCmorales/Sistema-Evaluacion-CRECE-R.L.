import { describe, expect, it } from "vitest";
import { AiEnvError, loadAiEnv } from "./ai-env";

const enabled = {
  AI_ENGINE_ENABLED: "true",
  DATABASE_URL: "postgresql://crece:x@localhost:5432/crece_eval",
  MISTRAL_API_KEY: "mistral-secret-value",
  AI_GOOGLE_API_KEY: "google-secret-value",
};

describe("loadAiEnv", () => {
  it("con el motor apagado no exige credenciales y usa valores por defecto", () => {
    const env = loadAiEnv({}, "/repo/apps/api");
    expect(env.engineEnabled).toBe(false);
    expect(env.embeddingDimensions).toBe(1536);
    expect(env.google).toMatchObject({ backend: "agent-platform", auth: "api-key" });
    expect(env.lab).toEqual({ enabled: false, retentionDays: 7, storageDir: "/repo/apps/api/.lab-storage" });
  });

  it("con el motor encendido falla al arrancar si falta una key, nombrando la variable", () => {
    const { MISTRAL_API_KEY: _omit, ...withoutMistral } = enabled;
    expect(() => loadAiEnv(withoutMistral)).toThrow(AiEnvError);
    expect(() => loadAiEnv(withoutMistral)).toThrow("MISTRAL_API_KEY");
  });

  it("los mensajes de error nunca incluyen valores secretos", () => {
    try {
      loadAiEnv({ ...enabled, AI_EMBEDDING_DIMENSIONS: "5000" });
      expect.unreachable();
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain("AI_EMBEDDING_DIMENSIONS");
      expect(message).not.toContain("google-secret-value");
      expect(message).not.toContain("mistral-secret-value");
    }
  });

  it("rechaza dimensiones fuera de 128–2000 (límite HNSW)", () => {
    expect(() => loadAiEnv({ AI_EMBEDDING_DIMENSIONS: "3072" })).toThrow("AI_EMBEDDING_DIMENSIONS");
    expect(() => loadAiEnv({ AI_EMBEDDING_DIMENSIONS: "64" })).toThrow();
    expect(loadAiEnv({ AI_EMBEDDING_DIMENSIONS: "1024" }).embeddingDimensions).toBe(1024);
  });

  it("el lab nunca se habilita en producción", () => {
    expect(loadAiEnv({ AI_LAB_ENABLED: "true", NODE_ENV: "development" }).lab.enabled).toBe(true);
    expect(loadAiEnv({ AI_LAB_ENABLED: "true", NODE_ENV: "production" }).lab.enabled).toBe(false);
  });

  it("ADC en Agent Platform exige proyecto; developer-api no admite ADC", () => {
    expect(() => loadAiEnv({ ...enabled, AI_GOOGLE_AUTH: "adc" })).toThrow("AI_GOOGLE_PROJECT");
    expect(() =>
      loadAiEnv({ ...enabled, AI_GOOGLE_AUTH: "adc", AI_GOOGLE_BACKEND: "developer-api", AI_GOOGLE_PROJECT: "p" }),
    ).toThrow("developer-api");
  });

  it("AI_DATABASE_URL tiene prioridad sobre DATABASE_URL", () => {
    const env = loadAiEnv({ ...enabled, AI_DATABASE_URL: "postgresql://ai" });
    expect(env.databaseUrl).toBe("postgresql://ai");
  });
});
