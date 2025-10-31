import { api } from "./api"; // Usamos ruta relativa
import type { Dieta, ComidaDieta } from "../types"; // Asumiendo que types está en ../types

/**
 * createDieta(payload)
 * payload: { usuario_id, fecha_inicio, fecha_fin?, origen?, estado? }
 */
export async function createDieta(payload: Partial<Dieta>) {
  // Endpoint "dietas" (plural)
  return api.post<Dieta>("dietas", payload, true);
}

/**
 * getDietas(usuarioId?)
 * Filtra por usuario_id si se provee
 */
export async function getDietas(usuarioId?: number) {
  const q = usuarioId ? `?usuario_id=${usuarioId}` : "";
  // Endpoint "dietas" (plural)
  return api.get<Dieta[]>(`dietas${q}`, true);
}

/**
 * getDietaById(id)
 */
export async function getDietaById(id: number) {
  return api.get<Dieta>(`dietas/${id}`, true);
}

/**
* updateDieta(id, payload)
*/
export async function updateDieta(id: number, payload: Partial<Dieta>) {
  return api.put<Dieta>(`dietas/${id}`, payload, true);
}


/**
 * createComidaDieta(payload)
 * payload: { dieta_id, fecha, tipo, descripcion, calorias, proteinas, carbohidratos, grasas }
s*/
export async function createComidaDieta(payload: Partial<ComidaDieta>) {
  // FIX: El endpoint es "comidas-dietas" (plural)
  return api.post<ComidaDieta>("comidas-dietas", payload, true);
}

/**
 * getComidasDietaByDieta(dietaId)
 * Filtra por dieta_id
 */
export async function getComidasDietaByDieta(dietaId: number) {
  const q = `?dieta_id=${dietaId}`;
  // FIX: El endpoint es "comidas-dietas" (plural)
  return api.get<ComidaDieta[]>(`comidas-dietas${q}`, true);
}

// --- NUEVA FUNCIÓN AÑADIDA ---

/**
* updateComidaDieta(id, payload)
* Actualiza una comida específica de la dieta
*/
export async function updateComidaDieta(id: number, payload: Partial<ComidaDieta>) {
  // El endpoint es "comidas-dietas/{id}" (singular/id)
  return api.put<ComidaDieta>(`comidas-dietas/${id}`, payload, true);
}