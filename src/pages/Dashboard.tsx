import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { AddFoodModal } from "@/components/AddFoodModal";
import { GenerateDietModal } from "@/components/GenerateDietModal";
import { AdjustMealModal } from "@/components/AdjustMealModal";
import { ViewDietModal } from "@/components/ViewDietModal";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  getDietas,
  getComidasDietaByDieta,
  updateDieta,
  updateComidaDieta,
} from "@/services/dietService";
import { getComidasUsuario, createComidaUsuario } from "@/services/foodService";
import { adjustDietWithIA } from "@/services/iaService";
import {
  Target,
  Plus,
  CheckCircle,
  Calendar,
  Utensils,
  Flag,
  Check,
  X,
  Loader2,
} from "lucide-react";
import UserMenu from "@/components/UserMenu";
import type { Dieta, ComidaDieta, ComidaUsuario, Profile } from "@/types";

// Helper para obtener la fecha de HOY en formato YYYY-MM-DD
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0"); // +1 porque Enero es 0
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const { usuario, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, dismiss } = useToast();

  // Estados de la app
  const [isLoading, setIsLoading] = useState(true);
  const [dietas, setDietas] = useState<Dieta[]>([]);
  const [activeDiet, setActiveDiet] = useState<Dieta | null>(null);
  const [comidasPlanificadas, setComidasPlanificadas] = useState<ComidaDieta[]>([]);
  const [comidasConsumidas, setComidasConsumidas] = useState<ComidaUsuario[]>([]);

  // Estados de Modales
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [showGenerateDietModal, setShowGenerateDietModal] = useState(false);
  const [showViewDietModal, setShowViewDietModal] = useState(false);
  const [showAdjustMealModal, setShowAdjustMealModal] = useState(false);
  const [mealToAdjust, setMealToAdjust] = useState<ComidaDieta | null>(null);

  /**
   * Carga todos los datos del dashboard desde cero
   */
  const loadData = useCallback(async () => {
    if (!usuario?.id) return;

    setIsLoading(true);
    try {
      // 1. Obtener perfil
      const meRes = await api.get("/me", true);
      if (meRes.ok) {
        setProfile(meRes.data);
      } else {
        throw new Error("No se pudo obtener el perfil del usuario");
      }

      // 2. Obtener dietas
      const dietasRes = await getDietas(usuario.id);
      let currentActiveDiet: Dieta | null = null;
      if (dietasRes.ok && Array.isArray(dietasRes.data)) {
        setDietas(dietasRes.data);
        currentActiveDiet =
          dietasRes.data.find((d) => d.estado && d.estado.trim().toLowerCase() === "activa") ??
          null;
        setActiveDiet(currentActiveDiet);
      } else {
        setDietas([]);
        setActiveDiet(null);
      }

      // 3. Obtener comidas planificadas (solo si hay dieta activa)
      if (currentActiveDiet) {
        const comidasPlanRes = await getComidasDietaByDieta(currentActiveDiet.id);
        if (comidasPlanRes.ok && Array.isArray(comidasPlanRes.data)) {
          setComidasPlanificadas(comidasPlanRes.data);
        } else {
          setComidasPlanificadas([]);
        }
      } else {
        setComidasPlanificadas([]);
      }

      // 4. Obtener comidas ya consumidas
      const comidasConsRes = await getComidasUsuario(usuario.id);
      if (comidasConsRes.ok && Array.isArray(comidasConsRes.data)) {
        setComidasConsumidas(comidasConsRes.data);
      } else {
        setComidasConsumidas([]);
      }
    } catch (err) {
      console.error("Error cargando datos del dashboard", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [usuario?.id]); // evitamos re-crear la función en cada render

  // Carga inicial y recarga cuando cambia el login
  useEffect(() => {
    if (isLoggedIn && usuario?.id) {
      loadData();
    } else if (!isLoggedIn) {
      // Si no está logueado, limpiar todo
      setProfile(null);
      setDietas([]);
      setActiveDiet(null);
      setComidasPlanificadas([]);
      setComidasConsumidas([]);
      setIsLoading(true);
    }
  }, [isLoggedIn, usuario?.id, loadData]);

  // --- LÓGICA DE FILTRADO DE FECHA ---

  const todayStr = getTodayDateString();

  const todaysComidas = useMemo(() => {
    if (!activeDiet || !comidasPlanificadas) return [];
    return comidasPlanificadas.filter((c) => c.fecha && c.fecha.startsWith(todayStr));
  }, [activeDiet, comidasPlanificadas, todayStr]);

  const todaysComidasConsumidas = useMemo(() => {
    if (!comidasConsumidas) return [];
    return comidasConsumidas.filter((c) => c.fecha && c.fecha.startsWith(todayStr));
  }, [comidasConsumidas, todayStr]);

  // Calcula los días transcurridos de la dieta activa
  const diasTranscurridos = useMemo(() => {
    if (!activeDiet?.fecha_inicio) return 0;
    const inicio = new Date(activeDiet.fecha_inicio).getTime();
    const hoy = new Date().getTime();
    const diff = Math.max(0, hoy - inicio);
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [activeDiet]);

  // -- Acciones --

  const handleLogout = useCallback(async () => {
    const loadingToast = toast({
      title: "Cerrando sesión...",
      description: <Loader2 className="animate-spin" />,
      duration: Infinity,
    });
    try {
      await logout(); // Llama a la función de logout del hook

      // --- LIMPIEZA DE ESTADO ---
      setProfile(null);
      setDietas([]);
      setActiveDiet(null);
      setComidasPlanificadas([]);
      setComidasConsumidas([]);
      setIsLoading(true);

      dismiss(loadingToast.id);
      toast({ title: "Sesión cerrada", description: "Hasta la próxima" });
      navigate("/"); // Redirige al login
    } catch (err) {
      dismiss(loadingToast.id);
      toast({ title: "Error", description: "No se pudo cerrar sesión", variant: "destructive" });
    }
  }, [logout, navigate, toast, dismiss]);

  // Marcar una comida como completada
  const handleMarkAsComplete = useCallback(
    async (comida: ComidaDieta) => {
      if (!usuario?.id) return;

      try {
        const payload = {
          usuario_id: usuario.id,
          comida_dieta_id: comida.id,
          fecha: getTodayDateString(),
          opcion: "planificada",
          descripcion: comida.descripcion,
          calorias: comida.calorias,
          proteinas: comida.proteinas,
          carbohidratos: comida.carbohidratos,
          grasas: comida.grasas,
        };

        const res = await createComidaUsuario(payload);
        if (!res.ok) {
          console.error("Error al crear ComidaUsuario:", res.data);
          throw new Error(res.data?.message || "No se pudo guardar la comida");
        }

        toast({ title: "¡Comida Completada!", description: comida.descripcion, variant: "default" });
        // Recargar solo las comidas consumidas para eficiencia
        const comidasConsRes = await getComidasUsuario(usuario.id);
        if (comidasConsRes.ok && Array.isArray(comidasConsRes.data)) {
          setComidasConsumidas(comidasConsRes.data);
        }
      } catch (err) {
        console.error("Error marcando comida como completada", err);
        toast({
          title: "Error",
          description: (err as Error).message || "No se pudo marcar la comida",
          variant: "destructive",
        });
      }
    },
    [usuario?.id, toast]
  );

  // Abrir modal para comida "alternativa"
  const handleMarkAsDifferent = useCallback((comida: ComidaDieta) => {
    setMealToAdjust(comida);
    setShowAdjustMealModal(true);
  }, []);

  // Activar una nueva dieta
  const handleActivateDiet = useCallback(
    async (dietaId: number) => {
      const loadingToast = toast({
        title: "Cambiando de dieta...",
        description: <Loader2 className="animate-spin" />,
        duration: Infinity,
      });
      try {
        // 1. Poner la nueva como "activa"
        const res = await updateDieta(dietaId, { estado: "activa" });
        if (!res.ok) throw new Error("No se pudo activar la nueva dieta");

        // 2. (Opcional) Poner todas las demás como "finalizada"
        const otrasDietas = dietas.filter((d) => d.id !== dietaId && d.estado === "activa");
        for (const dieta of otrasDietas) {
          await updateDieta(dieta.id, { estado: "finalizada" });
        }

        // 3. Recargar todos los datos
        await loadData();
        dismiss(loadingToast.id);
      } catch (err) {
        console.error("Error activando dieta", err);
        dismiss(loadingToast.id);
        toast({
          title: "Error",
          description: (err as Error).message || "No se pudo cambiar de dieta",
          variant: "destructive",
        });
      }
    },
    [dietas, loadData, toast, dismiss]
  );

  // Acciones de Modales
  const openAddFood = useCallback(() => setShowAddFoodModal(true), []);
  const openGenerateDiet = useCallback(() => setShowGenerateDietModal(true), []);
  const openViewDiet = useCallback(() => setShowViewDietModal(true), []);

  // --- Renderizado ---

  // Loading
  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </div>
    );
  }

  // Dashboard principal
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">Resumen personal y comidas</p>
          </div>
          <div className="flex items-center gap-4">
            {profile ? (
              <UserMenu profile={profile} onLogout={handleLogout} />
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                Iniciar Sesión
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Tu Resumen, <span className="text-primary">{profile?.nombre ?? "Usuario"}</span>
        </h1>

        {/* Resumen Diario */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold capitalize">
                {profile?.objetivo?.replace("_", " ") ?? "Sin objetivo"}
              </div>
              <div className="text-sm text-muted-foreground">Tu Objetivo</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Utensils className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {todaysComidasConsumidas.length} / {todaysComidas.length}
              </div>
              <div className="text-sm text-muted-foreground">Comidas de Hoy</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">Día {diasTranscurridos}</div>
              <div className="text-sm text-muted-foreground">de tu Dieta Actual</div>
            </CardContent>
          </Card>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button variant="hero" size="lg" onClick={openAddFood} disabled={!activeDiet}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Comida
          </Button>
          <Button variant="secondary" size="lg" onClick={openGenerateDiet}>
            <Plus className="w-4 h-4 mr-2" />
            Generar Nueva Dieta
          </Button>
          <Button variant="outline" size="lg" onClick={openViewDiet} disabled={!activeDiet}>
            <Calendar className="w-4 h-4 mr-2" />
            Ver Dieta Actual
          </Button>
          {!activeDiet && (
            <p className="text-red-500 self-center">
              Debes generar y activar una dieta para agregar comidas o ver tu plan.
            </p>
          )}
        </div>

        {/* Comidas de Hoy */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Comidas Planificadas para Hoy ({getTodayDateString()})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : todaysComidas.length > 0 ? (
              <div className="space-y-4">
                {todaysComidas.map((meal) => {
                  const isCompleted = todaysComidasConsumidas.some((c) => c.comida_dieta_id === meal.id);
                  return (
                    <div
                      key={meal.id}
                      className={`flex flex-col sm:flex-row justify-between sm:items-center p-4 border rounded-lg ${
                        isCompleted ? "bg-green-50 border-green-200" : "bg-card"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-lg">
                          {isCompleted && <CheckCircle className="w-5 h-5 mr-2 inline text-green-600" />}
                          {meal.tipo}
                        </div>
                        <p className="text-muted-foreground ml-7 sm:ml-0">{meal.descripcion}</p>

                        <p className="text-sm text-blue-600 font-medium ml-7 sm:ml-0">
                          {meal.calorias} kcal
                        </p>
                      </div>
                      <div className="flex gap-2 mt-3 sm:mt-0 self-end sm:self-center">
                        {isCompleted ? (
                          <div className="flex items-center gap-2 p-2 rounded-md bg-green-100 text-green-700 font-medium">
                            <Check /> Completada
                          </div>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleMarkAsDifferent(meal)}>
                              <Flag className="w-4 h-4 mr-1" /> Comí Algo Diferente
                            </Button>
                            <Button variant="default" size="sm" onClick={() => handleMarkAsComplete(meal)}>
                              <Check className="w-4 h-4 mr-1" /> Marcar como Completada
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>
                {activeDiet ? "No hay comidas planificadas para hoy." : "No hay una dieta activa seleccionada."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Mis Dietas */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Dietas</CardTitle>
          </CardHeader>
          <CardContent>
            {dietas.length > 0 ? (
              <div className="space-y-4">
                {dietas.map((dieta) => (
                  <div
                    key={dieta.id}
                    className="flex flex-col sm:flex-row justify-between sm:items-center p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-semibold text-lg">
                        Dieta del {dieta.fecha_inicio} al {dieta.fecha_fin}
                      </div>
                      <p className="text-muted-foreground">
                        Origen: {dieta.origen} | Estado:{" "}
                        <span className={`font-medium ${dieta.estado === "activa" ? "text-green-600" : "text-gray-500"}`}>
                          {dieta.estado}
                        </span>
                      </p>
                    </div>
                    {dieta.estado !== "activa" ? (
                      <Button variant="outline" size="sm" onClick={() => handleActivateDiet(dieta.id)} className="mt-3 sm:mt-0">
                        Activar esta dieta
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-green-100 text-green-700 font-medium mt-3 sm:mt-0">
                        <Check /> Activa
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No has generado ninguna dieta todavía.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Footer />

      {/* Modales */}
      {showGenerateDietModal && (
        <GenerateDietModal
          isOpen={showGenerateDietModal}
          onClose={() => setShowGenerateDietModal(false)}
          onDietaCreada={() => {
            setShowGenerateDietModal(false);
            loadData(); // Recargar todo
          }}
        />
      )}

      {showAddFoodModal && (
        <AddFoodModal
          isOpen={showAddFoodModal}
          onClose={() => setShowAddFoodModal(false)}
          onSaved={() => {
            setShowAddFoodModal(false);
            loadData(); // Recargar todo
          }}
        />
      )}

      {showViewDietModal && activeDiet && (
        <ViewDietModal
          isOpen={showViewDietModal}
          onClose={() => setShowViewDietModal(false)}
          dieta={activeDiet}
          comidas={comidasPlanificadas}
        />
      )}

      {showAdjustMealModal && mealToAdjust && profile && (
        <AdjustMealModal
          isOpen={showAdjustMealModal}
          onClose={() => setShowAdjustMealModal(false)}
          comidaPlanificada={mealToAdjust}
          profile={profile}
          onComidaAlternativaGuardada={async (comidaAlternativa) => {
            // 1. Guardar la comida alternativa (opcion: 'alternativa')
            try {
              const payload = {
                ...comidaAlternativa,
                usuario_id: usuario!.id,
                comida_dieta_id: mealToAdjust.id,
                fecha: getTodayDateString(),
                opcion: "alternativa",
              };
              const res = await createComidaUsuario(payload);
              if (!res.ok) throw new Error(res.data?.message || "No se pudo guardar la comida alternativa");

              toast({ title: "Comida alternativa guardada" });
              setShowAdjustMealModal(false);

              // 2. Llamar a la IA para re-ajustar el plan
              try {
                const toastAjuste = toast({
                  title: "Ajustando dieta con IA...",
                  description: <Loader2 className="animate-spin" />,
                  duration: Infinity,
                });

                // Filtro: Comidas futuras (mayores a hoyStr)
                const comidasRestantes = comidasPlanificadas.filter((c) => c.fecha && c.fecha > todayStr);

                if (comidasRestantes.length === 0) {
                  dismiss(toastAjuste.id);
                  toast({ title: "No hay comidas futuras", description: "No hay nada que re-ajustar." });
                  loadData(); // Recargar datos de hoy
                  return;
                }

                const resIA = await adjustDietWithIA(comidaAlternativa, comidasRestantes, profile);

                if (!resIA.ok || !Array.isArray(resIA.data)) {
                  dismiss(toastAjuste.id);
                  toast({
                    title: "Error de IA",
                    description: resIA.error?.message || "La IA no devolvió un plan válido.",
                    variant: "destructive",
                    duration: 5000,
                  });
                } else {
                  // Bucle para actualizar comidas en Laravel
                  const comidasAjustadas: ComidaDieta[] = resIA.data;
                  toast({
                    title: `Actualizando ${comidasAjustadas.length} comidas...`,
                    description: <Loader2 className="animate-spin" />,
                    duration: Infinity,
                    id: toastAjuste.id,
                  });

                  let errores = 0;
                  for (const comida of comidasAjustadas) {
                    const payloadUpdate = {
                      descripcion: comida.descripcion,
                      calorias: comida.calorias,
                      proteinas: comida.proteinas,
                      carbohidratos: comida.carbohidratos,
                      grasas: comida.grasas,
                    };
                    const resUpdate = await updateComidaDieta(comida.id, payloadUpdate);
                    if (!resUpdate.ok) {
                      console.error(`Error actualizando comida ${comida.id}`, resUpdate.data);
                      errores++;
                    }
                  }

                  dismiss(toastAjuste.id);
                  if (errores > 0) {
                    toast({
                      title: "Plan ajustado con errores",
                      description: `La IA funcionó, pero ${errores} comidas no se pudieron guardar.`,
                      variant: "destructive",
                    });
                  } else {
                    toast({ title: "¡Dieta Re-ajustada!", description: "La IA ha actualizado tus próximos días." });
                  }
                }
              } catch (err) {
                toast({ title: "Error de IA", description: (err as Error).message, variant: "destructive" });
              }

              // 3. Recargar datos
              loadData();
            } catch (err) {
              toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
            }
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;