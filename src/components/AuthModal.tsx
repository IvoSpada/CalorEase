import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; 
import { useToast } from "@/hooks/use-toast";
// Asumiendo que api.ts está en una ruta accesible como @/lib/api o similar
import { setAuthToken } from "../services/api"; // <-- 1. CORRECCIÓN: Apuntamos a src/services/api.ts

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "login" | "register";
  onSubmit: (payload: any) => Promise<{ ok: boolean; error?: any } | void>;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, type, onSubmit, onSuccess }: AuthModalProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    peso: "",
    altura: "",
    edad: "",
    objetivo: "mantener",
    // --- NUEVOS CAMPOS ---
    genero: "masculino", // Valor por defecto para el select
    patologias: "",
    ejercicio: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Hacemos genérico el handleSelectChange ---
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- VALIDACIÓN MEJORADA ---
  const validateRegister = () => {
    const { nombre, email, password, confirmPassword, edad } = formData;

    // 1. Campos obligatorios
    if (!nombre || !email || !password || !confirmPassword || !edad) {
      toast({ title: "Error", description: "Nombre, email, contraseña, confirmación y edad son obligatorios", variant: "destructive" });
      return false;
    }

    // 2. Formato de Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast({ title: "Error", description: "El formato del correo electrónico no es válido", variant: "destructive" });
        return false;
    }
    
    // 3. Longitud de Contraseña
    if (password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return false;
    }

    // 4. Coincidencia de Contraseñas
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      let payload: any = {};

      if (type === "register") {
        if (!validateRegister()) {
          setIsLoading(false);
          return;
        }
        // --- PAYLOAD ACTUALIZADO ---
        payload = {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          password: formData.password,
          // No enviamos confirmPassword, solo se usa en front
          
          // Campos obligatorios
          edad: Number(formData.edad),
          objetivo: formData.objetivo,

          // Campos opcionales (nullable)
          peso: formData.peso ? Number(formData.peso) : null,
          altura: formData.altura ? Number(formData.altura) : null,
          genero: formData.genero,
          patologias: formData.patologias.trim() || null,
          ejercicio: formData.ejercicio.trim() || null,
        };
      } else {
        // --- LOGIN ---
        if (!formData.email || !formData.password) { // <-- ¡CORREGIDO! (antes decía !formData.email)
          toast({ title: "Error", description: "Email y contraseña son obligatorios", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        payload = {
          email: formData.email.trim(),
          password: formData.password,
        };
      }

      const result = await onSubmit(payload);

      // Si el padre no retorna nada (void) consideramos éxito.
      if (!result || result.ok) {

        // --- INICIO DE CORRECCIÓN AUTO-LOGIN ---
        // 2. Extraer el token de la respuesta (funciona para Login y Register)
        const token = result?.data?.access_token;
        
        if (token) {
          setAuthToken(token, true); // 3. Guardar el token en localStorage
        } else if (result && !result.data?.access_token) {
            console.warn("Respuesta exitosa pero sin access_token.", result.data);
        }
        // --- FIN DE CORRECCIÓN AUTO-LOGIN ---

        // --- INICIO DE CORRECCIÓN DEL TOAST DE ÉXITO ---
        // El toast anterior era de error por error
        toast({
          title: type === "login" ? "Inicio de sesión exitoso" : "Registro exitoso",
          description: "Bienvenido",
          variant: "default",
        });
        onClose();      // <-- Faltaba esto
        onSuccess?.();  // <-- Faltaba esto
        // --- FIN DE CORRECCIÓN DEL TOAST DE ÉXITO ---

      } else {
        // --- Bloque de Error (Este estaba bien) ---
        const message =
          result.error?.errors
            ? // Extrae el primer mensaje de validación si existe
              (Object.values(result.error.errors).flat()[0] as any)
            : result.error?.message || "Ocurrió un error.";
        toast({
          title: "Error",
          description: typeof message === "string" ? message : JSON.stringify(message),
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error en onSubmit del AuthModal:", err);
      toast({
        title: "Error",
        description: (err as any)?.message || "Error en la operación",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "login" ? "Iniciar sesión" : "Crear cuenta"}</DialogTitle>
        </DialogHeader>

        {/* --- FORMULARIO --- */}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
          {type === "register" && (
            <div className="space-y-2">
              <Label htmlFor="nombre-modal">Nombre completo *</Label>
              <Input
                id="nombre-modal"
                name="nombre"
                placeholder="Nombre completo"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email-modal">Correo electrónico *</Label>
            <Input
              id="email-modal"
              name="email"
              type="email"
              placeholder="Correo electrónico"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-modal">Contraseña * {type === "register" && "(mín. 6 caracteres)"}</Label>
            <Input
              id="password-modal"
              name="password"
              type="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {type === "register" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword-modal">Confirmar contraseña *</Label>
                <Input
                  id="confirmPassword-modal"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edad-modal">Edad *</Label>
                <Input
                  id="edad-modal"
                  name="edad"
                  type="number"
                  placeholder="Edad"
                  value={formData.edad}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objetivo-modal">Objetivo *</Label>
                <Select name="objetivo" value={formData.objetivo} onValueChange={(v) => handleSelectChange("objetivo", v)}>
                  <SelectTrigger id="objetivo-modal">
                    <SelectValue placeholder="Selecciona tu objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perder_peso">Perder peso</SelectItem>
                    <SelectItem value="mantener">Mantener peso</SelectItem>
                    <SelectItem value="ganar_peso">Ganar peso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <hr className="my-4"/>
              <p className="text-sm text-muted-foreground">Datos opcionales</p>

              <div className="space-y-2">
                <Label htmlFor="peso-modal">Peso (kg)</Label>
                <Input
                  id="peso-modal"
                  name="peso"
                  type="number"
                  placeholder="Peso (kg)"
                  value={formData.peso}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="altura-modal">Altura (cm)</Label>
                <Input
                  id="altura-modal"
                  name="altura"
                  type="number"
                  placeholder="Altura (cm)"
                  value={formData.altura}
                  onChange={handleChange}
                />
              </div>

              {/* --- CAMPO GENERO --- */}
              <div className="space-y-2">
                <Label htmlFor="genero-modal">Género</Label>
                <Select name="genero" value={formData.genero} onValueChange={(v) => handleSelectChange("genero", v)}>
                  <SelectTrigger id="genero-modal">
                    <SelectValue placeholder="Selecciona tu género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* --- CAMPO PATOLOGIAS --- */}
              <div className="space-y-2">
                <Label htmlFor="patologias-modal">Patologías (Alergias, diabetes, etc.)</Label>
                <Textarea
                  id="patologias-modal"
                  name="patologias"
                  placeholder="Ej: Alergia al maní, Hipertensión..."
                  value={formData.patologias}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              
              {/* --- CAMPO EJERCICIO --- */}
              <div className="space-y-2">
                <Label htmlFor="ejercicio-modal">Ejercicio (Tipo y frecuencia)</Label>
                <Textarea
                  id="ejercicio-modal"
                  name="ejercicio"
                  placeholder="Ej: Corro 3 veces por semana, Gimnasio 5 días..."
                  value={formData.ejercicio}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={isLoading} className="w-full mt-4">
          {isLoading ? "Procesando..." : type === "login" ? "Iniciar sesión" : "Registrarse"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}