import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import type { AiEngine } from "@crece/ai-engine";
import { advisorRequester } from "@crece/ai-engine/testing";
import { httpStatusForDomainCode } from "../../common/domain-exception.filter";
import { loadAiEnv } from "../../infrastructure/ai/ai-env";
import { AiModule } from "./ai.module";
import { composeAiRuntime } from "./ai-runtime";
import { AI_ENGINE } from "./ai.tokens";

const disabledEnv = loadAiEnv({ AI_ENGINE_ENABLED: "false" });

describe("motor de IA apagado", () => {
  it("todo comando responde AI_DISABLED y el HTTP lo traduce a 503", async () => {
    const runtime = await composeAiRuntime(disabledEnv);
    expect(runtime.engine.enabled).toBe(false);
    await expect(
      runtime.engine.extractDocument({ documentRef: "lab/x", documentType: "DPI", requestedBy: advisorRequester }),
    ).rejects.toMatchObject({ code: "AI_DISABLED" });
    expect(httpStatusForDomainCode("AI_DISABLED")).toBe(503);
    await runtime.close();
  });

  it("no abre conexiones ni requiere credenciales", async () => {
    const runtime = await composeAiRuntime(loadAiEnv({}));
    expect(runtime.queue).toBeNull();
    expect(runtime.labStorage).toBeNull();
  });

  it("el AiModule arranca en Nest y expone la fachada por token", async () => {
    const app = await NestFactory.createApplicationContext(AiModule.register(disabledEnv), { logger: false });
    const engine = app.get<AiEngine>(AI_ENGINE);
    expect(engine.enabled).toBe(false);
    await app.close();
  });

  it("errores del motor se mapean a estados HTTP estables", () => {
    expect(httpStatusForDomainCode("AI_INPUT_TOO_LARGE")).toBe(413);
    expect(httpStatusForDomainCode("AI_INPUT_UNSUPPORTED_TYPE")).toBe(415);
    expect(httpStatusForDomainCode("AI_FORBIDDEN")).toBe(403);
    expect(httpStatusForDomainCode("AI_PROVIDER_TIMEOUT")).toBe(504);
    expect(httpStatusForDomainCode("VALIDATION")).toBe(400);
  });
});
