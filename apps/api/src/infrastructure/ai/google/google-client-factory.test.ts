import { describe, expect, it } from "vitest";
import { googleClientOptions, redactSecrets } from "./google-client-factory";

describe("googleClientOptions", () => {
  it("Agent Platform con authorization key y sin proyecto usa el endpoint global", () => {
    const options = googleClientOptions({ backend: "agent-platform", auth: "api-key", apiKey: "k-123456" });
    expect(options).toMatchObject({ enterprise: true, apiKey: "k-123456" });
    expect(options.project).toBeUndefined();
    expect(options.location).toBeUndefined();
  });

  it("Agent Platform con key y proyecto pasa proyecto y región (global por defecto)", () => {
    expect(
      googleClientOptions({ backend: "agent-platform", auth: "api-key", apiKey: "k-123456", project: "crece-test" }),
    ).toMatchObject({ enterprise: true, apiKey: "k-123456", project: "crece-test", location: "global" });
    expect(
      googleClientOptions({
        backend: "agent-platform",
        auth: "api-key",
        apiKey: "k-123456",
        project: "crece-test",
        location: "us-central1",
      }).location,
    ).toBe("us-central1");
  });

  it("ADC no envía key", () => {
    const options = googleClientOptions({ backend: "agent-platform", auth: "adc", project: "crece-test" });
    expect(options).toMatchObject({ enterprise: true, project: "crece-test", location: "global" });
    expect(options.apiKey).toBeUndefined();
  });

  it("developer-api (AI Studio) solo con key y sin enterprise", () => {
    expect(googleClientOptions({ backend: "developer-api", auth: "api-key", apiKey: "k-123456" })).toMatchObject({
      enterprise: false,
      apiKey: "k-123456",
    });
  });

  it("siempre fija un timeout por solicitud", () => {
    expect(
      googleClientOptions({ backend: "agent-platform", auth: "api-key", apiKey: "k-123456" }).httpOptions?.timeout,
    ).toBe(120_000);
  });

  it("falla sin credencial requerida", () => {
    expect(() => googleClientOptions({ backend: "agent-platform", auth: "api-key" })).toThrow("AI_GOOGLE_API_KEY");
    expect(() => googleClientOptions({ backend: "agent-platform", auth: "adc" })).toThrow("AI_GOOGLE_PROJECT");
  });
});

describe("redactSecrets", () => {
  it("oculta la key en URLs y en texto libre", () => {
    const secret = "AIzaSyD-super-secret";
    const message = `401 https://aiplatform.googleapis.com/v1/x?key=${secret}&alt=json — clave ${secret} inválida`;
    const redacted = redactSecrets(message, [secret]);
    expect(redacted).not.toContain(secret);
    expect(redacted).toContain("key=***");
  });
});
