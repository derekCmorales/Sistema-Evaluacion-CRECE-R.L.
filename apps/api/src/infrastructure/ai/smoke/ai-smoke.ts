/**
 * Smoke de credenciales de IA: una llamada mínima a Gemini (generación + embeddings) y a
 * Mistral (listado de modelos). Nunca imprime keys.
 *
 *   pnpm --filter @crece/api ai:smoke [modeloLLM] [modeloEmbeddings]
 */
import { Mistral } from "@mistralai/mistralai";
import { ThinkingLevel } from "@google/genai";
import { loadAiEnv } from "../ai-env";
import { createGoogleClient, redactSecrets } from "../google/google-client-factory";

/** Devuelve el número de verificaciones fallidas. */
export async function runAiSmoke(argv: string[] = process.argv.slice(2)): Promise<number> {
  const env = loadAiEnv();
  const llmModel = argv[0] ?? "gemini-3.8-flash";
  const embeddingModel = argv[1] ?? "gemini-embedding-2";
  const secrets = [env.google.apiKey, env.mistralApiKey];
  const safe = (error: unknown) => redactSecrets(error instanceof Error ? error.message : String(error), secrets);

  console.log(
    `Google: backend=${env.google.backend} auth=${env.google.auth} proyecto=${env.google.project ? "definido" : "—"} ` +
      `región=${env.google.location ?? "(global)"} key=${env.google.apiKey ? "definida" : "FALTA"}`,
  );
  let failures = 0;

  if (env.google.apiKey || env.google.auth === "adc") {
    const google = createGoogleClient(env.google);
    try {
      const started = Date.now();
      const response = await google.models.generateContent({
        model: llmModel,
        contents: "Responde exactamente con la palabra: listo",
        config: { maxOutputTokens: 64, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
      });
      const usage = response.usageMetadata;
      console.log(
        `  ✓ ${llmModel}: "${(response.text ?? "").trim()}" (${Date.now() - started} ms, entrada=${usage?.promptTokenCount ?? "?"}, ` +
          `salida=${usage?.candidatesTokenCount ?? "?"}, razonamiento=${usage?.thoughtsTokenCount ?? 0}, versión=${response.modelVersion ?? "?"})`,
      );
    } catch (error) {
      failures += 1;
      console.log(`  ✗ ${llmModel}: ${safe(error)}`);
    }
    try {
      const response = await google.models.embedContent({
        model: embeddingModel,
        contents: "task: search result | query: requisitos del fiador",
        config: { outputDimensionality: env.embeddingDimensions },
      });
      const values = response.embeddings?.[0]?.values ?? [];
      const norm = Math.hypot(...values);
      console.log(`  ✓ ${embeddingModel}: ${values.length} dimensiones (norma ${norm.toFixed(4)})`);
      if (values.length !== env.embeddingDimensions) {
        failures += 1;
        console.log(`  ✗ se esperaban ${env.embeddingDimensions} dimensiones`);
      }
    } catch (error) {
      failures += 1;
      console.log(`  ✗ ${embeddingModel}: ${safe(error)}`);
    }
  } else {
    failures += 1;
    console.log("  ✗ Falta AI_GOOGLE_API_KEY en .env");
  }

  console.log(`Mistral: key=${env.mistralApiKey ? "definida" : "FALTA"}`);
  if (env.mistralApiKey) {
    try {
      const mistral = new Mistral({ apiKey: env.mistralApiKey });
      const models = await mistral.models.list();
      const ocr = (models.data ?? [])
        .flatMap((m) => ("id" in m && typeof m.id === "string" ? [m.id] : []))
        .filter((id) => id.includes("ocr"));
      console.log(`  ✓ modelos OCR disponibles: ${ocr.join(", ") || "(ninguno listado)"}`);
    } catch (error) {
      failures += 1;
      console.log(`  ✗ Mistral: ${safe(error)}`);
    }
  } else {
    failures += 1;
  }

  return failures;
}
