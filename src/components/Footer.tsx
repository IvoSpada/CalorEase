import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Copy, Clock, Home, Bot, UserPlus, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const Footer = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleQuickQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    
    try {
      // Simular respuesta de Gemini (aquí se conectaría con la API real)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResponse = `Esta es una respuesta simulada para: "${query}". 
      
En un escenario real, aquí aparecería la respuesta de Gemini AI sobre temas de nutrición y salud. 

**Ejemplo de respuesta:**
- Información nutricional relevante
- Consejos de salud personalizados  
- Recomendaciones dietéticas

La respuesta sería generada por la API de Gemini basada en tu consulta específica.`;

      setCurrentResponse(mockResponse);
      setShowResponseModal(true);
      
      // Agregar al historial
      setQueryHistory(prev => [query, ...prev.slice(0, 2)]);
      setQuery("");
      
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar tu consulta. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(currentResponse);
    toast({
      title: "Copiado",
      description: "Respuesta copiada al portapapeles",
    });
  };

  const handleHistoryClick = (historicalQuery: string) => {
    setQuery(historicalQuery);
  };

  return (
    <>
      <footer className="bg-gradient-primary text-primary-foreground mt-20">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Quick Query Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-6">
              Consultas Rápidas a Gemini
            </h3>
            
            <Card className="max-w-2xl mx-auto bg-card/10 border-primary-foreground/20">
              <CardContent className="p-6">
                <form onSubmit={handleQuickQuery} className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Pregunta sobre nutrición, calorías, dietas..."
                      className="flex-1 bg-background/90 border-primary-foreground/30 text-foreground placeholder:text-muted-foreground"
                    />
                    <Button 
                      type="submit" 
                      disabled={isLoading || !query.trim()}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </Button>
                  </div>
                </form>

                {/* Query History */}
                {queryHistory.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-primary-foreground/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock size={14} />
                      <span className="text-sm font-medium">Consultas recientes:</span>
                    </div>
                    <div className="space-y-1">
                      {queryHistory.slice(0, 3).map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleHistoryClick(item)}
                          className="text-xs text-left w-full p-2 rounded bg-background/5 hover:bg-background/10 transition-colors border border-primary-foreground/10"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Footer Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              <Home size={16} />
              <span>Inicio</span>
            </button>
            
            <button
              onClick={() => navigate("/chat-bot")}
              className="flex items-center space-x-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              <Bot size={16} />
              <span>ChatBot</span>
            </button>
            
            <button
              onClick={() => {
                const element = document.getElementById("about");
                if (element) element.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center space-x-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              <Info size={16} />
              <span>Sobre Nosotros</span>
            </button>
            
            <button className="flex items-center space-x-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <UserPlus size={16} />
              <span>Crear Cuenta</span>
            </button>
          </div>

          {/* Copyright */}
          <div className="text-center pt-8 border-t border-primary-foreground/20">
            <p className="text-primary-foreground/80">
              CalorEase © 2025 – Todos los derechos reservados
            </p>
          </div>
        </div>
      </footer>

      {/* Response Modal */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Respuesta de Gemini AI
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {currentResponse}
              </pre>
            </div>
            
            <Button
              onClick={copyResponse}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Copy size={16} className="mr-2" />
              Copiar respuesta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};