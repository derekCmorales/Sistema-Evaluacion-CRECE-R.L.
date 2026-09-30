import {
  Inject,
  Module,
  type DynamicModule,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from "@nestjs/common";
import type { AiEnv } from "../../infrastructure/ai/ai-env";
import { composeAiRuntime, type AiRuntime, type AiRuntimeOptions } from "./ai-runtime";
import { AI_ENGINE, AI_ENV, AI_EVENTS, AI_RUNTIME } from "./ai.tokens";

const AI_ROLE = Symbol("AI_ROLE");

/**
 * Bounded context de IA en Nest. Solo este módulo conoce Nest; el motor vive en
 * `@crece/ai-engine`. Es global: los módulos del anfitrión inyectan `AI_ENGINE` (la fachada) y
 * `AI_EVENTS` (el bus de eventos) sin importarlo. No sabe nada del laboratorio: las fuentes de
 * documentos adicionales llegan por `documentRoutes`.
 */
@Module({})
export class AiModule implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(
    @Inject(AI_RUNTIME) private readonly runtime: AiRuntime,
    @Inject(AI_ROLE) private readonly role: AiRuntimeOptions["role"],
  ) {}

  static register(env: AiEnv, options: AiRuntimeOptions): DynamicModule {
    return {
      module: AiModule,
      global: true,
      providers: [
        { provide: AI_ENV, useValue: env },
        { provide: AI_ROLE, useValue: options.role },
        { provide: AI_RUNTIME, useFactory: () => composeAiRuntime(env, options) },
        { provide: AI_ENGINE, useFactory: (runtime: AiRuntime) => runtime.engine, inject: [AI_RUNTIME] },
        { provide: AI_EVENTS, useFactory: (runtime: AiRuntime) => runtime.events, inject: [AI_RUNTIME] },
      ],
      exports: [AI_ENGINE, AI_ENV, AI_RUNTIME, AI_EVENTS],
    };
  }

  /** En la API, los eventos del motor llegan a los suscriptores del anfitrión. */
  onApplicationBootstrap(): void {
    if (this.role === "api") this.runtime.startRelay();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.runtime.close();
  }
}
