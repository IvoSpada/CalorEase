/**
 * IA service wrapper
 * - Provee analyzeFood() y generateDiet() con timeout y parse seguro.
 */
import type { Dieta, ComidaDieta } from "../types"; // Asumiendo que tienes types

type IAResult<T = any> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data?: T | null; raw?: string | null; error?: any };

// NOTA: Estas variables de entorno deben estar en tu .env.local o similar
const IA_HOST = (import.meta.env.VITE_IA_HOST as string) || "127.0.0.1";
const IA_PORT = (import.meta.env.VITE_IA_PORT as string) || "5000"; // Puerto de tu backend de IA (Python/Flask)
const IA_URL = `http://${IA_HOST}:${IA_PORT}`.replace(/\/+$/, "");

console.log("IA Service URL:", IA_URL);

/** Helper: fetch with timeout and safe parse */
async function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 15000
): Promise<{ ok: boolean; status: number; parsed?: any; raw?: string; error?: any }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, ...opts });
    clearTimeout(id);
    const raw = await res.text();
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      return { ok: res.ok, status: res.status, parsed, raw };
    } catch {
      // no JSON, pero la respuesta puede ser un string válido
      return { ok: res.ok, status: res.status, parsed: raw, raw };
    }
  } catch (err) {
    clearTimeout(id);
    console.error(`Fetch timeout/abort for ${url}`, err);
    return { ok: false, status: 0, error: err };
  }
}

/**
 * analyzeFood
 * - food: prompt de la comida
 * - user: opcional { peso, altura, edad, objetivo, ... }
 */
export async function analyzeFood(food: string, user?: Record<string, any>, timeoutMs = 15000): Promise<IAResult> {
  if (!food || !food.trim()) {
    return { ok: false, status: 400, error: "Campo 'food' vacío" };
  }

  const url = `${IA_URL}/analyze-food`; // Endpoint de tu backend de IA
  const body = { food, user };

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    },
    timeoutMs
  );

  if (!res.ok) {
    return { ok: false, status: res.status || 0, data: res.parsed ?? null, raw: res.raw ?? null, error: res.error };
  }
  // Devolvemos 'parsed' que puede ser el JSON o el string raw si el parseo falló
  return { ok: true, status: res.status, data: res.parsed };
}

/**
 * generateDiet
 * - profile: datos del usuario (peso, altura, edad, objetivo, preferencias, etc.)
 * - options: { prompt, fecha_inicio, fecha_fin, ... }
 * - timeoutMs: opcional (por defecto 60s porque puede demorar más)
 */
export async function generateDiet(
  profile: Record<string, any>,
  options: Record<string, any> = {},
  timeoutMs = 60000 // 60 segundos
): Promise<IAResult> {
  const url = `${IA_URL}/generate-diet`; // Endpoint de tu backend de IA
  const body = { profile, options };

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  }, timeoutMs);

  if (!res.ok) {
    return { ok: false, status: res.status || 0, data: res.parsed ?? null, raw: res.raw ?? null, error: res.error };
  }
  // Devolvemos 'parsed' que puede ser el JSON o el string raw si el parseo falló
  return { ok: true, status: res.status, data: res.parsed };
}
