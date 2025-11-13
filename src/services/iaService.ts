import type { Dieta, ComidaDieta, Profile } from "../types";

// Asumimos que la URL de la IA está en las variables de entorno de Vite
const IA_HOST = (import.meta.env.VITE_IA_HOST as string) ?? "127.0.0.1";
const IA_PORT = (import.meta.env.VITE_IA_PORT as string) ?? "5000";
const IA_URL = `http://${IA_HOST}:${IA_PORT}`.replace(/\/+$/, "");

console.log("Usando IA Host:", IA_URL);

// --- TIPOS ---

type IAResult<T = any> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data?: T | null; raw?: string | null; error?: any };

/**
 * Interfaz para el payload de imagen que espera el backend
 */
export interface ImagePayload {
  mimeType: string;
  data: string; // Base64 data (sin el prefijo "data:image/...")
}

// --- HELPER DE FETCH ---

/** Helper: fetch with timeout and safe parse */
async function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 30000 // 30 segundos por defecto
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
      // no JSON
      return { ok: res.ok, status: res.status, parsed: null, raw };
    }
  } catch (err) {
    clearTimeout(id);
    return { ok: false, status: 0, error: err };
  }
}

// --- FUNCIONES DE IA ---

/**
 * analyzeFood (Solo texto)
 * Analiza una sola comida
 */
export async function analyzeFood(food: string, user?: Record<string, any>, timeoutMs = 15000): Promise<IAResult> {
  // Esta función envía el 'food' (texto) al backend /analyze-food,
  // y el backend es quien construye el prompt.
  const url = `${IA_URL}/analyze-food`; 
  const body = { 
    food: food, // El modal envía el texto aquí
    user 
  }; 

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
  // Tu backend devuelve { ok: true, data: { ... } }
  return { ok: true, status: res.status, data: res.parsed };
}

/**
 * NUEVA: analyzeImage (Multimodal)
 * Analiza una imagen y un prompt de texto
 */
export async function analyzeImage(
  prompt: string, 
  image: ImagePayload, 
  user?: Record<string, any>,
  timeoutMs = 45000 // Más tiempo para subida/procesamiento de imagen
): Promise<IAResult> {
  
  // Esta función envía el prompt y la imagen al backend /analyze-image
  const url = `${IA_URL}/analyze-image`; 
  const body = { 
    prompt: prompt,
    image: image,
    user // El backend /analyze-image no espera 'user', pero no hace daño enviarlo
  }; 

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
    // Error from server { ok: false, error: "..." }
    return { ok: false, status: res.status || 0, data: res.parsed ?? null, raw: res.raw ?? null, error: res.error ?? res.parsed?.error };
  }

  // Éxito, el backend devuelve { ok: true, data: "texto de gemini" }
  // El modal parseará este 'data' (que es un string JSON)
  return { ok: true, status: res.status, data: res.parsed };
}


/**
 * generateDiet
 * (Sin cambios)
 */
export async function generateDiet(
  profile: Record<string, any>,
  options: Record<string, any> = {},
  timeoutMs = 60000 // 60s
): Promise<IAResult> {
  // ... (código existente sin cambios)
  const url = `${IA_URL}/generate-diet`;
  const body = { profile, options };

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  }, timeoutMs);

  if (!res.ok) {
    return { ok: false, status: res.status || 0, data: res.parsed ?? null, raw: res.raw ?? null, error: res.error };
  }
  return { ok: true, status: res.status, data: res.parsed };
}


/**
 * adjustDietWithIA
 * (Sin cambios)
 */
export async function adjustDietWithIA(
  comidaReal: { [key: string]: any },
  comidasRestantes: ComidaDieta[],
  profile: Profile,
  timeoutMs = 60000
): Promise<IAResult<ComidaDieta[]>> { 
  // ... (código existente sin cambios)
  console.log("--- LLAMANDO A IA PARA AJUSTAR DIETA (REAL) ---");
  const url = `${IA_URL}/adjust-diet`;
  const body = { 
    comidaReal, 
    comidasRestantes, 
    profile 
  };
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  }, timeoutMs);
  if (!res.ok) {
    console.error("Error en adjustDietWithIA (fetch):", res);
    return { ok: false, status: res.status || 0, data: res.parsed ?? null, raw: res.raw ?? null, error: res.error ?? res.parsed?.error };
  }
  console.log("✅ IA devolvió plan ajustado:", res.parsed);
  return { ok: true, status: res.status, data: res.parsed };
}