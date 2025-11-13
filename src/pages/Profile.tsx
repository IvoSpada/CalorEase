import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // <-- 1. IMPORTAR TEXTAREA
import { Badge } from "@/components/ui/badge"; // <-- 2. IMPORTAR BADGE
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Pencil, Save, X, Loader2 } from "lucide-react";
import UserMenu from "@/components/UserMenu";

// 3. ACTUALIZAR EL TIPO DEL FORMULARIO
type ProfileFormData = {
  nombre: string;
  email: string; // El email usualmente se muestra pero no se edita
  objetivo: "perder_peso" | "mantener" | "ganar_peso" | string;
  edad: number | string;
  peso: number | string;
  altura: number | string;
  genero: "masculino" | "femenino" | "otro" | string;
  patologias: string;
  ejercicio: string;
  // premium no se edita, solo se muestra
};

const Profile = () => {
  const { usuario, isLoggedIn, logout, refreshMe } = useAuth(); // Añadir refreshMe
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  // 4. ACTUALIZAR ESTADO INICIAL DEL FORMULARIO
  const [formData, setFormData] = useState<ProfileFormData>({
    nombre: "",
    email: "",
    objetivo: "mantener",
    edad: "",
    peso: "",
    altura: "",
    genero: "masculino",
    patologias: "",
    ejercicio: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 5. ACTUALIZAR MAPEO DE DATOS
  const mapProfileToForm = (data: any): ProfileFormData => ({
    nombre: data?.nombre ?? usuario?.nombre ?? "",
    email: data?.email ?? usuario?.email ?? "",
    objetivo: data?.objetivo ?? "mantener",
    edad: data?.edad ?? "",
    peso: data?.peso ?? "",
    altura: data?.altura ?? "",
    genero: data?.genero ?? "masculino",
    patologias: data?.patologias ?? "",
    ejercicio: data?.ejercicio ?? "",
  });

  // Mapear el nivel de premium a un texto legible
  const getPremiumStatus = (level: number | string | null) => {
    switch (String(level)) {
      case "1":
        return { text: "Premium", variant: "default" as const };
      case "2":
        return { text: "Premium ++", variant: "default" as const };
      default:
        return { text: "Gratuito", variant: "secondary" as const };
    }
  };
  const premiumStatus = getPremiumStatus(profile?.premium ?? usuario?.premium);

  // Cargar datos del perfil al montar el componente
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/");
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        // El hook useAuth ya tiene al usuario, pero refreshMe asegura datos frescos
        const meRes = await refreshMe();

        if (!meRes.ok || !meRes.data) {
          toast({
            title: "Error",
            description: "No se pudo obtener tu sesión actualizada.",
            variant: "destructive",
          });
          // Usamos el usuario del hook como fallback
          if (usuario) {
            setProfile(usuario);
            setFormData(mapProfileToForm(usuario));
          }
        } else {
          // Usamos los datos frescos de refreshMe (que llama a /me)
          setProfile(meRes.data);
          setFormData(mapProfileToForm(meRes.data));
        }
      } catch (err) {
        console.error("Error cargando perfil", err);
        toast({
          title: "Error",
          description: "Ocurrió un error inesperado.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, navigate, toast]); // Sacamos 'usuario' y 'refreshMe' para evitar bucles

  // Manejador para cerrar sesión
  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Sesión cerrada", description: "Hasta la próxima" });
      navigate("/");
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    }
  };

  // Manejador para cambios en los inputs
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejador para los Selects
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejador para guardar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // 6. PREPARAR DATOS PARA GUARDAR
    const dataToSave = {
      ...formData,
      edad: Number(formData.edad) || null,
      peso: Number(formData.peso) || null,
      altura: Number(formData.altura) || null,
      // patologias y ejercicio ya son strings (o null si están vacíos)
      patologias: formData.patologias || null,
      ejercicio: formData.ejercicio || null,
    };
    // No enviamos el email
    // @ts-ignore
    delete dataToSave.email;

    try {
      const userId = profile?.id ?? usuario?.id;
      const res = await api.put(`/usuarios/${userId}`, dataToSave, true);

      if (res.ok) {
        toast({
          title: "Perfil actualizado",
          description: "Tus datos se guardaron correctamente.",
        });
        setProfile(res.data); // Actualizamos el perfil local
        setFormData(mapProfileToForm(res.data)); // Sincronizamos el formulario
        await refreshMe(); // Actualizamos el usuario global en useAuth
        setIsEditing(false);
      } else {
        throw new Error(res.data?.message ?? "Error al guardar");
      }
    } catch (err: any) {
      console.error("Error guardando perfil", err);
      toast({
        title: "Error al guardar",
        description: err.message || "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Manejador para cancelar la edición
  const handleCancel = () => {
    setFormData(mapProfileToForm(profile)); // Revertir a los datos originales
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Personalizado */}
      <div className="bg-white shadow-sm">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Mi Perfil</h2>
            <p className="text-sm text-muted-foreground">
              Ver y editar tus datos personales
            </p>
          </div>
          <div className="flex items-center gap-4">
            {profile?.nombre || usuario?.nombre ? (
              <UserMenu profile={profile ?? usuario} onLogout={handleLogout} />
            ) : (
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Tu Perfil</h1>

        <Card className="max-w-3xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                {isEditing
                  ? "Modifica tus datos y guarda los cambios."
                  : "Revisa tu información personal."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={premiumStatus.variant}>
                {premiumStatus.text}
              </Badge>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                >
                  <Pencil className="w-4 h-4" />
                  <span className="sr-only">Editar</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* 7. GRILLA ACTUALIZADA CON TODOS LOS CAMPOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      disabled={!isEditing || isSaving}
                    />
                  </div>

                  {/* Email (deshabilitado) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled
                      readOnly
                    />
                  </div>

                  {/* Edad */}
                  <div className="space-y-2">
                    <Label htmlFor="edad">Edad</Label>
                    <Input
                      id="edad"
                      name="edad"
                      type="number"
                      value={formData.edad}
                      onChange={handleInputChange}
                      disabled={!isEditing || isSaving}
                    />
                  </div>

                  {/* Género */}
                  <div className="space-y-2">
                    <Label htmlFor="genero">Género</Label>
                    <Select
                      name="genero"
                      value={formData.genero}
                      onValueChange={(v) => handleSelectChange("genero", v)}
                      disabled={!isEditing || isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Peso */}
                  <div className="space-y-2">
                    <Label htmlFor="peso">Peso (kg)</Label>
                    <Input
                      id="peso"
                      name="peso"
                      type="number"
                      step="0.1"
                      value={formData.peso}
                      onChange={handleInputChange}
                      disabled={!isEditing || isSaving}
                    />
                  </div>

                  {/* Altura */}
                  <div className="space-y-2">
                    <Label htmlFor="altura">Altura (cm)</Label>
                    <Input
                      id="altura"
                      name="altura"
                      type="number"
                      value={formData.altura}
                      onChange={handleInputChange}
                      disabled={!isEditing || isSaving}
                    />
                  </div>

                  {/* Objetivo */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="objetivo">Objetivo</Label>
                    <Select
                      name="objetivo"
                      value={formData.objetivo}
                      onValueChange={(v) => handleSelectChange("objetivo", v)}
                      disabled={!isEditing || isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu objetivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perder_peso">Perder peso</SelectItem>
                        <SelectItem value="mantener">Mantener peso</SelectItem>
                        <SelectItem value="ganar_peso">Ganar peso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Patologías */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="patologias">
                      Patologías (opcional, ej. diabetes, hipertensión)
                    </Label>
                    <Textarea
                      id="patologias"
                      name="patologias"
                      value={formData.patologias}
                      onChange={handleInputChange}
                      disabled={!isEditing || isSaving}
                      placeholder="Describe alergias o condiciones relevantes..."
                    />
                  </div>

                  {/* Ejercicio */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="ejercicio">
                      Nivel de Ejercicio (opcional)
                    </Label>
                    <Textarea
                      id="ejercicio"
                      name="ejercicio"
                      value={formData.ejercicio}
                      onChange={handleInputChange}
                      disabled={!isEditing || isSaving}
                      placeholder="Ej. 3 veces por semana, sedentario, etc."
                    />
                  </div>
                </div>

                {/* Botones de Guardar/Cancelar (solo en modo edición) */}
                {isEditing && (
                  <CardFooter className="px-0 pt-6 flex justify-end gap-4">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Guardar Cambios
                    </Button>
                  </CardFooter>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;