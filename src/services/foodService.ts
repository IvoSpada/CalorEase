import { api } from "./api"; // Usamos ruta relativa
import type { ComidaUsuario } from "../types"; // Asumiendo que types está en ../types

/**
 * createComidaUsuario(payload)
 * payload debe contener: usuario_id, fecha, descripcion, calorias, proteinas, carbohidratos, grasas, opcion?, comida_dieta_id?
 */
export async function createComidaUsuario(payload: Partial<ComidaUsuario>) {
  // FIX: El endpoint es "comidas-usuarios" (plural)
  return api.post<ComidaUsuario>("comidas-usuarios", payload, true);
}

/**
 * getComidasUsuario(usuarioId, fecha?)
 * fecha: "YYYY-MM-DD" (opcional)
 * retorna lista de comidas del usuario (filtradas por fecha si se pasa)
 */
export async function getComidasUsuario(usuarioId: number, fecha?: string) {
  const q = new URLSearchParams();
  if (usuarioId) q.set("usuario_id", String(usuarioId));
  if (fecha) q.set("fecha", fecha);
  // FIX: El endpoint es "comidas-usuarios" (plural)
  const endpoint = `comidas-usuarios?${q.toString()}`;
  return api.get<ComidaUsuario[]>(endpoint, true);
}

/**
 * getComidaById(id)
 */
export async function getComidaById(id: number) {
  return api.get<ComidaUsuario>(`comidas-usuarios/${id}`, true);
}

/**
 * updateComidaUsuario(id, payload)
 */
export async function updateComidaUsuario(id: number, payload: Partial<ComidaUsuario>) {
  return api.put<ComidaUsuario>(`comidas-usuarios/${id}`, payload, true);
}

/**
 * deleteComidaUsuario(id)
 */
export async function deleteComidaUsuario(id: number) {
  return api.del(`comidas-usuarios/${id}`, true);
}

