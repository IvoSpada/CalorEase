import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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

  const prePrompt = `
Eres "CalorEase", un asistente nutricional experto. Responde la siguiente consulta del usuario de forma concisa, amigable y en un solo párrafo.
No uses formato de lista, solo texto plano.
Consulta: 
`;

  const handleQuickQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    const userQuery = query.trim();

    try {
      const LAN_IP = import.meta.env.VITE_LAN_IP;
      if (!LAN_IP) {
        throw new Error("La variable VITE_LAN_IP no está configurada.");
      }

      const prompt = `${prePrompt}"${userQuery}"`;

      const res = await fetch(`http://${LAN_IP}:5000/api/gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || `Error del servidor: ${res.status}`);
      }

      const responseText = await res.text();

      setCurrentResponse(responseText);
      setShowResponseModal(true);
      setQueryHistory((prev) => [userQuery, ...prev.slice(0, 2)]);
      setQuery("");
    } catch (error: any) {
      console.error("Error en consulta rápida:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "No se pudo procesar tu consulta. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    const ta = document.createElement("textarea");
    ta.value = currentResponse;
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      toast({
        title: "Copiado",
        description: "Respuesta copiada al portapapeles",
      });
    } catch (err) {
      console.error("Error al copiar:", err);
      toast({
        title: "Error",
        description: "No se pudo copiar la respuesta.",
        variant: "destructive",
      });
    }
    document.body.removeChild(ta);
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
                      <span className="text-sm font-medium">
                        Consultas recientes:
                      </span>
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
              <pre className="whitespace-pre-wrap text-sm font-sans">
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