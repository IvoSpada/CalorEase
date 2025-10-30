import { api } from "./api"; // Asumiendo que api.ts está en ./services/api.ts
import type { Dieta, ComidaDieta } from "../types";

/**
 * createDieta(payload)
 * payload: { usuario_id, fecha_inicio, fecha_fin?, origen?, estado? }
 */
export async function createDieta(payload: Partial<Dieta>) {
  return api.post<Dieta>("dietas", payload, true);
}

/**
 * getDietas(usuarioId?)
 */
export async function getDietas(usuarioId?: number) {
  const q = usuarioId ? `?usuario_id=${usuarioId}` : "";
  return api.get<Dieta[]>(`dietas${q}`, true);
}

/**
 * getDietaById(id)
 */
export async function getDietaById(id: number) {
  return api.get<Dieta>(`dietas/${id}`, true);
}

/**
 * createComidaDieta(payload)
 * payload: { dieta_id, fecha, tipo, descripcion, calorias, proteinas, carbohidratos, grasas }
 */
export async function createComidaDieta(payload: Partial<ComidaDieta>) {
  // El backend espera 'comidas-dieta' (basado en el controller)
  return api.post<ComidaDieta>("comidas-dieta", payload, true);
}

/**
 * getComidasDietaByDieta(dietaId)
 */
export async function getComidasDietaByDieta(dietaId: number) {
  const q = `?dieta_id=${dietaId}`;
  // El backend espera 'comidas-dieta' (basado en el controller)
  return api.get<ComidaDieta[]>(`comidas-dieta${q}`, true);
}