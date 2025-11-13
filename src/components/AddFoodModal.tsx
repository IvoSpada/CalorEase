import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { Loader2, Image as ImageIcon, X } from "lucide-react"; // Importar iconos
import { useToast } from "../hooks/use-toast";
import { analyzeFood, analyzeImage, ImagePayload } from "../services/iaService"; // Importar ambas funciones
import { createComidaUsuario } from "../services/foodService";
import { createComidaDieta } from "../services/dietService";
import { useAuth } from "../hooks/useAuth";
import type { ComidaUsuario, Dieta } from "../types";

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (comida: ComidaUsuario) => void;
  activeDiet: Dieta | null;
}

/**
 * Helper para obtener solo la fecha YYYY-MM-DD de un string datetime-local
 */
const getDateStringFromLocal = (local: string): string => {
  if (!local) return new Date().toISOString().split('T')[0];
  return local.split('T')[0];
}

/**
 * Helper para convertir un archivo a Base64 para la API
 */
const fileToBase64 = (file: File): Promise<ImagePayload> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      const parts = base64String.split(',');
      const meta = parts[0];
      const data = parts[1];
      const mimeType = meta.split(';')[0].split(':')[1];
      resolve({ mimeType, data });
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Helper mejorado para extraer y parsear la respuesta de Gemini
 * (Sin cambios, tu función es robusta y manejará ambas respuestas)
 */
const parseGeminiResponse = (data: any): any | null => {
  console.log("🔍 Parseando respuesta Gemini:", data);
  
  // Si viene directo como objeto con los campos
  if (data && typeof data === 'object' && 'descripcion' in data) {
    console.log("✅ Respuesta directa como objeto");
    return data;
  }
  
  // Si viene envuelto en .data (que puede ser objeto o string)
  if (data?.data) {
    if (typeof data.data === 'string') {
      // Caso /analyze-image: data.data es un string JSON
      console.log("🔍 Procesando .data (string)");
      return parseGeminiResponse(data.data); // Recursión con el string
    }
    if (typeof data.data === 'object') {
      // Caso /analyze-food: data.data es un objeto
      console.log("🔍 Procesando .data (object)");
      return parseGeminiResponse(data.data); // Recursión con el objeto
    }
  }
  
  // Si es un string, intentar extraer JSON
  if (typeof data === 'string') {
    console.log("🔍 Intentando extraer JSON de string:", data.substring(0, 100));
    let cleaned = data.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
      console.log("🔍 JSON extraído:", jsonStr);
      try {
        const parsed = JSON.parse(jsonStr);
        console.log("✅ JSON parseado exitosamente:", parsed);
        return parsed;
      } catch (e) {
        console.error("❌ Error parseando JSON:", e);
        return null;
      }
    }
  }
  
  console.log("❌ No se pudo parsear la respuesta");
  return null;
};

