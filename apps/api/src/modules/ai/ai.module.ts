import { Inject, Module, type DynamicModule, type OnApplicationShutdown } from "@nestjs/common";
import type { AiEnv } from "../../infrastructure/ai/ai-env";
import { composeAiRuntime, type AiRuntime } from "./ai-runtime";
import { AI_ENGINE, AI_ENV, AI_RUNTIME } from "./ai.tokens";

/**
 * Bounded context de IA en Nest. Solo este módulo conoce Nest; el motor vive en
 * `@crece/ai-engine`. Otros módulos inyectan `AI_ENGINE` (la fachada) y nada más.
 */
@Module({})
export class AiModule implements OnApplicationShutdown {
  constructor(@Inject(AI_RUNTIME) private readonly runtime: AiRuntime) {}

  static register(env: AiEnv, controllers: DynamicModule["controllers"] = []): DynamicModule {
    return {
      module: AiModule,
      controllers,
      providers: [
        { provide: AI_ENV, useValue: env },
        { provide: AI_RUNTIME, useFactory: () => composeAiRuntime(env) },
        { provide: AI_ENGINE, useFactory: (runtime: AiRuntime) => runtime.engine, inject: [AI_RUNTIME] },
      ],
      exports: [AI_ENGINE, AI_ENV, AI_RUNTIME],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.runtime.close();
  }
}
