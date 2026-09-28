import { GoogleGenAI, type GoogleGenAIOptions } from "@google/genai";
import type { AiEnv } from "../ai-env";

/** Timeout por solicitud al proveedor (ms). Las guardas de reintento viven en el motor. */
const REQUEST_TIMEOUT_MS = 120_000;

/**
 * Único punto que decide backend y autenticación de Google (design D3). Siempre pasa los
 * valores explícitos de AI_GOOGLE_*: el SDK también lee GOOGLE_API_KEY/GOOGLE_CLOUD_* por su
 * cuenta y no queremos credenciales implícitas.
 */
export function googleClientOptions(google: AiEnv["google"]): GoogleGenAIOptions {
  const httpOptions = { timeout: REQUEST_TIMEOUT_MS };

  if (google.backend === "developer-api") {
    if (!google.apiKey) throw new Error("AI_GOOGLE_API_KEY es obligatorio con developer-api");
    return { enterprise: false, apiKey: google.apiKey, httpOptions };
  }

  if (google.auth === "api-key") {
    if (!google.apiKey) throw new Error("AI_GOOGLE_API_KEY es obligatorio con AI_GOOGLE_AUTH=api-key");
    // Authorization key (atada a service account). Con proyecto → endpoint regional o global
    // del proyecto; sin proyecto → endpoint global de Agent Platform.
    return google.project
      ? {
          enterprise: true,
          apiKey: google.apiKey,
          project: google.project,
          location: google.location ?? "global",
          httpOptions,
        }
      : { enterprise: true, apiKey: google.apiKey, httpOptions };
  }

  if (!google.project) throw new Error("AI_GOOGLE_PROJECT es obligatorio con AI_GOOGLE_AUTH=adc");
  return { enterprise: true, project: google.project, location: google.location ?? "global", httpOptions };
}

export function createGoogleClient(google: AiEnv["google"]): GoogleGenAI {
  return new GoogleGenAI(googleClientOptions(google));
}

/** Quita material de credenciales de un mensaje de error antes de guardarlo o mostrarlo. */
export function redactSecrets(message: string, secrets: Array<string | undefined>): string {
  let out = message.replace(/([?&]key=)[^&\s"']+/gi, "$1***");
  for (const secret of secrets) {
    if (secret && secret.length >= 6) out = out.split(secret).join("***");
  }
  return out;
}
