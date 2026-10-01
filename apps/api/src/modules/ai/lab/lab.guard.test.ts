import { NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { loadAiEnv } from "../../../infrastructure/ai/ai-env";
import { LabGuard } from "./lab.guard";

const keys = { MISTRAL_API_KEY: "x", AI_GOOGLE_API_KEY: "y", DATABASE_URL: "postgresql://x" };

describe("LabGuard", () => {
  it("permite el lab en desarrollo con motor y flag encendidos", () => {
    const env = loadAiEnv({ ...keys, AI_ENGINE_ENABLED: "true", AI_LAB_ENABLED: "true", NODE_ENV: "development" });
    expect(new LabGuard(env).canActivate()).toBe(true);
  });

  it("404 en producción aunque el flag esté activo", () => {
    const env = loadAiEnv({ ...keys, AI_ENGINE_ENABLED: "true", AI_LAB_ENABLED: "true", NODE_ENV: "production" });
    expect(() => new LabGuard(env).canActivate()).toThrow(NotFoundException);
  });

  it("404 con el flag apagado o el motor apagado", () => {
    expect(() => new LabGuard(loadAiEnv({ ...keys, AI_ENGINE_ENABLED: "true" })).canActivate()).toThrow(NotFoundException);
    expect(() => new LabGuard(loadAiEnv({ AI_LAB_ENABLED: "true" })).canActivate()).toThrow(NotFoundException);
  });
});
