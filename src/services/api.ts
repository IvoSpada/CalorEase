// src/services/api.ts
const API_URL = "http://127.0.0.1:8000/api";

let authToken: string | null = null;

/**
 * Setea token en runtime y opcionalmente en localStorage
 * persist = true -> guarda en localStorage bajo 'authToken' y 'token' (compat)
 */
export function setAuthToken(token: string | null, persist: boolean = false) {
  authToken = token;
  if (persist) {
    if (token) {
      localStorage.setItem("authToken", token);
      localStorage.setItem("token", token); // compat con tester HTML
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
    }
  }
}

/** Devuelve token (memoria o localStorage). Soporta 'authToken' y 'token'. */
export function getAuthToken() {
  return authToken ?? localStorage.getItem("authToken") ?? localStorage.getItem("token");
}

async function safeParseResponse(res: Response) {
  const text = await res.text();
  try {
    return { parsed: text ? JSON.parse(text) : null, raw: text };
  } catch {
    return { parsed: null, raw: text };
  }
}

/**
 * request: hace fetch y retorna { ok, status, data?, raw?, error? }
 */
export async function request<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body: any = null,
  useAuth: boolean = false
): Promise<{ ok: boolean; status: number; data?: T | null; raw?: string | null; error?: any }> {
  const url = `${API_URL}/${endpoint.replace(/^\/+/, "")}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body != null) headers["Content-Type"] = "application/json";

  const token = authToken ?? localStorage.getItem("authToken") ?? localStorage.getItem("token");
  if (useAuth && token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (res.status === 503) {
      return { ok: false, status: 503, error: { message: "Service Unavailable" } };
    }

    const { parsed, raw } = await safeParseResponse(res);

    if (!res.ok) {
      return { ok: false, status: res.status, data: parsed, raw, error: parsed ?? raw };
    }

    return { ok: true, status: res.status, data: parsed ?? null, raw };
  } catch (err) {
    return { ok: false, status: 0, error: err };
  }
}

/* Convenience helpers */
export const api = {
  get: <T = any>(endpoint: string, useAuth = false) => request<T>(endpoint, "GET", null, useAuth),
  post: <T = any>(endpoint: string, body: any, useAuth = false) => request<T>(endpoint, "POST", body, useAuth),
  put: <T = any>(endpoint: string, body: any, useAuth = false) => request<T>(endpoint, "PUT", body, useAuth),
  del: <T = any>(endpoint: string, useAuth = false) => request<T>(endpoint, "DELETE", null, useAuth),
};
