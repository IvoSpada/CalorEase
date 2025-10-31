import type { Dieta, ComidaDieta, Profile } from "../types"; // Asumo que Profile también viene de types

// Asumimos que la URL de la IA está en las variables de entorno de Vite
const IA_HOST = (import.meta.env.VITE_IA_HOST as string) ?? "127.0.0.1";
const IA_PORT = (import.meta.env.VITE_IA_PORT as string) ?? "5000";
const IA_URL = `http://${IA_HOST}:${IA_PORT}`.replace(/\/+$/, "");

console.log("Usando IA Host:", IA_URL);

type IAResult<T = any> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data?: T | null; raw?: string | null; error?: any };

/** Helper: fetch with timeout and safe parse */
async function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 30000 // 30 segundos por defecto para IA
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

/**
 * analyzeFood
 * Analiza una sola comida
 */
export async function analyzeFood(food: string, user?: Record<string, any>, timeoutMs = 15000): Promise<IAResult> {
  // Nota: El prompt ahora se genera en el backend,
  // pero tu backend actual (/analyze-food) espera un prompt.
  // Lo he ajustado para que coincida con tu backend actual.
  // const prompt = `Analiza esta comida: ${food}`;
  
  const url = `${IA_URL}/analyze-food`; 
  const body = { 
    food: food, // Tu backend espera 'food', no 'prompt'
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
  // Así que devolvemos res.parsed directamente, que ya tiene esa forma.
  return { ok: true, status: res.status, data: res.parsed };
}


/**
 * generateDiet
 * Genera un plan de dieta completo
 */
export async function generateDiet(
  profile: Record<string, any>,
  options: Record<string, any> = {},
  timeoutMs = 60000 // 60s
): Promise<IAResult> {
  const url = `${IA_URL}/generate-diet`;
  const body = { profile, options };

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  }, timeoutMs);

  if (!res.ok) {
    return { ok: false, status: res.status || 0, data: res.parsed ?? null, raw: res.raw ?? null, error: res.error };  }
  return { ok: true, status: res.status, data: res.parsed };
}


/**
 * adjustDietWithIA (Función IMPLEMENTADA)
 * Recibe la comida real y el resto de la dieta, y devuelve un nuevo plan.
 */
export async function adjustDietWithIA(
  comidaReal: { [key: string]: any },
  comidasRestantes: ComidaDieta[],
  profile: Profile, // Usando el tipo Profile
  timeoutMs = 60000 // 60s, es una llamada compleja
): Promise<IAResult<ComidaDieta[]>> { 
  
  console.log("--- LLAMANDO A IA PARA AJUSTAR DIETA (REAL) ---");
  console.log("Comida real:", comidaReal);
  console.log("Comidas restantes a ajustar:", comidasRestantes.length);
  console.log("Perfil:", profile);

  // 1. Definir el URL y el Body
  const url = `${IA_URL}/adjust-diet`;
  const body = { 
    comidaReal, 
    comidasRestantes, 
    profile 
  };

  // 2. Llamar usando tu helper
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  }, timeoutMs);

  // 3. Manejar la respuesta (igual que en generateDiet)
  if (!res.ok) {
    console.error("Error en adjustDietWithIA (fetch):", res);
    // El error puede venir de 'res.error' (network) o 'res.parsed.error' (servidor)
    // ¡ERROR CORREGIDO AQUÍ! Se eliminó la 's'
    return { ok: false, status: res.status || 0, data: res.parsed ?? null, raw: res.raw ?? null, error: res.error ?? res.parsed?.error };
  }
  
  // ¡Éxito! res.parsed debería ser el array de ComidaDieta[]
  console.log("✅ IA devolvió plan ajustado:", res.parsed);
  return { ok: true, status: res.status, data: res.parsed };
}