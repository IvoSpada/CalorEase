// src/types/index.ts
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  peso?: number;
  altura?: number;
  edad?: number;
  objetivo?: "perder_peso" | "mantener" | "ganar_peso";
  // otros campos si los tenés
}

export interface Dieta {
  id: number;
  usuario_id: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  origen?: string;
  estado?: string;
}

export interface ComidaDieta {
  id: number;
  dieta_id: number;
  fecha: string;
  tipo: string;
  descripcion: string;
  calorias?: number;
  proteinas?: number;
  carbohidratos?: number;
  grasas?: number;
}

export interface ComidaUsuario {
  id: number;
  usuario_id: number;
  comida_dieta_id?: number | null;
  fecha: string;
  opcion?: string;
  descripcion?: string;
  calorias?: number;
  proteinas?: number;
  carbohidratos?: number;
  grasas?: number;
}

export interface AuthResponse {
  usuario: Usuario;
  token: string;
}
