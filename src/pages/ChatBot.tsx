import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Send, Bot, User, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  type: "user" | "bot";
  timestamp: Date;
}

export const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "¡Hola! Soy tu asistente nutricional de CalorEase. Puedo ayudarte con información sobre calorías, nutrición, dietas y hábitos saludables. ¿En qué puedo asistirte hoy?",
      type: "bot",
      timestamp: new Date(),
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // --- PrePrompt ---
  const prePrompt = `
  Perteneces a la empresa "CalorEase"
  Actúa como un nutricionista profesional. Si se te es enviado, analiza el o los alimento/s y su porción aproximada. Incluye en tu respuesta:

- Sus valores nutricionales estimados (calorías, carbohidratos, grasas, proteínas).
- Qué tan saludable es y en qué contextos puede ser adecuado o no.
- A qué tipo de dieta puede pertenecer o en cuáles se recomienda (ej. baja en carbohidratos, alta en proteínas, etc.).
- Qué beneficios aporta o qué precauciones deberían tomarse al consumirlo.
- Una conclusión breve con recomendaciones.
- Si es una comida apta o no para celíacos, diabéticos o alguna otra enfermedad.

Utiliza un lenguaje claro, profesional, accesible y resumido como si estuvieras asesorando a un paciente:\n\n`;

  // --- Escapar HTML y formatear negrita/cursiva/listas ---
  const formatAsHTML = (text: string) => {
    const escapeHTML = (str: string) =>
      str.replace(/[&<>]/g, (tag) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
      }[tag] as string));

    let escaped = escapeHTML(text);

    escaped = escaped.replace(/\*\*(?!\s)(.+?)(?!\s)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/\*(?!\s)(.+?)(?!\s)\*/g, "<em>$1</em>");

    const lines = escaped.split("\n");
    let html = "";
    let inList = false;

    lines.forEach((line) => {
      if (line.startsWith("- ") || line.startsWith("* ")) {
        if (!inList) {
          html += "<ul>";
          inList = true;
        }
        html += `<li>${line.replace(/^[-*] /, "")}</li>`;
      } else {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        if (line.trim() !== "") {
          html += `<p>${line}</p>`;
        }
      }
    });

    if (inList) html += "</ul>";
    return html;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = currentMessage.trim();
    const userMessageId = Date.now().toString();
    const botMessageId = (Date.now() + 1).toString();

    // --- Mensaje usuario ---
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, content: userMessage, type: "user", timestamp: new Date() },
    ]);

    setCurrentMessage("");
    setIsLoading(true);

    try {
      // --- Mensaje bot placeholder ---
      setMessages((prev) => [
        ...prev,
        { id: botMessageId, content: "Cargando respuesta...", type: "bot", timestamp: new Date() },
      ]);

      const prompt = `${prePrompt}${userMessage}`;

      // --- Fetch al backend LAN ---
      const res = await fetch("http://192.168.0.41:5000/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.text();

      if (!data) console.warn("⚠️ La respuesta del bot está vacía");

      // --- Actualizar mensaje del bot ---
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId ? { ...msg, content: formatAsHTML(data) } : msg
        )
      );
    } catch (error: any) {
      console.error("Error al obtener respuesta del bot:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar tu mensaje. Inténtalo nuevamente.",
        variant: "destructive",
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? { ...msg, content: "❌ Error al obtener respuesta del bot." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: "welcome-new",
        content:
          "¡Hola! Nueva conversación iniciada. ¿En qué puedo ayudarte con tu nutrición hoy?",
        type: "bot",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="pt-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Chat-Bot CalorEase
              </h1>
              <p className="text-muted-foreground mt-1">
                Tu asistente nutricional inteligente
              </p>
            </div>

            <Button
              onClick={clearConversation}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RotateCcw size={16} />
              <span>Nueva conversación</span>
            </Button>
          </div>

          {/* Messages Container */}
          <Card className="flex-1 mb-4 shadow-card">
            <CardContent className="p-0 flex-1">
              <div className="flex-1 overflow-y-auto max-h-[500px] p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === "user"
                          ? "bg-gradient-accent"
                          : "bg-gradient-primary"
                      }`}
                    >
                      {message.type === "user" ? (
                        <User size={16} className="text-accent-foreground" />
                      ) : (
                        <Bot
                          size={16}
                          className="text-primary-foreground"
                        />
                      )}
                    </div>

                    <div
                      className={`flex-1 max-w-xs md:max-w-md lg:max-w-lg ${
                        message.type === "user" ? "text-right" : ""
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.type === "user"
                            ? "bg-gradient-accent text-accent-foreground ml-auto"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <div
                          className="whitespace-pre-wrap text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: message.content,
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Input Form */}
          <Card className="shadow-card">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Escribe tu pregunta sobre nutrición..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !currentMessage.trim()}
                  variant="hero"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};
