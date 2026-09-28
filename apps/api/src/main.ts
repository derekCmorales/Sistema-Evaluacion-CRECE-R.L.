import "reflect-metadata";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DomainExceptionFilter } from "./common/domain-exception.filter";
import { loadAiEnv } from "./infrastructure/ai/ai-env";

function loadRootEnvFile(): void {
  try {
    // Desarrollo local: `.env` de la raíz del monorepo. En Docker las variables llegan por env_file.
    process.loadEnvFile(resolve(__dirname, "../../../.env"));
  } catch {
    // sin .env: variables del entorno
  }
}

async function bootstrap() {
  loadRootEnvFile();
  const app = await NestFactory.create(AppModule.forRoot(loadAiEnv()));
  app.useGlobalFilters(new DomainExceptionFilter());
  app.enableShutdownHooks();
  app.enableCors({
    origin: [
      "http://localhost:3000",
      process.env.WEB_ORIGIN ?? "http://localhost:3000",
    ],
  });
  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
}

bootstrap();
