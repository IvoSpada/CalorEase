import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Importado
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importado
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "login" | "register";
  onSubmit: (payload: any) => Promise<{ ok: boolean; error?: any }>;
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
    objetivo: "mantener", // Valor por defecto
  });

  const [isLoading, setIsLoading] = useState(false);

  // Manejador solo para Inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Nuevo manejador para el Select
  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      objetivo: value,
    }));
  };

  const validateRegister = () => {
    // Validación completa
    if (!formData.nombre || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({ title: "Error", description: "Todos los campos son obligatorios", variant: "destructive" });
      return false;
    }
    
    // === VALIDACIÓN AÑADIDA ===
    // Comprobar los campos requeridos por el backend
    if (!formData.peso || !formData.altura || !formData.edad) {
      toast({ title: "Error", description: "Peso, altura y edad son obligatorios", variant: "destructive" });
      return false;
    }
    // ===========================

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsLoading(true); // Restaurado
    try {
      let payload: any = {};

      if (type === "register") {
        if (!validateRegister()) {
          setIsLoading(false); // Restaurado
          return;
        }
        payload = {
          // Datos completos
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          password: formData.password,
          password_confirmation: formData.confirmPassword,
          peso: Number(formData.peso) || null, // Convertir a null si está vacío
          altura: Number(formData.altura) || null, // Convertir a null si está vacío
          edad: Number(formData.edad) || null, // Convertir a null si está vacío
          objetivo: formData.objetivo,
        };
      } else {
        // Validación de login
        if (!formData.email || !formData.password) {
          toast({ title: "Error", description: "Email y contraseña son obligatorios", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        payload = {
          email: formData.email.trim(),
          password: formData.password,
        };
      }

      // Llamamos a la función onSubmit que se pasa como prop
      // (Se elimina el comentario "// ... existing code ...")
      const result = await onSubmit(payload);

      if (result.ok) {
        // Toast de éxito
        toast({
          title: type === "login" ? "Inicio de sesión exitoso" : "Registro exitoso",
          description: "Bienvenido",
          variant: "default",
        });
        onClose();
        onSuccess?.();
      } else {
        toast({
          title: "Error",
          // Mostrar el primer error de validación si existe (común en Laravel)
          description: result.error?.errors ? Object.values(result.error.errors)[0] : (result.error?.message || "Ocurrió un error."),
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error en onSubmit del AuthModal:", err); // Restaurado
      toast({
        title: "Error",
        description: (err as any)?.message || "Error en la operación",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Restaurado
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "login" ? "Iniciar sesión" : "Crear cuenta"}</DialogTitle>
        </DialogHeader>

        {/* Se aplica una altura máxima y scroll solo al contenedor de los campos.
          Se añade pr-4 (padding-right) para dar espacio a la barra de scroll.
        */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          {type === "register" && (
            <div className="space-y-2">
              <Label htmlFor="nombre-modal">Nombre completo</Label>
              <Input id="nombre-modal" name="nombre" placeholder="Nombre completo" value={formData.nombre} onChange={handleChange} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email-modal">Correo electrónico</Label>
            <Input id="email-modal" name="email" type="email" placeholder="Correo electrónico" value={formData.email} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-modal">Contraseña</Label>
            <Input id="password-modal" name="password" type="password" placeholder="Contraseña" value={formData.password} onChange={handleChange} />
          </div>

          {type === "register" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword-modal">Confirmar contraseña</Label>
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
              <div className="space-y-2">
                <Label htmlFor="edad-modal">Edad</Label>
                <Input
                  id="edad-modal"
                  name="edad"
                  type="number"
                  placeholder="Edad"
                  value={formData.edad}
                  onChange={handleChange}
                />
              </div>

              {/* === COMPONENTE SELECT ACTUALIZADO === */}
              <div className="space-y-2">
                <Label htmlFor="objetivo-modal">Objetivo</Label>
                <Select
                  name="objetivo"
                  value={formData.objetivo}
                  onValueChange={handleSelectChange} // Usar el nuevo manejador
                >
                  <SelectTrigger id="objetivo-modal">
                    <SelectValue placeholder="Selecciona tu objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* === VALORES ACTUALIZADOS PARA COINCIDIR CON LARAVEL === */}
                    <SelectItem value="perder_peso">Perder peso</SelectItem>
                    <SelectItem value="mantener">Mantener peso</SelectItem>
                    <SelectItem value="ganar_peso">Ganar peso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* El botón se saca del div scrollable para que quede fijo abajo.
            Pero en esta estructura, lo dejaremos adentro y haremos scroll
            a todo el div "space-y-4" (la corrección es aplicar el scroll).
            
            CORRECCIÓN: Mover el botón fuera del div scrollable.
          */}
        </div>

        {/* El botón ahora es un hermano del div scrollable, no un hijo */}
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
          {isLoading ? "Procesando..." : type === "login" ? "Iniciar sesión" : "Registrarse"}
        </Button>
        
      </DialogContent>
    </Dialog>
  );
}

