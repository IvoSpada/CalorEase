// src/pages/LiveChat.tsx
import { useState, useRef, useEffect, useMemo } from "react";
// --- RUTAS CORREGIDAS ---
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { 
  Send, 
  Bot, 
  User, 
  RotateCcw, 
  StopCircle, 
  Mic,
  Volume2,
  VolumeX 
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
// --- IMPORTAR EL NUEVO HOOK ---
import { useSpeechToText } from "../hooks/useSpeechToText"; 

// --- Interfaz de Mensaje (sin cambios) ---
interface Message {
  id: string;
  content: string;
  type: "user" | "bot";
  timestamp: Date;
}

// --- NUEVO: Componente Visualizador de Voz ---
const VoiceVisualizer = () => (
  <div className="flex items-center justify-center space-x-1 h-6">
    <span className="w-1 h-2 bg-muted-foreground animate-voice-bar" style={{ animationDelay: '0ms' }} />
    <span className="w-1 h-4 bg-muted-foreground animate-voice-bar" style={{ animationDelay: '200ms' }} />
    <span className="w-1 h-5 bg-muted-foreground animate-voice-bar" style={{ animationDelay: '400ms' }} />
    <span className="w-1 h-3 bg-muted-foreground animate-voice-bar" style={{ animationDelay: '100ms' }} />
    <span className="w-1 h-4 bg-muted-foreground animate-voice-bar" style={{ animationDelay: '300ms' }} />
  </div>
);

// --- CAMBIO AQUÍ: Eliminado 'export' ---
const LiveChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "¡Hola! Soy tu asistente en vivo. Escribe un mensaje o usa el micrófono. ¿En qué puedo asistirte hoy?",
      type: "bot",
      timestamp: new Date(),
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();

  // --- Estado de Audio ---
  const [isMuted, setIsMuted] = useState(false); // Sigue igual
  const [speechVoice, setSpeechVoice] = useState<SpeechSynthesisVoice | null>(null); // Sigue igual
  const botResponseRef = useRef<string>(""); 
  
  // --- USANDO EL NUEVO HOOK ---
  const { isListening, isSupported, toggleListening } = useSpeechToText({
    onTranscript: (transcript) => {
      setCurrentMessage(transcript);
    }
  });
  // ---------------------------

  const LAN_IP = useMemo(() => import.meta.env.VITE_LAN_IP || "localhost", []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Efecto para inicializar SÍNTESIS de voz (Altavoz) ---
  useEffect(() => {
    // 1. Inicializar SpeechSynthesis (Altavoz)
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = 
        voices.find(v => v.lang === 'es-ES') || 
        voices.find(v => v.lang.startsWith('es-')) || 
        null;
      
      if (spanishVoice) {
        setSpeechVoice(spanishVoice);
      } else {
         console.warn("No se encontró una voz en español para la síntesis de voz.");
      }
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    // 2. Limpiador
    return () => {
      eventSourceRef.current?.close();
      window.speechSynthesis.cancel();
    };
  }, []);
  // ------------------------------------------------

  // --- Función formatAsHTML (sin cambios) ---
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
    if (html.trim() === "") {
        return '<span class="animate-pulse">...</span>';
    }
    return html;
  };

  // --- Función speakResponse (sin cambios) ---
  const speakResponse = (text: string) => {
    if (isMuted || !text.trim()) return;
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    if (speechVoice) {
      utterance.voice = speechVoice;
    } else {
      utterance.lang = 'es-ES';
    }
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

  // --- handleSubmit (Modificado) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isLoading) return;

    // Detener el micrófono si estaba encendido (usando el hook)
    if (isListening) {
      toggleListening(); 
    }

    const userMessage = currentMessage.trim();
    const userMessageId = Date.now().toString();
    const botMessageId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, content: userMessage, type: "user", timestamp: new Date() },
    ]);
    setMessages((prev) => [
      ...prev,
      { id: botMessageId, content: "", type: "bot", timestamp: new Date() },
    ]);

    setCurrentMessage("");
    setIsLoading(true);
    botResponseRef.current = ""; 

    try {
      const prompt = userMessage;
      const streamUrl = `http://${LAN_IP}:5000/api/chat-stream?prompt=${encodeURIComponent(prompt)}`;
      
      eventSourceRef.current = new EventSource(streamUrl);

      eventSourceRef.current.onmessage = (event) => {
        if (event.data === "[DONE]") {
          eventSourceRef.current?.close();
          eventSourceRef.current = null;
          setIsLoading(false);
          speakResponse(botResponseRef.current);
          return;
        }

        try {
          const textChunk = JSON.parse(event.data);
          if (typeof textChunk === 'object' && textChunk.error) {
             throw new Error(textChunk.error);
          }
          
          botResponseRef.current += textChunk; 
          
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, content: botResponseRef.current } 
                : msg
            )
          );
        } catch (err: any) {
          console.error("Error parseando chunk:", event.data, err);
          eventSourceRef.current?.close();
          eventSourceRef.current = null;
          setIsLoading(false);
        }
      };

      eventSourceRef.current.onerror = (err) => {
        console.error("Error de EventSource:", err);
        toast({ title: "Error de Conexión", variant: "destructive" });
        eventSourceRef.current?.close();
        eventSourceRef.current = null;
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? { ...msg, content: "❌ Error de conexión con el servidor." }
              : msg
          )
        );
      };

    } catch (error: any) {
      console.error("Error al iniciar el stream:", error);
      toast({ title: "Error", description: "No se pudo iniciar el chat.", variant: "destructive" });
      setIsLoading(false);
    }
  };

  // --- clearConversation (Modificado) ---
  const clearConversation = () => {
    eventSourceRef.current?.close();
    if (isListening) toggleListening(); // Detener mic
    window.speechSynthesis.cancel();
    setIsLoading(false);
    setMessages([
      { id: "welcome-new", content: "¡Hola! Nueva conversación iniciada.", type: "bot", timestamp: new Date()},
    ]);
  };

  // --- stopGeneration (Modificado) ---
  const stopGeneration = () => {
     eventSourceRef.current?.close();
     window.speechSynthesis.cancel(); 
     setIsLoading(false);
     toast({ title: "Generación detenida" });
  };

  // --- handleMicClick (Simplificado) ---
  const handleMicClick = () => {
    if (!isSupported) {
      toast({ title: "Error", description: "El reconocimiento de voz no está disponible en este navegador.", variant: "destructive"});
      return;
    }
    toggleListening();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar /> 

      <main className="pt-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
             {/* ... (sin cambios) ... */}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Live Chat (con Audio)
              </h1>
              <p className="text-muted-foreground mt-1">
                Tu asistente nutricional en tiempo real
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isMuted ? "outline" : "default"}
                size="icon"
                onClick={() => setIsMuted(prev => !prev)}
                title={isMuted ? "Activar audio" : "Silenciar audio"}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </Button>
              <Button
                onClick={clearConversation}
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center space-x-2"
              >
                <RotateCcw size={16} />
                <span>Nueva conversación</span>
              </Button>
            </div>
          </div>

          {/* Messages Container */}
          <Card className="flex-1 mb-4 shadow-card">
            <CardContent className="p-0 flex-1">
              <div className="flex-1 overflow-y-auto max-h-[500px] p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                     <div
                      className={`flex items-start space-x-3 ${
                        message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.type === "user"
                            ? "bg-gradient-accent"
                            : "bg-gradient-primary"
                        }`}
                      >
                        {message.type === "user" ? (
                          <User size={16} className="text-accent-foreground" />
                        ) : (
                          <Bot size={16} className="text-primary-foreground" />
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
                              __html: formatAsHTML(message.content),
                            }}
                          />
                        </div>
                        {/* --- NUEVO: Visualizador de voz del Bot --- */}
                        {message.type === 'bot' && isListening && (
                          <div className="mt-2">
                            <VoiceVisualizer />
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1 px-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Input Form (Modificado) */}
          <Card className="shadow-card">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  size="lg"
                  title={isListening ? "Detener grabación" : "Grabar voz"}
                  onClick={handleMicClick}
                  disabled={!isSupported} // Deshabilitar si la API no existe
                >
                  <Mic size={18} className={isListening ? "animate-pulse" : ""} />
                </Button>
                
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={isListening ? "Escuchando..." : "Escribe tu mensaje..."}
                  className="flex-1"
                  disabled={isLoading}
                />
                
                {isLoading ? (
                  <Button type="button" onClick={stopGeneration} variant="destructive" size="lg">
                    <StopCircle size={18} />
                  </Button>
                ) : (
                  <Button type="submit" disabled={!currentMessage.trim()} variant="hero" size="lg">
                    <Send size={18} />
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// --- CAMBIO AQUÍ: Añadido 'export default' ---
export default LiveChat;