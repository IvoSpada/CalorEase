import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      objetivo: value,
    }));
  };

  const validateRegister = () => {
    if (!formData.nombre || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({ title: "Error", description: "Todos los campos son obligatorios", variant: "destructive" });
      return false;
    }

    if (!formData.peso || !formData.altura || !formData.edad) {
      toast({ title: "Error", description: "Peso, altura y edad son obligatorios", variant: "destructive" });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
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
        payload = {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          password: formData.password,
          password_confirmation: formData.confirmPassword,
          peso: Number(formData.peso) || null,
          altura: Number(formData.altura) || null,
          edad: Number(formData.edad) || null,
          objetivo: formData.objetivo,
        };
      } else {
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

      const result = await onSubmit(payload);

      // Si el padre no retorna nada (void) consideramos éxito.
      if (!result || result.ok) {
        toast({
          title: type === "login" ? "Inicio de sesión exitoso" : "Registro exitoso",
          description: "Bienvenido",
          variant: "default",
        });
        onClose();
        onSuccess?.();
      } else {
        const message =
          result.error?.errors
            ? // Extrae el primer mensaje de validación si existe
              (Object.values(result.error.errors)[0] as any)
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

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          {type === "register" && (
            <div className="space-y-2">
              <Label htmlFor="nombre-modal">Nombre completo</Label>
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
            <Label htmlFor="email-modal">Correo electrónico</Label>
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
            <Label htmlFor="password-modal">Contraseña</Label>
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

              <div className="space-y-2">
                <Label htmlFor="objetivo-modal">Objetivo</Label>
                <Select name="objetivo" value={formData.objetivo} onValueChange={handleSelectChange}>
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
