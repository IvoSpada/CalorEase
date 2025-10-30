// src/hooks/useFood.ts
import { useCallback, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  createComidaUsuario,
  getComidasPorFecha,
  updateComidaUsuario,
  deleteComidaUsuario,
} from "@/services/foodService";
import type { ComidaUsuario } from "@/types";

type Result<T = any> =
  | { ok: true; data: T }
  | { ok: false; error?: any; status?: number };

export function useFood() {
  const { usuario } = useAuth();
  const { toast } = useToast();

  const [foodsByDate, setFoodsByDate] = useState<Record<string, ComidaUsuario[]>>({});
  const [loadingByDate, setLoadingByDate] = useState<Record<string, boolean>>({});
  const [errorByDate, setErrorByDate] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const fetchCounter = useRef<Record<string, number>>({});

  const formatDateKey = (date?: string) => {
    if (!date) return new Date().toISOString().slice(0, 10);
    return date.slice(0, 10);
  };

  // -----------------------------
  // REFRESH: traer comidas del servidor
  // -----------------------------
  const refresh = useCallback(
    async (date?: string): Promise<Result<ComidaUsuario[]>> => {
      if (!usuario) return { ok: false, error: "Usuario no autenticado" };
      const dateKey = formatDateKey(date);

      fetchCounter.current[dateKey] = (fetchCounter.current[dateKey] || 0) + 1;
      const myFetchId = fetchCounter.current[dateKey];

      setLoadingByDate((prev) => ({ ...prev, [dateKey]: true }));
      setErrorByDate((prev) => ({ ...prev, [dateKey]: null }));

      try {
        const r = await getComidasPorFecha(usuario.id, dateKey);
        if (!r.ok) {
          setErrorByDate((prev) => ({ ...prev, [dateKey]: r }));
          setLoadingByDate((prev) => ({ ...prev, [dateKey]: false }));
          return { ok: false, error: r.error ?? r.data, status: r.status };
        }

        if (fetchCounter.current[dateKey] !== myFetchId) return { ok: true, data: r.data ?? [] };

        setFoodsByDate((prev) => ({ ...prev, [dateKey]: (r.data as ComidaUsuario[]) ?? [] }));
        setLoadingByDate((prev) => ({ ...prev, [dateKey]: false }));
        return { ok: true, data: (r.data as ComidaUsuario[]) ?? [] };
      } catch (err) {
        setErrorByDate((prev) => ({ ...prev, [dateKey]: err }));
        setLoadingByDate((prev) => ({ ...prev, [dateKey]: false }));
        return { ok: false, error: err };
      }
    },
    [usuario]
  );

  // -----------------------------
  // GET FOODS: usa cache o refresh
  // -----------------------------
  const getFoods = useCallback(
    async (date?: string): Promise<Result<ComidaUsuario[]>> => {
      if (!usuario) return { ok: false, error: "Usuario no autenticado" };
      const dateKey = formatDateKey(date);
      if (foodsByDate[dateKey]) return { ok: true, data: foodsByDate[dateKey] };
      return await refresh(dateKey);
    },
    [usuario, foodsByDate, refresh]
  );

  // -----------------------------
  // ADD FOOD
  // -----------------------------
  const addFood = useCallback(
    async (payload: Partial<ComidaUsuario>): Promise<Result<ComidaUsuario>> => {
      if (!usuario) return { ok: false, error: "Usuario no autenticado" };
      setSaving(true);
      const dateKey = formatDateKey(payload.fecha);

      const tempId = Date.now() * -1;
      const optimistic: ComidaUsuario = {
        id: tempId,
        usuario_id: usuario.id,
        comida_dieta_id: payload.comida_dieta_id ?? null,
        fecha: payload.fecha ?? new Date().toISOString().slice(0, 19).replace("T", " "),
        opcion: payload.opcion ?? "porcion",
        descripcion: payload.descripcion ?? "",
        calorias: payload.calorias ?? null,
        proteinas: payload.proteinas ?? null,
        carbohidratos: payload.carbohidratos ?? null,
        grasas: payload.grasas ?? null,
      };

      setFoodsByDate((prev) => {
        const prevList = prev[dateKey] ?? [];
        return { ...prev, [dateKey]: [optimistic, ...prevList] };
      });

      try {
        const r = await createComidaUsuario({ ...payload, usuario_id: usuario.id });
        if (!r.ok) {
          setFoodsByDate((prev) => {
            const prevList = prev[dateKey] ?? [];
            return { ...prev, [dateKey]: prevList.filter((f) => f.id !== tempId) };
          });
          toast({ title: "Error", description: "No se pudo guardar la comida", variant: "destructive" });
          return { ok: false, error: r.error ?? r.data, status: r.status };
        }

        const serverItem = r.data as ComidaUsuario;
        setFoodsByDate((prev) => {
          const prevList = prev[dateKey] ?? [];
          return { ...prev, [dateKey]: prevList.map((f) => (f.id === tempId ? serverItem : f)) };
        });

        toast({ title: "Comida guardada", description: "Se registró la comida correctamente" });
        return { ok: true, data: serverItem };
      } catch (err) {
        setFoodsByDate((prev) => {
          const prevList = prev[dateKey] ?? [];
          return { ...prev, [dateKey]: prevList.filter((f) => f.id !== tempId) };
        });
        toast({ title: "Error", description: "No se pudo guardar la comida", variant: "destructive" });
        return { ok: false, error: err };
      } finally {
        setSaving(false);
      }
    },
    [usuario, toast]
  );

  // -----------------------------
  // UPDATE FOOD
  // -----------------------------
  const updateFood = useCallback(
    async (id: number, payload: Partial<ComidaUsuario>): Promise<Result<ComidaUsuario>> => {
      if (!usuario) return { ok: false, error: "Usuario no autenticado" };
      setSaving(true);

      const dateKey = Object.keys(foodsByDate).find((key) => (foodsByDate[key] ?? []).some((f) => f.id === id));
      const keyToUse = dateKey ?? formatDateKey(payload.fecha);

      const snapshot = foodsByDate[keyToUse] ?? [];
      setFoodsByDate((prev) => ({
        ...prev,
        [keyToUse]: (prev[keyToUse] ?? []).map((f) => (f.id === id ? { ...f, ...payload } : f)),
      }));

      try {
        if (id < 0) {
          const r = await createComidaUsuario({ ...payload, usuario_id: usuario.id });
          if (!r.ok) {
            setFoodsByDate((prev) => ({ ...prev, [keyToUse]: snapshot }));
            toast({ title: "Error", description: "No se pudo guardar la comida", variant: "destructive" });
            return { ok: false, error: r.error ?? r.data, status: r.status };
          }
          const serverItem = r.data as ComidaUsuario;
          setFoodsByDate((prev) => ({
            ...prev,
            [keyToUse]: (prev[keyToUse] ?? []).map((f) => (f.id === id ? serverItem : f)),
          }));
          return { ok: true, data: serverItem };
        } else {
          const r = await updateComidaUsuario(id, payload);
          if (!r.ok) {
            setFoodsByDate((prev) => ({ ...prev, [keyToUse]: snapshot }));
            toast({ title: "Error", description: "No se pudo actualizar la comida", variant: "destructive" });
            return { ok: false, error: r.error ?? r.data, status: r.status };
          }
          const serverItem = r.data as ComidaUsuario;
          setFoodsByDate((prev) => ({
            ...prev,
            [keyToUse]: (prev[keyToUse] ?? []).map((f) => (f.id === id ? serverItem : f)),
          }));
          toast({ title: "Actualizado", description: "Comida actualizada correctamente" });
          return { ok: true, data: serverItem };
        }
      } catch (err) {
        setFoodsByDate((prev) => ({ ...prev, [keyToUse]: snapshot }));
        toast({ title: "Error", description: "No se pudo actualizar la comida", variant: "destructive" });
        return { ok: false, error: err };
      } finally {
        setSaving(false);
      }
    },
    [usuario, foodsByDate, toast]
  );

  // -----------------------------
  // DELETE FOOD
  // -----------------------------
  const deleteFood = useCallback(
    async (id: number): Promise<Result<null>> => {
      if (!usuario) return { ok: false, error: "Usuario no autenticado" };
      setSaving(true);

      const dateKey = Object.keys(foodsByDate).find((key) => (foodsByDate[key] ?? []).some((f) => f.id === id));
      const keyToUse = dateKey ?? formatDateKey();
      const snapshot = foodsByDate[keyToUse] ?? [];

      setFoodsByDate((prev) => ({ ...prev, [keyToUse]: (prev[keyToUse] ?? []).filter((f) => f.id !== id) }));

      try {
        if (id < 0) {
          toast({ title: "Eliminado", description: "Entrada local eliminada" });
          return { ok: true, data: null };
        }
        const r = await deleteComidaUsuario(id);
        if (!r.ok) {
          setFoodsByDate((prev) => ({ ...prev, [keyToUse]: snapshot }));
          toast({ title: "Error", description: "No se pudo eliminar la comida", variant: "destructive" });
          return { ok: false, error: r.error ?? r.data, status: r.status };
        }
        toast({ title: "Eliminado", description: "Comida eliminada correctamente" });
        return { ok: true, data: null };
      } catch (err) {
        setFoodsByDate((prev) => ({ ...prev, [keyToUse]: snapshot }));
        toast({ title: "Error", description: "No se pudo eliminar la comida", variant: "destructive" });
        return { ok: false, error: err };
      } finally {
        setSaving(false);
      }
    },
    [usuario, foodsByDate, toast]
  );

  const getCached = useCallback((date?: string) => {
    const key = formatDateKey(date);
    return foodsByDate[key] ?? [];
  }, [foodsByDate]);

  return {
    foodsByDate,
    getCached,
    getFoods,
    refresh,
    loadingByDate,
    errorByDate,
    saving,
    addFood,
    updateFood,
    deleteFood,
  };
}