import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Calculator, Utensils, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddFoodModal = ({ isOpen, onClose }: AddFoodModalProps) => {
  const [aiDescription, setAiDescription] = useState("");
  const [manualData, setManualData] = useState({
    name: "",
    calories: "",
    proteins: "",
    carbs: "",
    fats: "",
    fiber: "",
    sugar: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { toast } = useToast();

  const handleAiAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiDescription.trim()) return;

    setIsAnalyzing(true);
    
    try {
      // Simular análisis de IA (aquí se conectaría con Gemini)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockAnalysis = {
        name: aiDescription.split(' ').slice(0, 3).join(' '),
        calories: Math.floor(Math.random() * 400) + 100,
        proteins: Math.floor(Math.random() * 25) + 5,
        carbs: Math.floor(Math.random() * 50) + 10,
        fats: Math.floor(Math.random() * 20) + 2,
        fiber: Math.floor(Math.random() * 8) + 1,
        sugar: Math.floor(Math.random() * 15) + 2,
        confidence: Math.floor(Math.random() * 20) + 80,
        recommendations: [
          "Buena fuente de proteínas",
          "Considera acompañar con vegetales",
          "Ideal para después del ejercicio"
        ]
      };

      setAnalysisResult(mockAnalysis);

      toast({
        title: "Análisis completado",
        description: `Alimento analizado con ${mockAnalysis.confidence}% de confianza`,
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo analizar el alimento. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Alimento agregado",
      description: `${manualData.name} se ha registrado correctamente`,
    });

    // Reset form
    setManualData({
      name: "",
      calories: "",
      proteins: "",
      carbs: "",
      fats: "",
      fiber: "",
      sugar: "",
    });
    
    onClose();
  };

  const handleSaveAnalysis = () => {
    toast({
      title: "Alimento guardado",
      description: `${analysisResult.name} se ha agregado a tu registro`,
    });
    
    setAnalysisResult(null);
    setAiDescription("");
    onClose();
  };

  const resetModal = () => {
    setAiDescription("");
    setAnalysisResult(null);
    setManualData({
      name: "",
      calories: "",
      proteins: "",
      carbs: "",
      fats: "",
      fiber: "",
      sugar: "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetModal(); onClose(); } }}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center space-x-2">
            <Utensils size={24} />
            <span>Agregar Comida</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center space-x-2">
              <Bot size={16} />
              <span>Análisis con IA</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center space-x-2">
              <Calculator size={16} />
              <span>Ingreso Manual</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Analysis Tab */}
          <TabsContent value="ai" className="space-y-4">
            {!analysisResult ? (
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleAiAnalysis} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="aiDescription" className="text-sm font-medium">
                        Describe tu comida
                      </Label>
                      <Textarea
                        id="aiDescription"
                        value={aiDescription}
                        onChange={(e) => setAiDescription(e.target.value)}
                        placeholder="Ej: Una porción de pechuga de pollo a la plancha con arroz integral y brócoli al vapor..."
                        className="min-h-[100px] resize-none"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Sé lo más específico posible: incluye ingredientes, método de cocción y porciones
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isAnalyzing || !aiDescription.trim()}
                      className="w-full bg-gradient-accent hover:bg-accent/90 text-accent-foreground"
                      size="lg"
                    >
                      {isAnalyzing ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                          <span>Analizando con IA...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Zap size={16} />
                          <span>Analizar comida</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{analysisResult.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      Confianza: {analysisResult.confidence}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-accent">{analysisResult.calories}</div>
                      <div className="text-xs text-muted-foreground">Calorías</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl font-bold">{analysisResult.proteins}g</div>
                      <div className="text-xs text-muted-foreground">Proteínas</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl font-bold">{analysisResult.carbs}g</div>
                      <div className="text-xs text-muted-foreground">Carbohidratos</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl font-bold">{analysisResult.fats}g</div>
                      <div className="text-xs text-muted-foreground">Grasas</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Recomendaciones de IA:</h4>
                    <ul className="space-y-1">
                      {analysisResult.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveAnalysis}
                      className="flex-1 bg-gradient-accent hover:bg-accent/90"
                    >
                      Guardar alimento
                    </Button>
                    <Button
                      onClick={() => setAnalysisResult(null)}
                      variant="outline"
                    >
                      Reanalizar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="foodName" className="text-sm font-medium">
                      Nombre del alimento
                    </Label>
                    <Input
                      id="foodName"
                      value={manualData.name}
                      onChange={(e) => setManualData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Pechuga de pollo a la plancha"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="calories" className="text-sm font-medium">
                        Calorías
                      </Label>
                      <Input
                        id="calories"
                        type="number"
                        value={manualData.calories}
                        onChange={(e) => setManualData(prev => ({ ...prev, calories: e.target.value }))}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proteins" className="text-sm font-medium">
                        Proteínas (g)
                      </Label>
                      <Input
                        id="proteins"
                        type="number"
                        step="0.1"
                        value={manualData.proteins}
                        onChange={(e) => setManualData(prev => ({ ...prev, proteins: e.target.value }))}
                        placeholder="0.0"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="carbs" className="text-sm font-medium">
                        Carbohidratos (g)
                      </Label>
                      <Input
                        id="carbs"
                        type="number"
                        step="0.1"
                        value={manualData.carbs}
                        onChange={(e) => setManualData(prev => ({ ...prev, carbs: e.target.value }))}
                        placeholder="0.0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fats" className="text-sm font-medium">
                        Grasas (g)
                      </Label>
                      <Input
                        id="fats"
                        type="number"
                        step="0.1"
                        value={manualData.fats}
                        onChange={(e) => setManualData(prev => ({ ...prev, fats: e.target.value }))}
                        placeholder="0.0"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fiber" className="text-sm font-medium">
                        Fibra (g)
                      </Label>
                      <Input
                        id="fiber"
                        type="number"
                        step="0.1"
                        value={manualData.fiber}
                        onChange={(e) => setManualData(prev => ({ ...prev, fiber: e.target.value }))}
                        placeholder="0.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sugar" className="text-sm font-medium">
                        Azúcar (g)
                      </Label>
                      <Input
                        id="sugar"
                        type="number"
                        step="0.1"
                        value={manualData.sugar}
                        onChange={(e) => setManualData(prev => ({ ...prev, sugar: e.target.value }))}
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:opacity-90"
                    size="lg"
                  >
                    Agregar alimento
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};