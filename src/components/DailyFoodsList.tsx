// src/components/DailyFoodsList.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import AddFoodModal from "@/components/AddFoodModal";
import { useFood } from "@/hooks/useFood";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { ComidaUsuario } from "@/types";
import { Trash2, Edit2, RefreshCw, Plus } from "lucide-react";

/**
 * DailyFoodsList
 * - Muestra la lista de comidas por fecha (por defecto hoy)
 * - Permite agregar (AddFoodModal), eliminar y editar rápido
 * - Usa useFood hook para todas las operaciones
 */
const formatDateInput = (isoDate?: string) => {
  // input type="date" espera YYYY-MM-DD
  if (!isoDate) {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }
  return isoDate.slice(0, 10);
};

export default function DailyFoodsList() {
  const { usuario } = useAuth();
  const { toast } = useToast();
  const {
    getFoods,
    refresh,
    getCached,
    loadingByDate,
    addFood,
    deleteFood,
    updateFood,
  } = useFood();

  const [date, setDate] = useState<string>(() => formatDateInput());
  const [openAddModal, setOpenAddModal] = useState(false);
  const [foods, setFoods] = useState<ComidaUsuario[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<ComidaUsuario>>({});

  useEffect(() => {
    // cargar cache o fetch
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const cached = getCached(date);
        if (cached && cached.length > 0) {
          setFoods(cached);
          setLoading(false);
        }
        // always refresh to ensure fresh data
        const r = await refresh(date);
        if (mounted) {
          if (r.ok) setFoods(r.data);
          else {
            console.warn("No se pudieron cargar comidas:", r);
            toast({ title: "Error", description: "No se pudieron cargar las comidas", variant: "destructive" });
          }
        }
      } catch (err) {
        console.error("Error cargando comidas:", err);
        toast({ title: "Error", description: "Error al cargar comidas", variant: "destructive" });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, usuario?.id]);

  useEffect(() => {
    // si cache cambia, actualizamos la lista (simple sync)
    const cached = getCached(date);
    setFoods(cached);
  }, [getCached, date]);

  const handleAddClick = () => setOpenAddModal(true);

  const handleAfterSave = (newItem: ComidaUsuario) => {
    // refresh immediatamente
    (async () => {
      await refresh(date);
      toast({ title: "Guardado", description: "Comida agregada correctamente" });
      setOpenAddModal(false);
    })();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta comida?")) return;
    const r = await deleteFood(id);
    if (!r.ok) {
      console.error("deleteFood failed:", r);
      toast({ title: "Error", description: "No se pudo eliminar la comida", variant: "destructive" });
      return;
    }
    await refresh(date);
  };

  const startEdit = (item: ComidaUsuario) => {
    setEditingId(item.id);
    setEditValues({
      descripcion: item.descripcion,
      calorias: item.calorias ?? undefined,
      proteinas: item.proteinas ?? undefined,
      carbohidratos: item.carbohidratos ?? undefined,
      grasas: item.grasas ?? undefined,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (id: number) => {
    const payload: Partial<ComidaUsuario> = {};
    if (editValues.descripcion !== undefined) payload.descripcion = String(editValues.descripcion || "");
    if (editValues.calorias !== undefined) payload.calorias = Number(editValues.calorias || 0);
    if (editValues.proteinas !== undefined) payload.proteinas = Number(editValues.proteinas || 0);
    if (editValues.carbohidratos !== undefined) payload.carbohidratos = Number(editValues.carbohidratos || 0);
    if (editValues.grasas !== undefined) payload.grasas = Number(editValues.grasas || 0);

    const r = await updateFood(id, payload);
    if (!r.ok) {
      console.error("updateFood failed:", r);
      toast({ title: "Error", description: "No se pudo actualizar la comida", variant: "destructive" });
      return;
    }
    toast({ title: "Actualizado", description: "Comida actualizada correctamente" });
    setEditingId(null);
    setEditValues({});
    await refresh(date);
  };

  return (
    <Card className="max-w-3xl mx-auto mt-6">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Button variant="ghost" size="sm" onClick={async () => { setLoading(true); await refresh(date); setLoading(false); }}>
              <RefreshCw size={16} /> Refrescar
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleAddClick}>
              <Plus size={14} className="mr-2" /> Agregar comida
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-6">Cargando...</div>
          ) : foods && foods.length > 0 ? (
            foods.map((f) => (
              <div key={f.id} className="flex items-start justify-between gap-4 border rounded p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold truncate">{f.descripcion}</div>
                    <div className="text-sm text-muted-foreground">• {f.opcion ?? ""}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {f.fecha} • kcal: {f.calorias ?? "—"} • P: {f.proteinas ?? "—"}g • C: {f.carbohidratos ?? "—"}g • G: {f.grasas ?? "—"}g
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {editingId === f.id ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => saveEdit(f.id)}>
                        <Edit2 size={14} /> Guardar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancelar</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(f)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(f.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">No hay comidas para esta fecha.</div>
          )}
        </div>

        {/* Inline editor UI (simple) */}
        {editingId && (
          <div className="border-t pt-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Descripción</Label>
                <Input value={editValues.descripcion ?? ""} onChange={(e) => setEditValues(prev => ({ ...prev, descripcion: e.target.value }))} />
              </div>
              <div>
                <Label>Calorías</Label>
                <Input type="number" value={editValues.calorias ?? ""} onChange={(e) => setEditValues(prev => ({ ...prev, calorias: e.target.value === "" ? "" : Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Proteínas (g)</Label>
                <Input type="number" value={editValues.proteinas ?? ""} onChange={(e) => setEditValues(prev => ({ ...prev, proteinas: e.target.value === "" ? "" : Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Carbohidratos (g)</Label>
                <Input type="number" value={editValues.carbohidratos ?? ""} onChange={(e) => setEditValues(prev => ({ ...prev, carbohidratos: e.target.value === "" ? "" : Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Grasas (g)</Label>
                <Input type="number" value={editValues.grasas ?? ""} onChange={(e) => setEditValues(prev => ({ ...prev, grasas: e.target.value === "" ? "" : Number(e.target.value) }))} />
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* AddFoodModal (reutiliza tu modal) */}
      <AddFoodModal
        isOpen={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSaved={(item) => handleAfterSave(item)}
      />
    </Card>
  );
}
