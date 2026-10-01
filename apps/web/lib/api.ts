import type { Office } from "@crece/shared";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Error de la API con el código de dominio, para que la pantalla diga cómo corregir. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly existingPersonId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type SessionHeaders = { userId: string; offices: Office[] };

export type ApiRequest = {
  method?: "GET" | "POST" | "PUT" | "PATCH";
  body?: unknown;
  session?: SessionHeaders;
};

export async function apiRequest<T>(path: string, request: ApiRequest = {}, fetcher: typeof fetch = fetch): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (request.body !== undefined) headers["content-type"] = "application/json";
  if (request.session) {
    headers["x-crece-user-id"] = request.session.userId;
    headers["x-crece-offices"] = request.session.offices.join(",");
  }

  let res: Response;
  try {
    res = await fetcher(`${API_BASE}${path}`, {
      method: request.method ?? "GET",
      headers,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "NETWORK", "No pudimos conectar con la API. Revisa que esté encendida e inténtalo de nuevo.");
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const data = (payload ?? {}) as { code?: string; message?: string | string[]; existingPersonId?: string };
    const message = Array.isArray(data.message) ? data.message.join(". ") : data.message;
    throw new ApiError(res.status, data.code ?? `HTTP_${res.status}`, message ?? "La API respondió con un error", data.existingPersonId);
  }
  return payload as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado. Inténtalo de nuevo.";
}
