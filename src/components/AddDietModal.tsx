import { useEffect, useState } from "react";
// Corrección: Usar alias de ruta @/
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createDieta } from "@/services/dietService";
import { useAuth } from "@/hooks/useAuth";
import type { Dieta } from "@/types";

interface AddDietModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDietaCreada?: (dieta: Dieta) => void;
}

// Helper para obtener la fecha de hoy en formato YYYY-MM-DD
const getTodayDate = () => new Date().toISOString().split("T")[0];

export const AddDietModal = ({ isOpen, onClose, onDietaCreada }: AddDietModalProps) => {
  const { usuario } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fecha_inicio: getTodayDate(),
    fecha_fin: getTodayDate(),
    origen: "manual",
    estado: "activa",
  });

  // Resetear el form cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        fecha_inicio: getTodayDate(),
        fecha_fin: getTodayDate(),
        origen: "manual",
        estado: "activa",
      });
    }
  }, [isOpen]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!usuario) {
      toast({ title: "Error", description: "Debes iniciar sesión", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const payload: Partial<Dieta> = {
      usuario_id: usuario.id,
      ...formData,
    };

    try {
      const r = await createDieta(payload);

      if (!r.ok || !r.data) {
        const errorMsg = (r.data as any)?.errors
          ? Object.values((r.data as any).errors).flat().join(", ")
          : r.data?.message || "Error al crear la dieta";
        toast({ title: "Error", description: errorMsg, variant: "destructive" });
        return;
      }

      toast({ title: "Dieta Creada", description: "La nueva dieta ha sido guardada." });
      if (onDietaCreada) {
        onDietaCreada(r.data as Dieta);
      }
      onClose();
    } catch (err) {
      console.error("Error creando dieta:", err);
      toast({ title: "Error", description: "No se pudo conectar al servidor.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Crear Nueva Dieta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
              <Input
                id="fecha_inicio"
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => handleChange("fecha_inicio", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fecha_fin">Fecha de Fin</Label>
              <Input
                id="fecha_fin"
                type="date"
                value={formData.fecha_fin}
                onChange={(e) => handleChange("fecha_fin", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Origen</Label>
            <Select value={formData.origen} onValueChange={(v) => handleChange("origen", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="IA">Generada por IA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Estado</Label>
            <Select value={formData.estado} onValueChange={(v) => handleChange("estado", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="finalizada">Finalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="animate-spin" /> : "Guardar Dieta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddDietModal;

