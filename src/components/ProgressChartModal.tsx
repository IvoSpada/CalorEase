import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Dieta, ComidaDieta, ComidaUsuario } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // <-- RUTA CORREGIDA

// Definimos la interfaz para los datos del gráfico
interface ChartData {
  fecha: string;
  // Planificadas
  plan_calorias: number;
  plan_proteinas: number;
  plan_carbohidratos: number;
  plan_grasas: number;
  // Ingeridas
  ing_calorias: number;
  ing_proteinas: number;
  ing_carbohidratos: number;
  ing_grasas: number;
}

interface ProgressChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  dieta: Dieta | null;
  comidasPlanificadas: ComidaDieta[];
  comidasConsumidas: ComidaUsuario[];
}

/**
 * Hook para procesar los datos de la dieta y prepararlos para los gráficos
 */
const useChartData = (
  dieta: Dieta | null,
  comidasPlanificadas: ComidaDieta[],
  comidasConsumidas: ComidaUsuario[]
) => {
  return useMemo(() => {
    if (!dieta || comidasPlanificadas.length === 0) return [];

    // 1. Crear un mapa para agregar macros por fecha
    const dataMap = new Map<string, ChartData>();

    // 2. Procesar comidas PLANIFICADAS
    for (const comida of comidasPlanificadas) {
      const fecha = comida.fecha;
      if (!dataMap.has(fecha)) {
        dataMap.set(fecha, {
          fecha,
          plan_calorias: 0, plan_proteinas: 0, plan_carbohidratos: 0, plan_grasas: 0,
          ing_calorias: 0, ing_proteinas: 0, ing_carbohidratos: 0, ing_grasas: 0,
        });
      }
      const dayData = dataMap.get(fecha)!;
      dayData.plan_calorias += Number(comida.calorias) || 0;
      dayData.plan_proteinas += Number(comida.proteinas) || 0;
      dayData.plan_carbohidratos += Number(comida.carbohidratos) || 0;
      dayData.plan_grasas += Number(comida.grasas) || 0;
    }

    // 3. Procesar comidas CONSUMIDAS (incluye planificadas, alternativas y adicionales)
    for (const comida of comidasConsumidas) {
      const fecha = comida.fecha;
      // Solo nos importan las comidas consumidas dentro del plan
      if (dataMap.has(fecha)) {
        const dayData = dataMap.get(fecha)!;
        
        // Si es "alternativa", la contamos como ingerida PERO el plan ya fue actualizado (según la lógica del dashboard)
        // Si es "planificada", la contamos como ingerida.
        // Si es "adicional" (comida_dieta_id === null), la sumamos a ingeridas.
        
        dayData.ing_calorias += Number(comida.calorias) || 0;
        dayData.ing_proteinas += Number(comida.proteinas) || 0;
        dayData.ing_carbohidratos += Number(comida.carbohidratos) || 0;
        dayData.ing_grasas += Number(comida.grasas) || 0;
      }
    }

    // 4. Convertir mapa a array y ordenar por fecha
    return Array.from(dataMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));

  }, [dieta, comidasPlanificadas, comidasConsumidas]);
};


export const ProgressChartModal = ({ isOpen, onClose, dieta, comidasPlanificadas, comidasConsumidas }: ProgressChartModalProps) => {
  
  const chartData = useChartData(dieta, comidasPlanificadas, comidasConsumidas);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Progreso de la Dieta</DialogTitle>
          <DialogDescription className="text-center">
            Visualización de macros planificados vs. ingeridos por día.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 p-4">
          {/* Gráfico 1: Calorías (Barras) */}
          <Card>
            <CardHeader>
              <CardTitle>Comparativa de Calorías (Kcal)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="plan_calorias" fill="#8884d8" name="Calorías Planificadas" />
                  <Bar dataKey="ing_calorias" fill="#82ca9d" name="Calorías Ingeridas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico 2: Proteínas (Líneas) */}
          <Card>
            <CardHeader>
              <CardTitle>Comparativa de Proteínas (g)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
             <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" fontSize={12} />
                  <YAxis />
                  <Tooltip />
               <Legend />
                  <Line type="monotone" dataKey="plan_proteinas" stroke="#8884d8" name="Proteínas Planificadas" strokeWidth={2} />
                  <Line type="monotone" dataKey="ing_proteinas" stroke="#82ca9d" name="Proteínas Ingeridas" strokeWidth={2} />
            </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Puedes añadir más gráficos para Carbohidratos y Grasas aquí si lo deseas */}

    </div>
      </DialogContent>
    </Dialog>
  );
};