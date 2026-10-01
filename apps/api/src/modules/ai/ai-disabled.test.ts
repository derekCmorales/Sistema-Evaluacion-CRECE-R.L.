import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import type { AiEngine } from "@crece/ai-engine";
import { advisorRequester } from "@crece/ai-engine/testing";
import { httpStatusForDomainCode } from "../../common/domain-exception.filter";
import { loadAiEnv } from "../../infrastructure/ai/ai-env";
import { AiModule } from "./ai.module";
import { composeAiRuntime } from "./ai-runtime";
import type { AiEventBus } from "./ai-event-bus";
import { AI_ENGINE, AI_EVENTS } from "./ai.tokens";

const disabledEnv = loadAiEnv({ AI_ENGINE_ENABLED: "false" });

describe("motor de IA apagado", () => {
  it("todo comando responde AI_DISABLED y el HTTP lo traduce a 503", async () => {
    const runtime = await composeAiRuntime(disabledEnv, { role: "api" });
    expect(runtime.engine.enabled).toBe(false);
    await expect(
      runtime.engine.extractDocument({ documentRef: "doc-1", documentType: "DPI", requestedBy: advisorRequester }),
    ).rejects.toMatchObject({ code: "AI_DISABLED" });
    expect(httpStatusForDomainCode("AI_DISABLED")).toBe(503);
    await runtime.close();
  });

  it("no abre conexiones ni requiere credenciales; la salud dice apagado", async () => {
    const runtime = await composeAiRuntime(loadAiEnv({}), { role: "worker" });
    expect(runtime.pool).toBeNull();
    expect(await runtime.health()).toMatchObject({ enabled: false, workersOnline: 0 });
    await runtime.startWorker(); // no hace nada
  });

  it("el AiModule arranca en Nest, es global y expone la fachada y el bus por token", async () => {
    const app = await NestFactory.createApplicationContext(AiModule.register(disabledEnv, { role: "api" }), { logger: false });
    const engine = app.get<AiEngine>(AI_ENGINE);
    expect(engine.enabled).toBe(false);
    expect(typeof app.get<AiEventBus>(AI_EVENTS).subscribe).toBe("function");
    await app.close();
  });

  it("errores del motor se mapean a estados HTTP estables", () => {
    expect(httpStatusForDomainCode("AI_INPUT_TOO_LARGE")).toBe(413);
    expect(httpStatusForDomainCode("AI_INPUT_UNSUPPORTED_TYPE")).toBe(415);
    expect(httpStatusForDomainCode("AI_FORBIDDEN")).toBe(403);
    expect(httpStatusForDomainCode("AI_PROVIDER_TIMEOUT")).toBe(504);
    expect(httpStatusForDomainCode("AI_TASK_UNAVAILABLE")).toBe(501);
    expect(httpStatusForDomainCode("AI_RUN_INTERRUPTED")).toBe(503);
    expect(httpStatusForDomainCode("AI_INTERNAL")).toBe(500);
    expect(httpStatusForDomainCode("VALIDATION")).toBe(400);
  });
});
