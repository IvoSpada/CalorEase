import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { Loader2, Wand2, CheckCircle, User } from "lucide-react";
import { createDieta, createComidaDieta } from "../services/dietService";
import { generateDiet } from "../services/iaService";
import { api } from "../services/api";
import type { Dieta, ComidaDieta, Profile } from "../types";

type PlanGenerado = {
  dias: {
    fecha: string;
    comidas: Omit<ComidaDieta, 'id' | 'dieta_id'>[];
  }[];
};

interface GenerateDietModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDietaCreada: (dieta: Dieta) => void;
}

const getToday = () => new Date().toISOString().split('T')[0];
const getIn7Days = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

// Helper para traducir objetivos
const getObjetivoText = (objetivo?: string) => {
  const objetivos: Record<string, string> = {
    'perder_peso': 'perder peso',
    'mantener': 'mantener peso',
    'ganar_peso': 'ganar peso (masa muscular)'
  };
  return objetivos[objetivo || ''] || objetivo || 'sin objetivo específico';
};

// Helper para traducir género
const getGeneroText = (genero?: string) => {
  const generos: Record<string, string> = {
    'masculino': 'hombre',
    'femenino': 'mujer',
    'otro': 'persona'
  };
  return generos[genero || ''] || 'persona';
};

export const GenerateDietModal = ({ isOpen, onClose, onDietaCreada }: GenerateDietModalProps) => {
  const { usuario } = useAuth();
  const { toast } = useToast();

  // Estados del formulario
  const [fechaInicio, setFechaInicio] = useState(getToday());
  const [fechaFin, setFechaFin] = useState(getIn7Days());
  const [promptUsuario, setPromptUsuario] = useState("3 comidas al día (desayuno, almuerzo, cena), sin snacks. Dieta balanceada.");

  // Estados del proceso
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [planGenerado, setPlanGenerado] = useState<PlanGenerado | null>(null);
  
  // Estado del perfil completo
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Cargar perfil completo al abrir el modal
  useEffect(() => {
    if (isOpen && usuario?.id) {
      loadProfile();
    }
  }, [isOpen, usuario?.id]);

  const loadProfile = async () => {
    if (!usuario?.id) return;
    
    setLoadingProfile(true);
    try {
      const res = await api.get("/me", true);
      if (res.ok && res.data) {
        setProfile(res.data);
      } else {
        console.error("No se pudo cargar el perfil completo");
      }
    } catch (err) {
      console.error("Error cargando perfil:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setPlanGenerado(null);
      setIsGenerating(false);
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleGeneratePreview = async () => {
    if (!usuario || !promptUsuario || !profile) {
      toast({ title: "Faltan datos", description: "Por favor, escribe tus preferencias." });
      return;
    }
    
    setIsGenerating(true);
    setPlanGenerado(null);

    // Construir información del usuario para el prompt
    const userInfo = `
      Usuario: ${profile.genero ? getGeneroText(profile.genero) : 'persona'} de ${profile.edad} años
      Peso: ${profile.peso}kg
      Altura: ${profile.altura}cm
      Objetivo físico: ${getObjetivoText(profile.objetivo)}
    `;

    // Prompt mejorado con datos del usuario
    const fullPrompt = `
      Eres un nutricionista experto. Genera un plan de comidas detallado y personalizado.
      
      INFORMACIÓN DEL USUARIO:
      ${userInfo}
      
      PARÁMETROS DE LA DIETA:
      - Fecha de inicio: ${fechaInicio}
      - Fecha de fin: ${fechaFin}
      - Preferencias adicionales: "${promptUsuario}"

      IMPORTANTE: Ajusta las calorías y macronutrientes según el objetivo físico del usuario:
      - Si el objetivo es "perder peso": déficit calórico moderado (15-20% menos de las calorías de mantenimiento)
      - Si el objetivo es "mantener": calorías de mantenimiento
      - Si el objetivo es "ganar peso": superávit calórico moderado (10-15% más)

      Devuelve SOLAMENTE un objeto JSON válido. El objeto debe tener una clave raíz "dias".
      "dias" debe ser un array de objetos, uno por cada día desde la fecha de inicio hasta la de fin.
      Los tipos de comidas habilitados son: ['desayuno','almuerzo','cena','snack', 'merienda', 'colacion', 'media mañana', 'media tarde', 'post cena', 'postre'].
      
      Cada objeto de día debe tener:
      1. "fecha": (string en formato "YYYY-MM-DD")
      2. "comidas": (un array de objetos de comida)

      Cada objeto de comida debe tener:
      1. "tipo": (string, uno de los tipos habilitados)
      2. "descripcion": (string, nombre y detalle de la comida)
      3. "calorias": (integer, número de calorías)
      4. "proteinas": (numeric, gramos)
      5. "carbohidratos": (numeric, gramos)
      6. "grasas": (numeric, gramos)

      Asegúrate de que las fechas sean correctas y que el JSON sea perfecto.
    `;

    try {
      const res = await generateDiet(
        profile, // perfil completo del usuario
        { prompt: fullPrompt, fecha_inicio: fechaInicio, fecha_fin: fechaFin }
      );

      if (!res.ok || !res.data) {
        throw new Error(res.error?.message || "La IA no devolvió datos");
      }

      let dataToParse = res.data;
      
      // Limpiar el JSON
      if (typeof dataToParse === 'string') {
        const jsonMatch = dataToParse.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0]) {
          dataToParse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("La IA devolvió un string que no es JSON.");
        }
      } else if (dataToParse.data && typeof dataToParse.data === 'string') {
         const jsonMatch = dataToParse.data.match(/\{[\s\S]*\}/);
         if (jsonMatch && jsonMatch[0]) {
           dataToParse = JSON.parse(jsonMatch[0]);
         } else {
           throw new Error("La IA devolvió un string anidado que no es JSON.");
         }
      }

      if (!dataToParse.dias || !Array.isArray(dataToParse.dias)) {
        console.error("Respuesta de la IA (parseada):", dataToParse);
        throw new Error("La IA no devolvió la estructura de 'dias' esperada.");
      }

      setPlanGenerado(dataToParse as PlanGenerado);
      toast({ title: "Plan generado", description: "Revisa la vista previa de tu dieta." });

    } catch (err: any) {
      console.error("Error generando dieta:", err);
      toast({ title: "Error de IA", description: err.message || "No se pudo generar el plan", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDiet = async () => {
    if (!usuario || !planGenerado) {
      toast({ title: "Error", description: "No hay plan para guardar." });
      return;
    }

    setIsSaving(true);
    try {
      const dietaPayload: Partial<Dieta> = {
        usuario_id: usuario.id,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        origen: "IA",
        estado: "activa",
      };
      
      const dietaRes = await createDieta(dietaPayload);

      if (!dietaRes.ok || !dietaRes.data?.dieta?.id) {
        const validationErrors = (dietaRes.data as any)?.errors;
        let errorMessage = "No se pudo crear el registro de la dieta";

        if (validationErrors) {
          errorMessage = "Error de validación: " + Object.keys(validationErrors)
            .map(key => `${key}: ${validationErrors[key].join(', ')}`)
            .join('; ');
        } else if ((dietaRes.data as any)?.message) {
          errorMessage = (dietaRes.data as any).message;
        } else if (dietaRes.error?.message) {
          errorMessage = dietaRes.error.message;
        } else if (dietaRes.error) {
          errorMessage = String(dietaRes.error);
        }
        
        throw new Error(errorMessage);
      }
      
      const nuevaDieta = dietaRes.data.dieta as Dieta;
      const dietaId = nuevaDieta.id;

      const comidasPromesas: Promise<any>[] = [];
      planGenerado.dias.forEach(dia => {
        dia.comidas.forEach(comida => {
          const comidaPayload: Partial<ComidaDieta> = {
            dieta_id: dietaId,
            fecha: dia.fecha,
            tipo: comida.tipo,
            descripcion: comida.descripcion,
            calorias: comida.calorias,
            proteinas: comida.proteinas,
            carbohidratos: comida.carbohidratos,
            grasas: comida.grasas,
          };
          comidasPromesas.push(createComidaDieta(comidaPayload));
        });
      });

      const results = await Promise.all(comidasPromesas);
      
      const fallidos = results.filter(r => !r.ok);
      if (fallidos.length > 0) {
          console.warn("Algunas comidas no se pudieron guardar", fallidos);
          toast({ title: "Dieta Guardada (con advertencias)", description: `Se guardó la dieta, pero ${fallidos.length} comidas fallaron.`, variant: "destructive"});
      } else {
         toast({ title: "¡Dieta Guardada!", description: `Se guardó tu plan de ${planGenerado.dias.length} días.` });
      }

      onDietaCreada(nuevaDieta);
      onClose();

    } catch (err: any) {
      console.error("Error guardando la dieta:", err);
      toast({ title: "Error al Guardar", description: err.message || "No se pudo guardar el plan", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generador de Dieta con IA</DialogTitle>
        </DialogHeader>

        {loadingProfile ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={40} />
            <span className="ml-2">Cargando perfil...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Columna de Opciones */}
            <div className="space-y-4">
              {/* Card con información del usuario */}
              {profile && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                      Plan personalizado para:
                    </h3>
                  </div>
                  <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <p>
                      • {profile.genero ? getGeneroText(profile.genero).charAt(0).toUpperCase() + getGeneroText(profile.genero).slice(1) : 'Persona'} de {profile.edad} años
                    </p>
                    <p>• Peso: {profile.peso}kg | Altura: {profile.altura}cm</p>
                    <p className="font-medium">• Objetivo: {getObjetivoText(profile.objetivo)}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="fecha_inicio" className="text-sm">Fecha Inicio</Label>
                  <Input 
                    id="fecha_inicio" 
                    type="date" 
                    value={fechaInicio} 
                    onChange={e => setFechaInicio(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="fecha_fin" className="text-sm">Fecha Fin</Label>
                  <Input 
                    id="fecha_fin" 
                    type="date" 
                    value={fechaFin} 
                    onChange={e => setFechaFin(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="prompt_usuario" className="text-sm">
                  Preferencias adicionales (alergias, restricciones, gustos)
                </Label>
                <Textarea
                  id="prompt_usuario"
                  placeholder="Ej: Sin mariscos, vegetariano, 4 comidas al día..."
                  value={promptUsuario}
                  onChange={e => setPromptUsuario(e.target.value)}
                  className="h-24 text-sm"
                />
              </div>

              <Button 
                onClick={handleGeneratePreview} 
                disabled={isGenerating || isSaving || !profile} 
                className="w-full"
              >
                {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2" />}
                {isGenerating ? "Generando..." : "Generar Vista Previa"}
              </Button>
            </div>

            {/* Columna de Vista Previa */}
            <div className="flex flex-col space-y-2">
              <Label className="text-sm">Vista Previa del Plan</Label>
              
              <div className="flex-1 border rounded-md p-3 overflow-y-auto bg-muted/20 max-h-[500px]">
                {isGenerating && (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-primary" size={40} />
                  </div>
                )}
                {!isGenerating && !planGenerado && (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center p-4">
                    La vista previa de tu dieta personalizada aparecerá aquí.
                  </div>
                )}
                {planGenerado && (
                  <div className="space-y-3">
                    {planGenerado.dias.map((dia, idx) => (
                      <div key={idx}>
                        <h4 className="font-bold text-sm mb-2 border-b pb-1">
                          Día {idx + 1} ({new Date(dia.fecha + "T00:00:00").toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })})
                        </h4>
                        <div className="space-y-2">
                          {dia.comidas.map((comida, cIdx) => (
                            <div key={cIdx} className="p-2 border rounded bg-background">
                              <p className="font-semibold capitalize text-sm">
                                {comida.tipo}: <span className="font-normal">{comida.descripcion}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {comida.calorias} kcal • 
                                P: {comida.proteinas}g • 
                                C: {comida.carbohidratos}g • 
                                G: {comida.grasas}g
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleSaveDiet} 
                disabled={!planGenerado || isSaving || isGenerating} 
                className="w-full" 
                variant="hero"
              >
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
                {isSaving ? "Guardando..." : "Guardar Dieta y Comidas"}
              </Button>
            </div>
          </div>
        )}
        
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose} className="text-sm">Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};