export const AddFoodModal = ({ isOpen, onClose, onSaved, activeDiet }: AddFoodModalProps) => {
  const { usuario } = useAuth();
  const { toast } = useToast();

  // Formulario
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null); // NUEVO: Estado para el archivo
  const [imagePreview, setImagePreview] = useState<string | null>(null); // NUEVO: Estado para la preview
  const [fechaLocal, setFechaLocal] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [tipoComida, setTipoComida] = useState<string>("snack");

  // Resultado IA
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Campos editables
  const [descEdit, setDescEdit] = useState("");
  const [calEdit, setCalEdit] = useState<number | "">("");
  const [protEdit, setProtEdit] = useState<number | "">("");
  const [carbEdit, setCarbEdit] = useState<number | "">("");
  const [grasEdit, setGrasEdit] = useState<number | "">("");
  
  const [saving, setSaving] = useState(false);

  // NUEVO: Handler para el cambio de archivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // NUEVO: Handler para quitar la imagen
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Resetear el valor del input para poder subir la misma imagen de nuevo
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // Reset modal al cerrar
  useEffect(() => {
    if (!isOpen) {
      setText("");
      setDescEdit("");
      setCalEdit("");
      setProtEdit("");
      setCarbEdit("");
      setGrasEdit("");
      setHasAnalyzed(false);
      setTipoComida("snack");
      setImageFile(null); // NUEVO: Reset imagen
      setImagePreview(null); // NUEVO: Reset imagen
    }
  }, [isOpen]);

  // Analizar comida con IA (LÓGICA ACTUALIZADA)
  const handleAnalyze = async () => {
    const foodText = text.trim();
    
    // Validar que haya al menos texto o imagen
    if (!foodText && !imageFile) {
      toast({ 
        title: "Error", 
        description: "Escribe una descripción o sube una imagen para analizar", 
        variant: "destructive" 
      });
      return;
    }

    setAnalyzing(true);
    setHasAnalyzed(false);

    try {
      let r: any; // Declarar 'r' para la respuesta
      const userProfile = usuario ? {
        peso: usuario.peso,
        altura: usuario.altura,
        edad: usuario.edad,
        objetivo: usuario.objetivo,
      } : undefined;

      if (imageFile) {
        // --- CASO 1: Hay imagen (usar analyzeImage) ---
        
        // El backend /analyze-image espera un prompt completo
        const prompt = `Analiza la comida en la imagen, usando esta descripción si ayuda: "${foodText || 'Comida en imagen'}". Devuelve SOLAMENTE un objeto JSON válido (sin texto extra antes o después) con los siguientes campos: "descripcion" (un nombre breve para la comida), "calorias", "proteinas", "carbohidratos", y "grasas". Si no puedes estimar un valor nutricional, usa null.`;
        
        const imagePayload = await fileToBase64(imageFile);
        
        r = await analyzeImage(prompt, imagePayload, userProfile);

      } else {
        // --- CASO 2: Solo texto (usar analyzeFood) ---
        
        // El backend /analyze-food construye su propio prompt.
        // Solo pasamos el texto de la comida.
        r = await analyzeFood(foodText, userProfile);
      }

      console.log("📦 Respuesta completa de la IA:", r);

      if (!r.ok || !r.data) {
        toast({
          title: "Error IA",
          description: r.data?.error || r.error?.message || `Status ${r.status}`,
          variant: "destructive",
        });
        return;
      }

      // Usar la función de parsing mejorada (funciona para ambos casos)
      const parsedData = parseGeminiResponse(r.data);
      
      if (!parsedData) {
        toast({ 
          title: "Respuesta IA no reconocida", 
          description: "No se pudo extraer datos válidos de la respuesta de Gemini.", 
          variant: "destructive" 
        });
        return;
      }

      // Asignar valores (lógica idéntica a la anterior)
      setDescEdit(parsedData.descripcion ?? foodText);
      
      const calorias = parsedData.calorias;
      const proteinas = parsedData.proteinas;
      const carbohidratos = parsedData.carbohidratos;
      const grasas = parsedData.grasas;
      
      setCalEdit(calorias !== null && calorias !== undefined && !isNaN(Number(calorias)) ? Number(calorias) : "");
      setProtEdit(proteinas !== null && proteinas !== undefined && !isNaN(Number(proteinas)) ? Number(proteinas) : "");
      setCarbEdit(carbohidratos !== null && carbohidratos !== undefined && !isNaN(Number(carbohidratos)) ? Number(carbohidratos) : "");
      setGrasEdit(grasas !== null && grasas !== undefined && !isNaN(Number(grasas)) ? Number(grasas) : "");
      
      setHasAnalyzed(true);
      
      toast({ 
        title: "✅ Análisis completado", 
        description: "Los valores nutricionales se han cargado correctamente.",
        variant: "default"
      });
      
    } catch (err) {
      console.error("❌ Error al analizar con IA:", err);
      toast({ title: "Error", description: "Fallo al conectar con el servicio de IA", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  // Guardar comida (LÓGICA SIN CAMBIOS)
  const handleSave = async () => {
    if (!usuario) {
      toast({ title: "Error", description: "Debes iniciar sesión", variant: "destructive" });
      return;
    }
    
    if (!activeDiet) {
      toast({ title: "Error", description: "No hay una dieta activa para agregar esta comida", variant: "destructive" });
      return;
    }
    
    if (!hasAnalyzed) {
      toast({ 
        title: "Analizar primero", 
        description: "Debes analizar la comida con la IA antes de poder guardarla.", 
        variant: "destructive",
        duration: 5000
      });
      return;
    }

    const fecha = getDateStringFromLocal(fechaLocal);
    const descripcion = descEdit || text || "Comida personalizada";
    const calorias = Number(calEdit) || 0;
    const proteinas = Number(protEdit) || null;
    const carbohidratos = Number(carbEdit) || null;
    const grasas = Number(grasEdit) || null;

    setSaving(true);
    try {
      // PASO 1: Crear la entrada en 'comida_dieta'
      const comidaDietaPayload = {
        dieta_id: activeDiet.id,
        fecha: fecha,
        tipo: tipoComida as any,
        descripcion: descripcion,
        calorias: calorias,
        proteinas: proteinas,
        carbohidratos: carbohidratos,
        grasas: grasas,
      };
      
      const resDieta = await createComidaDieta(comidaDietaPayload);

      if (!resDieta.ok || !resDieta.data) {
        throw new Error(resDieta.data?.message || "Error al crear la comida en el plan de dieta (Paso 1)");
      }

      const newComidaDietaId = (resDieta.data as any)?.comida?.id;
      
      if (!newComidaDietaId) {
        throw new Error("El backend no devolvió un ID para la nueva comida de dieta (Paso 1)");
      }

      // PASO 2: Crear la entrada en 'comida_usuario' (log)
      const comidaUsuarioPayload: Omit<ComidaUsuario, "id"> = {
        usuario_id: usuario.id,
        fecha: fecha, 
        comida_dieta_id: newComidaDietaId,
        opcion: "planificada", // Esta comida se 'planificó' y 'consumió' al mismo tiempo
        descripcion: descripcion,
        calorias: calorias,
        proteinas: proteinas,
        carbohidratos: carbohidratos,
        grasas: grasas,
      };
      
      const resUsuario = await createComidaUsuario(comidaUsuarioPayload);
      
      if (!resUsuario.ok) {
        throw new Error(resUsuario.data?.message || "Error al registrar el consumo de la comida (Paso 2)");
      }

      toast({ title: "Comida guardada", description: "Se agregó y registró la nueva comida en tu plan." });
      if (onSaved && resUsuario.data) onSaved(resUsuario.data as ComidaUsuario);
      onClose();

    } catch (err: any) {
      console.error("Exception guardando comida:", err);
      const errMsg = err.message || "No se pudo guardar la comida";
      toast({ title: "Error", description: errMsg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-center text-xl sm:text-2xl font-bold">
            Agregar y Registrar Comida
          </DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            
            {/* --- NUEVO: Input de Imagen --- */}
            <div>
              <Label className="text-sm">Subir Imagen (Opcional)</Label>
              {imagePreview ? (
                <div className="relative w-full h-48 border rounded-md flex items-center justify-center bg-muted/30">
                  <img src={imagePreview} alt="Vista previa" className="max-h-full max-w-full object-contain rounded-md" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={removeImage}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="imageInput"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50"
                >
                  <ImageIcon size={32} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Haz clic para subir una foto</span>
                  <Input 
                    id="imageInput" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            <div>
              <Label className="text-sm">Descripción de la comida</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ej: Dos porciones de pizza y una gaseosa (o deja que la IA lo vea en la foto)"
                className="h-20 sm:h-24 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Fecha y hora</Label>
                <Input
                  type="datetime-local"
                  value={fechaLocal}
                  onChange={(e) => setFechaLocal(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-sm">Tipo de Comida</Label>
                <select
                  value={tipoComida}
                  onChange={(e) => setTipoComida(e.target.value)}
                  className="w-full h-10 rounded-md border px-3 text-sm"
                >
                  <option value="snack">Snack / Adicional</option>
                  <option value="desayuno">Desayuno</option>
                  <option value="almuerzo">Almuerzo</option>
                  <option value="cena">Cena</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                onClick={handleAnalyze} 
                disabled={analyzing}
                className="w-full sm:w-auto text-sm"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} /> 
                    Analizando...
                  </>
                ) : (
                  "Analizar con IA"
                )}
              </Button>

              <Button 
                variant="secondary" 
                onClick={handleSave} 
                disabled={saving || !hasAnalyzed || !activeDiet}
                title={!hasAnalyzed ? "Debes analizar la comida con IA antes de guardar" : !activeDiet ? "No hay dieta activa" : "Guardar comida"}
                className="w-full sm:w-auto text-sm"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : "Guardar comida"}
              </Button>

              <Button 
                variant="ghost" 
                onClick={onClose}
                className="w-full sm:w-auto text-sm"
              >
                Cancelar
              </Button>
            </div>

            {hasAnalyzed && (
              <div className="pt-2">
                <h4 className="font-semibold mb-3 text-sm sm:text-base">
                  Información Nutricional (editable)
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Descripción</Label>
                    <Input 
                      value={descEdit} 
                      onChange={(e) => setDescEdit(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <Label className="text-sm">Calorías</Label>
                      <Input 
                        type="number" 
                        value={calEdit === "" ? "" : String(calEdit)} 
                        onChange={(e) => setCalEdit(e.target.value === "" ? "" : Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Proteínas (g)</Label>
                      <Input 
                        type="number" 
                        value={protEdit === "" ? "" : String(protEdit)} 
                        onChange={(e) => setProtEdit(e.target.value === "" ? "" : Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Carbohidratos (g)</Label>
                      <Input 
                        type="number" 
                        value={carbEdit === "" ? "" : String(carbEdit)} 
                        onChange={(e) => setCarbEdit(e.target.value === "" ? "" : Number(e.targe.value))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Grasas (g)</Label>
                      <Input 
                        type="number" 
                        value={grasEdit === "" ? "" : String(grasEdit)} 
                        onChange={(e) => setGrasEdit(e.target.value === "" ? "" : Number(e.target.value))}
                        className="text-sm"
                      />
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