import { useEffect, useState } from "react";
// Rutas de importación corregidas a relativas
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { analyzeFood } from "../services/iaService";
import {
  createComidaUsuario,
  getComidasPorFecha,
} from "../services/foodService";
import { getDietas, getComidasDietaByDieta } from "../services/dietService";
import { useAuth } from "../hooks/useAuth";
import type { ComidaUsuario, ComidaDieta, Dieta } from "../types";

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (comida: ComidaUsuario) => void;
}

export const AddFoodModal = ({ isOpen, onClose, onSaved }: AddFoodModalProps) => {
  const { usuario } = useAuth();
  const { toast } = useToast();

  // Formulario
  const [text, setText] = useState("");
  const [fechaLocal, setFechaLocal] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [opcion, setOpcion] = useState<string | undefined>("porcion");

  // Resultado IA / preview
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false); // FIX 2: Estado para habilitar guardado
  const [preview, setPreview] = useState<{
    descripcion: string;
    calorias?: number | null;
    proteinas?: number | null;
    carbohidratos?: number | null;
    grasas?: number | null;
  } | null>(null);

  // editable fields (inicializados desde preview)
  const [descEdit, setDescEdit] = useState("");
  const [calEdit, setCalEdit] = useState<number | "">("");
  const [protEdit, setProtEdit] = useState<number | "">("");
  const [carbEdit, setCarbEdit] = useState<number | "">("");
  const [grasEdit, setGrasEdit] = useState<number | "">("");

  // asociación con dieta
  const [dietas, setDietas] = useState<Dieta[] | null>(null);
  const [selectedDieta, setSelectedDieta] = useState<number | null>(null);
  const [comidasPlanificadas, setComidasPlanificadas] = useState<ComidaDieta[] | null>(null);
  const [selectedComidaPlanificada, setSelectedComidaPlanificada] = useState<number | null>(null);
  
  const [cantidad, setCantidad] = useState<number | "">(1);


  const [saving, setSaving] = useState(false);

  // Reset modal al cerrar
  useEffect(() => {
    if (!isOpen) {
      setText("");
      setPreview(null);
      setDescEdit("");
      setCalEdit("");
      setProtEdit("");
      setCarbEdit("");
      setGrasEdit("");
      setSelectedDieta(null);
      setComidasPlanificadas(null);
      setSelectedComidaPlanificada(null);
      setCantidad(1);
      setHasAnalyzed(false); // Resetear estado de análisis
    }
  }, [isOpen]);

  // Cargar dietas al abrir modal
  useEffect(() => {
    if (!isOpen || !usuario) return;

    (async () => {
      try {
        const r = await getDietas(usuario.id);
        if (r.ok && r.data) {
          setDietas(r.data as Dieta[]);
          const activa = (r.data as Dieta[]).find(d => d.estado === "activa");
          if (activa) {
            setSelectedDieta(activa.id);
            const rc = await getComidasDietaByDieta(activa.id);
            if (rc.ok && rc.data) setComidasPlanificadas(rc.data as ComidaDieta[]);
          }
        }
      } catch (err) {
        console.error("Error obteniendo dietas:", err);
      }
    })();
  }, [isOpen, usuario]);

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

  // Analizar comida con IA
  const handleAnalyze = async () => {
    const foodText = text.trim();
    if (!foodText) {
      toast({ title: "Error", description: "Escribe una descripción para analizar", variant: "destructive" });
      return;
    }

    setAnalyzing(true);
    setPreview(null);
    setHasAnalyzed(false); // Resetea en cada nuevo análisis

    try {
      // FIX 1: Prompt mejorado pidiendo JSON
      const prompt = `Analiza la siguiente comida: "${foodText}". Devuelve SOLAMENTE un objeto JSON válido (sin texto extra antes o después) con los siguientes campos: "descripcion" (un nombre breve para la comida, ej: "Milanesa con papas"), "calorias", "proteinas", "carbohidratos", y "grasas". Si no puedes estimar un valor nutricional, usa null.`;
      
      const r = await analyzeFood(prompt, usuario ? {
        peso: usuario.peso,
        altura: usuario.altura,
        edad: usuario.edad,
        objetivo: usuario.objetivo,
      } : undefined);

      console.log("▶️ /analyze-food payload enviado:", { food: prompt });
      console.log("▶️ /analyze-food respuesta:", r);

      if (!r.ok || !r.data) {
        toast({
          title: "Error IA",
          description: r.data?.error || r.error?.message || `Status ${r.status}`,
          variant: "destructive",
        });
        return;
      }

      // FIX 1: Lógica de parseo robusta para JSON "sucio"
      let dataToParse: any = r.data;
      
      // Si r.data es {ok: true, data: '...'}
      if (dataToParse.data && typeof dataToParse.data === 'string') {
        dataToParse = dataToParse.data;
      }
      
      // Si dataToParse es un string (que contiene el JSON)
      if (typeof dataToParse === 'string') {
        // Regex para extraer el JSON (busca el primer { hasta el último })
        const jsonMatch = dataToParse.match(/\{[\s\S]*\}/);

        if (jsonMatch && jsonMatch[0]) {
          try {
            const parsedJson = JSON.parse(jsonMatch[0]);
            
            setPreview({
              descripcion: parsedJson.descripcion ?? foodText, // Fallback al texto original
              calorias: Number.isFinite(Number(parsedJson.calorias)) ? Number(parsedJson.calorias) : null,
              proteinas: Number.isFinite(Number(parsedJson.proteinas)) ? Number(parsedJson.proteinas) : null,
              carbohidratos: Number.isFinite(Number(parsedJson.carbohidratos)) ? Number(parsedJson.carbohidratos) : null,
              grasas: Number.isFinite(Number(parsedJson.grasas)) ? Number(parsedJson.grasas) : null,
            });
            setHasAnalyzed(true); // Éxito
            
          } catch (e) {
            console.error("Error al parsear JSON extraído:", e);
            toast({ title: "Respuesta IA no reconocida", description: "No se pudo extraer datos JSON de la IA. La respuesta fue: " + dataToParse, variant: "destructive", duration: 7000 });
          }
        } else {
          toast({ title: "Respuesta IA no reconocida", description: "No se encontró JSON en la respuesta de la IA.", variant: "destructive" });
        }
      } else if (typeof dataToParse === 'object' && dataToParse !== null) {
          // Caso ideal: La IA devolvió un objeto JSON limpio
           setPreview({
              descripcion: dataToParse.descripcion ?? foodText,
              calorias: Number.isFinite(Number(dataToParse.calorias)) ? Number(dataToParse.calorias) : null,
              proteinas: Number.isFinite(Number(dataToParse.proteinas)) ? Number(dataToParse.proteinas) : null,
              carbohidratos: Number.isFinite(Number(dataToParse.carbohidratos)) ? Number(dataToParse.carbohidratos) : null,
              grasas: Number.isFinite(Number(dataToParse.grasas)) ? Number(dataToParse.grasas) : null,
            });
           setHasAnalyzed(true); // Éxito
      } else {
           toast({ title: "Respuesta IA no reconocida", description: "La respuesta de la IA no fue un string o un objeto.", variant: "destructive" });
      }
      
    } catch (err) {
      console.error("Error al analizar con IA:", err);
      toast({ title: "Error", description: "Fallo al conectar con el servicio de IA", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDatetimeLocalToSQL = (local: string) => local ? local.replace("T", " ") + ":00" : null;

  // Guardar comida
  const handleSave = async () => {
    if (!usuario) {
      toast({ title: "Error", description: "Debes iniciar sesión para guardar comidas", variant: "destructive" });
      return;
    }
    
    // FIX 3: Lógica de validación para el backend
    // El backend REQUIERE 'comida_dieta_id'.
    if (!selectedComidaPlanificada) {
        toast({ 
          title: "Error de Lógica", 
          description: "Tu backend (ComidaUsuarioController) requiere vincular esta comida a una 'Comida de Dieta' planificada. Por favor, selecciona una de la lista.", 
          variant: "destructive",
          duration: 7000
        });
        return;
    }

    const payload: any = {
      usuario_id: usuario.id,
      fecha_consumo: formatDatetimeLocalToSQL(fechaLocal) || new Date().toISOString().slice(0, 19).replace("T", " "),
      cantidad: Number(cantidad) || 1,
      comida_dieta_id: selectedComidaPlanificada, // Ahora sabemos que existe
    };

    setSaving(true);
    try {
      const r = await createComidaUsuario(payload);
      
      if (!r.ok) {
        const errMsg =
          r.data?.message ||
          (r.data && (r.data as any).errors ? Object.values((r.data as any).errors).flat().join(", ") : null) ||
          r.error ||
          `Status ${r.status}`;
        toast({ title: "Error al guardar", description: String(errMsg), variant: "destructive" });
        return;
      }

      toast({ title: "Comida guardada", description: "Se registró la comida correctamente" });
      if (onSaved && r.data) onSaved(r.data as ComidaUsuario);
      setText("");
      setPreview(null);
      onClose();
    } catch (err) {
      console.error("Exception guardando comida:", err);
      toast({ title: "Error", description: "No se pudo guardar la comida", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Agregar comida</DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label>Descripción (texto libre)</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ej: 1 taza de arroz con 120g de pollo y verduras"
                className="h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha y hora</Label>
                <Input
                  type="datetime-local"
                  value={fechaLocal}
                  onChange={(e) => setFechaLocal(e.target.value)}
                />
              </div>

              <div>
                <Label>Opción</Label>
                <select
                  value={opcion}
                  onChange={(e) => setOpcion(e.target.value)}
                  className="w-full h-10 rounded-md border px-3"
                >
                  <option value="porcion">Porción</option>
                  <option value="unidad">Unidad</option>
                  {/* FIX: Corregida la sintaxis del 'option' */}
                  <option value="gramos">Gramos</option>
                </select>
              </div>
            </div>

            {comidasPlanificadas && comidasPlanificadas.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Vincular a comida planificada (Requerido)</Label>
                  <select
                    value={selectedComidaPlanificada ?? ""}
                    onChange={(e) => setSelectedComidaPlanificada(e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-10 rounded-md border px-3"
                  >
                    <option value="">-- Selecciona una comida --</option>
                    {comidasPlanificadas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fecha} • {c.tipo} • {c.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
                 <div>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value === "" ? "" : Number(e.target.value))}
                    min={1}
                  />
                </div>
              </div>
            ) : (
             // Mostrar si no hay comidas planificadas
              <div>
                <p className="text-sm text-destructive font-medium">
                  No hay comidas planificadas para vincular.
                </p>
                <p className="text-sm text-muted-foreground">
                  Primero debes crear una dieta y sus comidas para poder registrar el consumo.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? <><Loader2 className="animate-spin mr-2" size={16} /> Analizando...</> : "Analizar con IA"}
              </Button>

              {/* FIX 2: Botón deshabilitado si no se ha analizado o no hay comida seleccionada */}
              <Button 
                variant="secondary" 
                onClick={handleSave} 
                disabled={saving || !hasAnalyzed || !selectedComidaPlanificada}
                title={!hasAnalyzed ? "Debes analizar la comida con IA antes de guardar" : !selectedComidaPlanificada ? "Debes seleccionar una comida planificada para vincular" : "Guardar comida"}
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : "Guardar comida"}
              </Button>

              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            </div>

            {preview && (
              <div className="pt-2">
                <h4 className="font-semibold">Preview (editable)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label>Descripción</Label>
                    <Input value={descEdit} onChange={(e) => setDescEdit(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Calorías</Label>
                      <Input type="number" value={calEdit === "" ? "" : String(calEdit)} onChange={(e) => setCalEdit(e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>Proteínas (g)</Label>
                      <Input type="number" value={protEdit === "" ? "" : String(protEdit)} onChange={(e) => setProtEdit(e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>Carbohidratos (g)</Label>
                      <Input type="number" value={carbEdit === "" ? "" : String(carbEdit)} onChange={(e) => setCarbEdit(e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>Grasas (g)</Label>
                      <Input type="number" value={grasEdit === "" ? "" : String(grasEdit)} onChange={(e) => setGrasEdit(e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default AddFoodModal;