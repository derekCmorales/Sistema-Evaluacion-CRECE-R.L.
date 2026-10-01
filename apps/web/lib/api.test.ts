import { describe, expect, it } from "vitest";
import { ApiError, apiRequest } from "./api";

function fakeFetch(status: number, body: unknown, seen: { url?: string; init?: RequestInit } = {}): typeof fetch {
  return (async (url: string, init?: RequestInit) => {
    seen.url = url;
    seen.init = init;
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
}

describe("cliente de la API", () => {
  it("envía la sesión de prueba en cabeceras y el cuerpo como JSON", async () => {
    const seen: { url?: string; init?: RequestInit } = {};
    await apiRequest("/persons", { method: "POST", body: { a: 1 }, session: { userId: "u-1", offices: ["ADVISOR", "BRANCH_HEAD"] } }, fakeFetch(201, {}, seen));
    const headers = seen.init?.headers as Record<string, string>;
    expect(headers["x-crece-user-id"]).toBe("u-1");
    expect(headers["x-crece-offices"]).toBe("ADVISOR,BRANCH_HEAD");
    expect(seen.init?.body).toBe('{"a":1}');
  });

  it("un duplicado trae el id de la persona existente para llevar a su perfil", async () => {
    const error = await apiRequest(
      "/persons",
      { method: "POST", body: {} },
      fakeFetch(409, { code: "DUPLICATE_PERSON", message: "Ya existe", existingPersonId: "p-1" }),
    ).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: "DUPLICATE_PERSON", existingPersonId: "p-1" });
  });

  it("sin API encendida el mensaje dice cómo corregir", async () => {
    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    await expect(apiRequest("/health", {}, down)).rejects.toMatchObject({ code: "NETWORK" });
  });
});
