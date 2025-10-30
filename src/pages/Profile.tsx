import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Pencil, Save, X, Loader2 } from "lucide-react";
import UserMenu from "@/components/UserMenu";

// Definimos un tipo para los datos del formulario
type ProfileFormData = {
  nombre: string;
  email: string; // El email usualmente se muestra pero no se edita
  objetivo: "perder" | "mantener" | "ganar" | string;
  calorias_objetivo: number;
  edad: number | string;
  peso: number | string;
  altura: number | string;
};

const Profile = () => {
  const { usuario, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    nombre: "",
    email: "",
    objetivo: "mantener",
    calorias_objetivo: 2000,
    edad: "",
    peso: "",
    altura: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Mapea los datos del perfil al estado del formulario (para manejar nulos)
  const mapProfileToForm = (data: any): ProfileFormData => ({
    nombre: data?.nombre ?? usuario?.nombre ?? "",
    email: data?.email ?? usuario?.email ?? "",
    objetivo: data?.objetivo ?? "mantener",
    calorias_objetivo: data?.calorias_objetivo ?? 2000,
    edad: data?.edad ?? "",
    peso: data?.peso ?? "",
    altura: data?.altura ?? "",
  });

  // Cargar datos del perfil al montar el componente
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/");
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        // Primero, obtenemos el ID del usuario
        const meRes = await api.get("/me", true);
        if (!meRes.ok) {
          toast({ title: "Error", description: "No se pudo obtener tu sesión.", variant: "destructive" });
          return;
        }

        const userId = meRes.data?.id ?? usuario?.id;
        if (!userId) {
          toast({ title: "Error", description: "No se encontró tu ID de usuario.", variant: "destructive" });
          return;
        }

        // Luego, obtenemos los detalles completos del usuario
        const userRes = await api.get(`/usuarios/${userId}`, true);
        if (!userRes.ok) {
          toast({ title: "Error", description: "No se pudieron cargar los datos del perfil.", variant: "destructive" });
        } else {
          setProfile(userRes.data);
          setFormData(mapProfileToForm(userRes.data));
        }
      } catch (err) {
        console.error("Error cargando perfil", err);
        toast({ title: "Error", description: "Ocurrió un error inesperado.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [isLoggedIn, navigate, toast, usuario]);

  // Manejador para cerrar sesión (igual que en Dashboard)
  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Sesión cerrada", description: "Hasta la próxima" });
      navigate("/");
    } catch (err) {
      toast({ title: "Error", description: "No se pudo cerrar sesión", variant: "destructive" });
    }
  };

  // Manejador para cambios en los inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejador para el Select de "objetivo"
  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      objetivo: value,
    }));
  };

  // Manejador para guardar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Preparamos los datos para enviar (convertimos a números)
    const dataToSave = {
      ...formData,
      edad: Number(formData.edad) || null,
      peso: Number(formData.peso) || null,
      altura: Number(formData.altura) || null,
      calorias_objetivo: Number(formData.calorias_objetivo) || 2000,
    };
    // No enviamos el email si no se puede cambiar
    // delete dataToSave.email; 

    try {
      const userId = profile?.id ?? usuario?.id;
      // Asumimos que la ruta para actualizar es PUT o PATCH a /usuarios/{id}
      const res = await api.put(`/usuarios/${userId}`, dataToSave, true);

      if (res.ok) {
        toast({ title: "Perfil actualizado", description: "Tus datos se guardaron correctamente." });
        setProfile(res.data); // Actualizamos el perfil local
        setFormData(mapProfileToForm(res.data)); // Sincronizamos el formulario
        setIsEditing(false);
      } else {
        throw new Error(res.data?.message ?? "Error al guardar");
      }
    } catch (err: any) {
      console.error("Error guardando perfil", err);
      toast({ title: "Error al guardar", description: err.message || "No se pudo actualizar el perfil.", variant: "destructive" });
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
      {/* Header Personalizado (igual que en Dashboard) */}
      <div className="bg-white shadow-sm">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Mi Perfil</h2>
            <p className="text-sm text-muted-foreground">Ver y editar tus datos personales</p>
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
                {isEditing ? "Modifica tus datos y guarda los cambios." : "Revisa tu información personal."}
              </CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" size="icon" onClick={() => setIsEditing(true)} disabled={isLoading}>
                <Pencil className="w-4 h-4" />
                <span className="sr-only">Editar</span>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
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
                      disabled // El email generalmente no se puede cambiar
                      readOnly
                    />
                  </div>

                  {/* Objetivo */}
                  <div className="space-y-2">
                    <Label htmlFor="objetivo">Objetivo</Label>
                    <Select
                      name="objetivo"
                      value={formData.objetivo}
                      onValueChange={handleSelectChange}
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

                  {/* Calorías Objetivo */}
                  <div className="space-y-2">
                    <Label htmlFor="calorias_objetivo">Calorías Objetivo</Label>
                    <Input
                      id="calorias_objetivo"
                      name="calorias_objetivo"
                      type="number"
                      value={formData.calorias_objetivo}
                      onChange={handleInputChange}
                      disabled={!isEditing || isSaving}
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
                </div>

                {/* Botones de Guardar/Cancelar (solo en modo edición) */}
                {isEditing && (
                  <CardFooter className="px-0 pt-6 flex justify-end gap-4">
                    <Button variant="ghost" type="button" onClick={handleCancel} disabled={isSaving}>
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

