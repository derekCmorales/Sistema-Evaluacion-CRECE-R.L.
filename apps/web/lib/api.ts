export type SessionActor = {
  userId: string;
  offices: string[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function api<T>(
  path: string,
  actor: SessionActor,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  headers.set("x-crece-user", actor.userId);
  headers.set("x-crece-offices", actor.offices.join(","));
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
  };
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(" ")
      : payload.message;
    throw new Error(message || "No se pudo completar la solicitud");
  }
  return payload as T;
}

export function apiPublic<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then(async (response) => {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) throw new Error(payload.message || "No se pudo enviar");
    return payload as T;
  });
}
