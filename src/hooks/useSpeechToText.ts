import { useState, useEffect, useRef } from 'react';

// --- Interfaz para el objeto de Reconocimiento de Voz ---
interface CustomSpeechRecognition extends SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
}
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// Opciones para el hook
interface UseSpeechToTextOptions {
  onTranscript: (transcript: string) => void;
  lang?: string;
}

/**
 * Hook para manejar la API de SpeechRecognition de forma robusta.
 * Se reinicia automáticamente y maneja el estado de "escuchando".
 */
export const useSpeechToText = ({ onTranscript, lang = 'es-ES' }: UseSpeechToTextOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<CustomSpeechRecognition | null>(null);
  
  // Ref para controlar la intención del usuario (si el mic debe estar encendido)
  const userIntentRef = useRef(false);
  // Ref para controlar el estado real del hardware (evita race conditions)
  const isRecognizingRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    
    const recognition = new SpeechRecognition() as CustomSpeechRecognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      onTranscript(finalTranscript + interimTranscript);
    };

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setIsListening(true);
    };

    // --- LÓGICA DE ESTADO CORREGIDA ---
    recognition.onend = () => {
      isRecognizingRef.current = false;
      // No setear isListening(false) aquí si vamos a reiniciar
      
      if (userIntentRef.current) {
        // Si el usuario AÚN quiere escuchar (no fue un stop manual)
        // Reinicia el micrófono
        try {
          recognition.start();
          // onstart se llamará y seteará isListening(true)
        } catch (e) {
          console.error("Error al reiniciar SpeechRecognition:", e);
          setIsListening(false); // Ahora sí, falló
          userIntentRef.current = false;
        }
      } else {
        // Si fue un stop manual, actualiza la UI
        setIsListening(false);
      }
    };
    
    recognition.onerror = (event) => {
      console.error("SpeechRecognition error:", event.error);
      isRecognizingRef.current = false;
      setIsListening(false);
      userIntentRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.abort();
    };
  }, [lang, onTranscript]); // 'onTranscript' es una dependencia

  // Esta función ahora solo controla la INTENCIÓN
  const toggleListening = () => {
    if (!isSupported) return;

    if (isRecognizingRef.current) {
      // Intención: DETENER
      userIntentRef.current = false;
      recognitionRef.current?.stop();
    } else {
      // Intención: INICIAR
      userIntentRef.current = true;
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Error al iniciar SpeechRecognition:", e);
        userIntentRef.current = false;
      }
    }
  };

  // Solo exponemos 'toggle' y los estados de UI
  return { isListening, isSupported, toggleListening };
};