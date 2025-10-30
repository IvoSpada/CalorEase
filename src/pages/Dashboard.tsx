import { useEffect, useState } from "react";
// Rutas de importación corregidas a relativas (../)
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Footer } from "../components/Footer";
import ChatbotModal from "../components/ChatbotModal";
import { AddFoodModal } from "../components/AddFoodModal";
import { GenerateDietModal } from "../components/GenerateDietModal"; // MODIFICADO
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import { getComidasDietaByDieta } from "../services/dietService"; // IMPORTADO
import { Target, Plus, CheckCircle, Calendar, Wand2 } from "lucide-react"; // Importar Wand2
import UserMenu from "../components/UserMenu";
import type { Dieta, ComidaDieta } from "../types"; // Importar tipos

type Meal = { id: number | string; tipo?: string; descripcion?: string; calorias?: number; [k: string]: any };

const Dashboard = () => {
  console.log("Dashboard component file loaded");

  const [showChatbotModal, setShowChatbotModal] = useState(false);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [showGenerateDietModal, setShowGenerateDietModal] = useState(false); // MODIFICADO
  const [caloriesData, setCaloriesData] = useState<{ day: string; calories: number }[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [recommendedCalories, setRecommendedCalories] = useState(14000);
  const [macros, setMacros] = useState({ sugars: 0, carbs: 0, fats: 0 });
  const [dietText, setDietText] = useState("Cargando dieta...");
  
  // MODIFICADO: El estado de plannedMeals ahora es de tipo ComidaDieta
  const [dailySummary, setDailySummary] = useState<{ targetCalories: number; consumedCalories: number; plannedMeals: ComidaDieta[] }>({
    targetCalories: 2000,
    consumedCalories: 0,
    plannedMeals: [], // Inicialmente vacío
  });

  const [profile, setProfile] = useState<any>(null);
  const [comidas, setComidas] = useState<any[]>([]);
  const [dietas, setDietas] = useState<Dieta[]>([]);

  const { usuario, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getCaloriesFrom = (c: any) => (c ? Number(c.calorias ?? c.kcal ?? c.calories ?? c.energy ?? 0) || 0 : 0);

  // Función para obtener la fecha de hoy en YYYY-MM-DD
  const getTodayString = () => new Date().toISOString().split("T")[0];

  // Función para recargar los datos
  const loadData = async () => {
    if (!isLoggedIn || !usuario) {
       if (!isLoggedIn) navigate("/");
       return;
    }

    try {
      const meRes = await api.get("/me", true);
      if (!meRes.ok) {
        toast({ title: "Error", description: "No se pudo obtener /me", variant: "destructive" });
        return;
      }
      setProfile(meRes.data);

      const userId = meRes.data?.id ?? usuario?.id;
      if (!userId) {
        console.warn("No se encontró id de usuario en /me ni en useAuth.usuario");
        return;
      }

      // 1. Obtener datos del usuario (que incluye sus dietas)
      const userRes = await api.get(`/usuarios/${userId}`, true);
      if (!userRes.ok) {
        console.warn("Fallo /usuarios/:id", userRes);
        return; // Salir si falla
      }
      
      const userData = userRes.data ?? {};
      const _comidas = userData.comidas_usuario ?? userData.comidas ?? []; // Comidas consumidas
      const _dietas = userData.dietas ?? []; // Dietas del usuario

      setComidas(Array.isArray(_comidas) ? _comidas : []);
      setDietas(Array.isArray(_dietas) ? _dietas : []);

      // 2. Encontrar la dieta activa
      const activeDiet = (_dietas || []).find((d: Dieta) => d.estado === "activa") ?? (_dietas && _dietas[0]);

      if (!activeDiet) {
          setDietText("No hay dieta activa. ¡Crea una!");
          setDailySummary(prev => ({ ...prev, plannedMeals: [] }));
          return; // No hay dieta, no hay nada más que cargar
      }

      setDietText(`Dieta activa: ${activeDiet.id} (IA)`);

      // 3. Obtener las comidas planificadas (ComidaDieta) para esa dieta
      // MODIFICADO: Hacemos una llamada separada para obtener las comidas de la dieta
      const comidasDietaRes = await getComidasDietaByDieta(activeDiet.id);
      let allPlannedMeals: ComidaDieta[] = [];

      if (comidasDietaRes.ok && Array.isArray(comidasDietaRes.data)) {
        allPlannedMeals = comidasDietaRes.data;
      } else {
        console.warn("No se pudieron cargar las comidas para la dieta activa");
      }

      // 4. Filtrar comidas planificadas para HOY
      const today = getTodayString();
      const todaysPlannedMeals = allPlannedMeals.filter(meal => meal.fecha === today);
      
      // 5. Filtrar comidas ya consumidas (ComidaUsuario) de HOY
      const todaysConsumedMeals = (_comidas || []).filter((c: any) => {
        const fecha = c.fecha_consumo ?? c.fecha ?? c.created_at;
        return String(fecha).startsWith(today);
      });

      // 6. Calcular calorías consumidas
      const consumedCalories = todaysConsumedMeals.reduce((s: number, c: any) => {
          // Si la comida consumida está vinculada, usamos las calorías de la comida planificada
          const linkedMeal = allPlannedMeals.find(m => m.id === c.comida_dieta_id);
          if (linkedMeal) {
            return s + (Number(linkedMeal.calorias) * (Number(c.cantidad) || 1));
          }
          // Si es una comida libre (no debería pasar con la lógica nueva, pero por si acaso)
          return s + getCaloriesFrom(c);
      }, 0);
      
      // 7. Determinar qué comidas planificadas de hoy QUEDAN PENDIENTES
      const consumedMealIds = new Set(todaysConsumedMeals.map((c: any) => c.comida_dieta_id));
      const pendingMeals = todaysPlannedMeals.filter(meal => !consumedMealIds.has(meal.id));

      setDailySummary(prev => ({ 
        ...prev, 
        consumedCalories: consumedCalories, 
        plannedMeals: pendingMeals // El dashboard ahora solo muestra comidas PENDIENTES
      }));

      // ... (lógica del gráfico de calorías sin cambios)
      if (_comidas && _comidas.length > 0) {
        const daysMap: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toLocaleDateString("es-AR", { weekday: "short" });
          daysMap[key] = 0;
        }
        todaysConsumedMeals.forEach((c: any) => { // Solo comidas consumidas
          const fecha = c.fecha_consumo ?? c.fecha ?? c.created_at;
          const d = fecha ? new Date(fecha) : null;
          const key = d ? d.toLocaleDateString("es-AR", { weekday: "short" }) : "Otro";
          if (daysMap[key] === undefined) daysMap[key] = 0;
          daysMap[key] += getCaloriesFrom(c);
        });
        const chart = Object.keys(daysMap).map((k) => ({ day: k, calories: daysMap[k] }));
        setCaloriesData(chart);
        setTotalCalories(chart.reduce((s, x) => s + x.calories, 0));
        setMacros({ sugars: 100, carbs: 600, fats: 200 }); // (Esto sigue siendo mock)
      } else {
         const mock = [
            { day: "Lun", calories: 0 }, { day: "Mar", calories: 0 }, { day: "Mié", calories: 0 },
            { day: "Jue", calories: 0 }, { day: "Vie", calories: 0 }, { day: "Sáb", calories: 0 }, { day: "Dom", calories: 0 },
          ];
          setCaloriesData(mock);
          setTotalCalories(0);
      }

    } catch (err) {
      console.error("Error cargando datos del dashboard", err);
      toast({ title: "Error", description: "No se pudieron cargar datos", variant: "destructive" });
    }
  };

  useEffect(() => {
    console.log("Dashboard useEffect mount - isLoggedIn:", isLoggedIn);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, navigate, usuario]);

  const handleLogout = async () => {
    try {
      const res = await logout();
      if (res && typeof res === "object" && "ok" in res && !res.ok) {
        toast({
          title: "Sesión cerrada (local)",
          description: "No se pudo invalidar token en servidor. Sesión local eliminada.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Sesión cerrada", description: "Hasta la próxima" });
      }
      navigate("/");
    } catch (err) {
      toast({ title: "Error", description: "No se pudo cerrar sesión", variant: "destructive" });
    }
  };

  const openChatbot = () => setShowChatbotModal(true);
  const openAddFood = () => setShowAddFoodModal(true);
  const openGenerateDiet = () => setShowGenerateDietModal(true); // MODIFICADO

  const markMealConsumed = async (mealId: number | string) => {
    // Esta función se llama desde AddFoodModal ahora, pero la dejamos
    // por si se usa en otro lado.
     try {
      // payload simple, la lógica de 'cantidad' está en AddFoodModal
      const body = { 
        usuario_id: profile?.id ?? usuario?.id, 
        comida_dieta_id: mealId,
        fecha_consumo: new Date().toISOString().slice(0, 19).replace("T", " "),
        cantidad: 1
      };
      const resp = await api.post("/comidas-usuarios", body, true); // Usa el endpoint correcto
      
      if (!resp.ok) {
         const errorData = resp.data as any;
         const errorMsg = errorData?.errors ? Object.values(errorData.errors).flat().join(' ') : (resp.error?.message || "Error desconocido");
         throw new Error(errorMsg);
      }

      toast({ title: "Comida marcada", description: "Comida planificada marcada como consumida." });
      // Recargar datos para que la comida desaparezca de "pendientes"
      loadData(); 
      
    } catch (err: any) {
      console.error("Error marcando comida", err);
      toast({ title: "Error", description: err.message || "No se pudo marcar la comida", variant: "destructive" });
    }
  };

  const viewWeeklyDiet = () => navigate("/dietas");

  const progressPercent = Math.round((dailySummary.consumedCalories / Math.max(1, dailySummary.targetCalories)) * 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white shadow-sm">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">Resumen personal y comidas</p>
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

      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Dashboard de Nutrición</h1>

        {/* Resumen Diario */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{dailySummary.targetCalories} kcal</div>
              <div className="text-sm text-muted-foreground">Meta Diaria</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{dailySummary.consumedCalories} kcal</div>
              <div className="text-sm text-muted-foreground">Consumidas Hoy</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold">{progressPercent}%</div>
              <div className="text-sm text-muted-foreground">Progreso</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MODIFICADO: Comidas PENDIENTES para Hoy */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Comidas Pendientes para Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            {dailySummary.plannedMeals && dailySummary.plannedMeals.length > 0 ? (
              <div className="space-y-4">
                {dailySummary.plannedMeals.map((meal) => (
                  <div key={meal.id} className="flex justify-between items-center p-4 border rounded">
                    <div>
                      <div className="font-semibold capitalize">
                        {meal.tipo}: <span className="font-normal">{meal.descripcion}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {meal.calorias ?? 0} kcal • 
                        P: {meal.proteinas}g • 
                        C: {meal.carbohidratos}g • 
                        G: {meal.grasas}g
                      </div>
                    </div>
                    {/* Botón para marcar como consumida directamente */}
                    <Button variant="outline" size="sm" onClick={() => markMealConsumed(meal.id)}>
                      Marcar Consumida
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p>¡Felicidades! No tienes más comidas pendientes por hoy.</p>
            )}
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button variant="hero" size="lg" onClick={openAddFood}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar Comida (de Dieta)
          </Button>
          <Button variant="outline" size="lg" onClick={viewWeeklyDiet}>
            <Calendar className="w-4 h-4 mr-2" />
            Ver Dieta Semanal
          </Button>
          
          {/* BOTÓN PARA NUEVO MODAL DE DIETA */}
          <Button variant="outline" size="lg" onClick={openGenerateDiet}>
            <Wand2 className="w-4 h-4 mr-2" />
            Generar Nueva Dieta con IA
          </Button>
        </div>

        {/* ... resto igual (gráfico, macros, dieta) */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calorías Consumidas (Últimos 7 Días)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={caloriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="calories" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Calorías Totales de la Semana:</span>
                    <span className="font-bold">{totalCalories} kcal</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Calorías Recomendadas de la Semana:</span>
                    <span className="font-bold">{recommendedCalories} kcal</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Macros Totales de la Semana (Mock)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Azúcares:</span>
                    <span className="font-bold">{macros.sugars} g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carbohidratos:</span>
                    <span className="font-bold">{macros.carbs} g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grasas:</span>
                    <span className="font-bold">{macros.fats} g</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Button variant="hero" size="lg" onClick={openChatbot}>
              Abrir Chatbot (General)
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>Tu Dieta Recomendada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{dietText}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />

      {/* MODALES */}
      <ChatbotModal isOpen={showChatbotModal} onClose={() => setShowChatbotModal(false)} />
      
      <AddFoodModal
        isOpen={showAddFoodModal}
        onClose={() => setShowAddFoodModal(false)}
        onSaved={(food: any) => {
          // Recargar datos para que el dashboard se actualice
          loadData(); 
          toast({ title: "Comida agregada", description: "Comida registrada exitosamente." });
        }}
      />
      
      {/* RENDERIZAR NUEVO MODAL DE DIETA */}
      <GenerateDietModal 
        isOpen={showGenerateDietModal}
        onClose={() => setShowGenerateDietModal(false)}
        onDietaCreada={(dieta: Dieta) => {
          // Recargar los datos del dashboard cuando se crea una dieta
          loadData(); 
          toast({ title: "Dieta Creada", description: `Tu nueva dieta (ID: ${dieta.id}) ha sido registrada.` });
        }}
      />
    </div>
  );
};

export default Dashboard;