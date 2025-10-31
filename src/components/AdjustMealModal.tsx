import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"; // Ruta con @/
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Ruta con @/
import { analyzeFood } from "@/services/iaService"; // Ruta con @/
import type { ComidaDieta } from "@/types"; // Ruta con @/

interface AdjustMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  comidaPlanificada: ComidaDieta;
  profile: any;
  onComidaAlternativaGuardada: (comidaAlternativa: any) => Promise<void>;
}

export const AdjustMealModal = ({
  isOpen,
  onClose,
  comidaPlanificada,
  profile,
  onComidaAlternativaGuardada,
}: AdjustMealModalProps) => {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estado para el formulario editable
  const [preview, setPreview] = useState<any>(null);
  const [descEdit, setDescEdit] = useState("");
  const [calEdit, setCalEdit] = useState<number | "">("");
  const [protEdit, setProtEdit] = useState<number | "">("");
  const [carbEdit, setCarbEdit] = useState<number | "">("");
  const [grasEdit, setGrasEdit] = useState<number | "">("");

  // FIX: Resetea el estado cuando el modal se abre con una nueva comida
  useEffect(() => {
    if (isOpen) {
      setText("");
      setPreview(null);
      setDescEdit("");
      setCalEdit("");
      setProtEdit("");
      setCarbEdit("");
      setGrasEdit("");
    }
  }, [isOpen]);

  // Sincronizar campos editables con preview
  useEffect(() => {
    if (preview) {
      setDescEdit(preview.descripcion ?? "");
      setCalEdit(preview.calorias ?? "");
      setProtEdit(preview.proteinas ?? "");
      setCarbEdit(preview.carbohidratos ?? "");
      setGrasEdit(preview.grasas ?? "");
    }
  }, [preview]);

  const handleAnalyze = async () => {
    const foodText = text.trim();
    if (!foodText) {
      toast({ title: "Error", description: "Escribe una descripción", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setPreview(null);

    // Prompt mejorado para la IA
    const prompt = `Analiza nutricionalmente esta comida: "${foodText}". Devuelve ÚNICAMENTE un objeto JSON válido con las claves: "descripcion" (un nombre breve para la comida), "calorias" (número), "proteinas" (número), "carbohidratos" (número), y "grasas" (número).`;

    try {
      const r = await analyzeFood(prompt, profile);

      if (!r.ok || !r.data) {
        throw new Error(r.data?.error || "La IA no devolvió datos");
      }
      
      let dataString = r.data.data || r.data;
      if (typeof dataString !== 'string') {
        dataString = JSON.stringify(dataString);
      }

      // Regex para limpiar el JSON
      const jsonMatch = dataString.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("La IA no devolvió un JSON válido.");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      setPreview({
        descripcion: parsed.descripcion ?? foodText,
        calorias: parsed.calorias ?? 0,
        proteinas: parsed.proteinas ?? 0,
        carbohidratos: parsed.carbohidratos ?? 0,
        grasas: parsed.grasas ?? 0,
        tipo: comidaPlanificada.tipo, // Usamos el tipo (ej. Almuerzo) de la comida que reemplaza
      });
      toast({ title: "Análisis completado", description: "Puedes editar los valores." });
    } catch (err) {
      console.error("Error al analizar con IA:", err);
      toast({ title: "Error de IA", description: (err as Error).message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!preview) {
      toast({ title: "Error", description: "Debes analizar la comida primero", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const comidaAlternativa = {
        descripcion: descEdit || preview.descripcion,
        calorias: Number(calEdit) || preview.calorias,
        proteinas: Number(protEdit) || preview.proteinas,
        carbohidratos: Number(carbEdit) || preview.carbohidratos,
        grasas: Number(grasEdit) || preview.grasas,
        tipo: preview.tipo, 
      };
      await onComidaAlternativaGuardada(comidaAlternativa);
    } catch (err) {
      toast({ title: "Error al guardar", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- FIX DE CRASH ---
  // No renderizar nada si la comida planificada no está lista
  if (!comidaPlanificada) {
    return null;
  }
  // --- FIN DE FIX ---

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Comida Alternativa</DialogTitle>
          <DialogDescription>
            Estás reemplazando la comida: <span className="font-semibold">{comidaPlanificada.tipo} - {comidaPlanificada.descripcion}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ej: 2 milanesas con puré de papa..."
            className="h-24"
          />
          <Button onClick={handleAnalyze} disabled={analyzing} className="w-full">
            {analyzing ? <Loader2 className="animate-spin mr-2" /> : null}
            {analyzing ? "Analizando..." : "Analizar con IA"}
          </Button>

          {preview && (
            <div className="pt-4 space-y-3 border-t">
              <h4 className="font-semibold">Resultado (editable)</h4>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={descEdit} onChange={(e) => setDescEdit(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Calorías</Label>
                  <Input type="number" value={calEdit} onChange={(e) => setCalEdit(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div>
                  <Label>Proteínas (g)</Label>
                  <Input type="number" value={protEdit} onChange={(e) => setProtEdit(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div>
                  <Label>Carbohidratos (g)</Label>
                  <Input type="number" value={carbEdit} onChange={(e) => setCarbEdit(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div>
                  <Label>Grasas (g)</Label>
                  <Input type="number" value={grasEdit} onChange={(e) => setGrasEdit(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!preview || isSaving}>
            {isSaving ? <Loader2 className="animate-spin mr-2" /> : null}
            Guardar Comida Alternativa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

