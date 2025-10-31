import { useEffect, useState } from "react";
// Rutas de importación corregidas a relativas
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { Loader2, Wand2, CheckCircle } from "lucide-react";
import { createDieta, createComidaDieta } from "../services/dietService";
import { generateDiet } from "../services/iaService"; // Usamos el servicio de IA
import type { Dieta, ComidaDieta } from "../types";

// Tipo para el plan generado por la IA
type PlanGenerado = {
  dias: {
    fecha: string; // "YYYY-MM-DD"
    comidas: Omit<ComidaDieta, 'id' | 'dieta_id'>[];
  }[];
};

interface GenerateDietModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Callback para refrescar el dashboard
  onDietaCreada: (dieta: Dieta) => void;
}

// Helper para obtener fechas
const getToday = () => new Date().toISOString().split('T')[0];
const getIn7Days = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
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

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      // No reseteamos las fechas para conveniencia
      // setFechaInicio(getToday());
      // setFechaFin(getIn7Days());
      setPlanGenerado(null);
      setIsGenerating(false);
      setIsSaving(false);
      // No reseteamos el prompt para que el usuario pueda refinar
      // setPromptUsuario("3 comidas al día...");
    }
  }, [isOpen]);

  const handleGeneratePreview = async () => {
    if (!usuario || !promptUsuario) {
      toast({ title: "Faltan datos", description: "Por favor, escribe tus preferencias." });
      return;
    }
    
    setIsGenerating(true);
    setPlanGenerado(null);

    // Prompt súper-específico para la IA, pidiendo JSON
    const fullPrompt = `
      Eres un nutricionista experto. Genera un plan de comidas detallado.
      - Fecha de inicio: ${fechaInicio}
      - Fecha de fin: ${fechaFin}
      - Preferencias del usuario: "${promptUsuario}"

      Devuelve SOLAMENTE un objeto JSON válido. El objeto debe tener una clave raíz "dias".
      "dias" debe ser un array de objetos, uno por cada día desde la fecha de inicio hasta la de fin.
      
      Cada objeto de día debe tener:
      1. "fecha": (string en formato "YYYY-MM-DD")
      2. "comidas": (un array de objetos de comida)

      Cada objeto de comida debe tener:
      1. "tipo": (string, "desayuno", "almuerzo", "cena", o "snack")
      2. "descripcion": (string, nombre y detalle de la comida)
      3. "calorias": (integer, número de calorías)
      4. "proteinas": (numeric, gramos)
      5. "carbohidratos": (numeric, gramos)
      6. "grasas": (numeric, gramos)

      Asegúrate de que las fechas sean correctas y que el JSON sea perfecto.
    `;

    try {
      const res = await generateDiet(
        { ...usuario }, // perfil de usuario
        { prompt: fullPrompt, fecha_inicio: fechaInicio, fecha_fin: fechaFin } // opciones
      );

      if (!res.ok || !res.data) {
        throw new Error(res.error?.message || "La IA no devolvió datos");
      }

      let dataToParse = res.data;
      
      // Limpiar el JSON sucio (como en AddFoodModal)
      if (typeof dataToParse === 'string') {
        const jsonMatch = dataToParse.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0]) {
          dataToParse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("La IA devolvió un string que no es JSON.");
        }
      } else if (dataToParse.data && typeof dataToParse.data === 'string') {
         // Caso { ok: true, data: "json\n{...}" }
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
      // 1. Crear la Dieta "padre"
      const dietaPayload: Partial<Dieta> = {
        usuario_id: usuario.id,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        origen: "IA",
        estado: "activa", // Marcarla como activa por defecto
      };
      
      const dietaRes = await createDieta(dietaPayload);

      // --- INICIO DE LA MODIFICACIÓN (FIX #2) ---
      // El backend devuelve { "dieta": {...}, "status": 201 }
      // Comprobamos la ruta correcta al id.
      if (!dietaRes.ok || !dietaRes.data?.dieta?.id) {
        // Mejorar el mensaje de error para mostrar los errores de validación de Laravel
        const validationErrors = (dietaRes.data as any)?.errors;
        let errorMessage = "No se pudo crear el registro de la dieta";

        if (validationErrors) {
          // Convertir { fecha_fin: ["..."], ... } en un string
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
      
      // Extraer la dieta de la respuesta anidada
      const nuevaDieta = dietaRes.data.dieta as Dieta;
      const dietaId = nuevaDieta.id;
      // --- FIN DE LA MODIFICACIÓN (FIX #2) ---


      // 2. Crear todas las ComidasDieta (en paralelo)
      const comidasPromesas: Promise<any>[] = [];
      planGenerado.dias.forEach(dia => {
        dia.comidas.forEach(comida => {
          const comidaPayload: Partial<ComidaDieta> = {
            dieta_id: dietaId,
            fecha: dia.fecha, // La fecha viene del día
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

      // Esperar a que todas las comidas se guarden
      const results = await Promise.all(comidasPromesas);
      
      // Opcional: verificar si alguna promesa falló
      const fallidos = results.filter(r => !r.ok);
      if (fallidos.length > 0) {
          console.warn("Algunas comidas no se pudieron guardar", fallidos);
          toast({ title: "Dieta Guardada (con advertencias)", description: `Se guardó la dieta, pero ${fallidos.length} comidas fallaron.`, variant: "destructive"});
      } else {
         toast({ title: "¡Dieta Guardada!", description: `Se guardó tu plan de ${planGenerado.dias.length} días.` });
      }

      onDietaCreada(nuevaDieta); // Devolver la dieta creada
      onClose();

    } catch (err: any) {
      console.error("Error guardando la dieta:", err);
      toast({ title: "Error al Guardar", description: err.message || "No se pudo guardar el plan", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // Contenedor del Modal con altura fija y flex
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generador de Dieta con IA</DialogTitle>
        </DialogHeader>

        {/* CONTENEDOR PRINCIPAL (con flex-1) */}
        {/* min-h-0 es crucial para que flex-1 funcione dentro de otro flexbox */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
          
          {/* Columna de Opciones */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                <Input id="fecha_inicio" type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="fecha_fin">Fecha Fin</Label>
                <Input id="fecha_fin" type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="prompt_usuario">Tus preferencias (Ej: "alergia al maní", "vegetariano", "alto en proteínas")</Label>
              <Textarea
                id="prompt_usuario"
                placeholder="Ej: 3 comidas, sin pescado, objetivo perder peso..."
                value={promptUsuario}
                onChange={e => setPromptUsuario(e.target.value)}
                className="h-32"
              />
            </div>
            <Button onClick={handleGeneratePreview} disabled={isGenerating || isSaving} className="w-full">
              {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2" />}
              {isGenerating ? "Generando..." : "Generar Vista Previa"}
            </Button>
          </div>

          {/* Columna de Vista Previa (con flex-1 y overflow) */}
          <div className="h-full flex flex-col space-y-2 min-h-0">
            <Label>Vista Previa del Plan</Label>
            
            {/* CONTENEDOR CON SCROLL (con flex-1) */}
            <div className="flex-1 border rounded-md p-4 overflow-y-auto bg-muted/20">
              {isGenerating && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-primary" size={40} />
                </div>
              )}
              {!isGenerating && !planGenerado && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  La vista previa de tu dieta aparecerá aquí.
                </div>
              )}
              {planGenerado && (
                <div className="space-y-4">
                  {planGenerado.dias.map((dia, idx) => (
                    <div key={idx}>
                      <h4 className="font-bold text-lg mb-2 border-b pb-1">
                        Día {idx + 1} ({new Date(dia.fecha + "T00:00:00").toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })})
                      </h4>
                      <div className="space-y-2">
                        {dia.comidas.map((comida, cIdx) => (
                          <div key={cIdx} className="p-2 border rounded bg-background">
                            <p className="font-semibold capitalize">{comida.tipo}: <span className="font-normal">{comida.descripcion}</span></p>
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
            
            {/* BOTÓN DE GUARDAR (fuera del scroll) */}
            {/* --- INICIO DE LA MODIFICACIÓN (FIX #3) --- */}
            <Button onClick={handleSaveDiet} disabled={!planGenerado || isSaving || isGenerating} className="w-full" variant="hero">
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
              {isSaving ? "Guardando..." : "Guardar Dieta y Comidas"}
            </Button>
            {/* --- FIN DE LA MODIFICACIÓN (FIX #3) --- */}
          </div>
        </div>
        
        {/* FOOTER (siempre abajo) */}
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
