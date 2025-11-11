import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import type { Dieta, ComidaDieta, ComidaUsuario } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// --- TIPOS DE DATOS ---

interface ChartData {
  fecha: string;
  plan_calorias: number;
  plan_proteinas: number;
  plan_carbohidratos: number;
  plan_grasas: number;
  ing_calorias: number;
  ing_proteinas: number;
  ing_carbohidratos: number;
  ing_grasas: number;
}

interface KpiData {
  deficitSuperavitPromedio: number;
  diasEnObjetivo: number;
  totalDias: number;
  proteinaPromedio: number;
}

interface PieChartData {
  name: string;
  value: number;
}

interface ProgressChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  dieta: Dieta | null;
  comidasPlanificadas: ComidaDieta[];
  comidasConsumidas: ComidaUsuario[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

// --- HOOKS DE CÁLCULO ---

const useChartData = (
  dieta: Dieta | null,
  comidasPlanificadas: ComidaDieta[],
  comidasConsumidas: ComidaUsuario[]
) => {
  return useMemo(() => {
    if (!dieta || comidasPlanificadas.length === 0) return { dailyData: [], kpiData: null, pieData: [] };

    const dataMap = new Map<string, ChartData>();

    // 1. Procesar comidas PLANIFICADAS
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

    // 2. Procesar comidas CONSUMIDAS
    for (const comida of comidasConsumidas) {
      const fecha = comida.fecha;
      if (dataMap.has(fecha)) {
        const dayData = dataMap.get(fecha)!;
        dayData.ing_calorias += Number(comida.calorias) || 0;
        dayData.ing_proteinas += Number(comida.proteinas) || 0;
        dayData.ing_carbohidratos += Number(comida.carbohidratos) || 0;
        dayData.ing_grasas += Number(comida.grasas) || 0;
      }
    }

    const dailyData = Array.from(dataMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));

    // 3. Calcular KPIs
    let totalPlanCal = 0;
    let totalIngCal = 0;
    let totalIngProt = 0;
    let totalIngCarb = 0;
    let totalIngGras = 0;
    let diasEnObjetivo = 0;
    const totalDias = dailyData.length;

    dailyData.forEach(day => {
      totalPlanCal += day.plan_calorias;
      totalIngCal += day.ing_calorias;
      totalIngProt += day.ing_proteinas;
      totalIngCarb += day.ing_carbohidratos;
      totalIngGras += day.ing_grasas;

      const margen = day.plan_calorias * 0.10;
      if (Math.abs(day.ing_calorias - day.plan_calorias) <= margen) {
        diasEnObjetivo++;
      }
    });

    const kpiData: KpiData = {
      deficitSuperavitPromedio: totalDias > 0 ? Math.round((totalIngCal - totalPlanCal) / totalDias) : 0,
      diasEnObjetivo: diasEnObjetivo,
      totalDias: totalDias,
      proteinaPromedio: totalDias > 0 ? Math.round(totalIngProt / totalDias) : 0,
    };

    const pieData: PieChartData[] = [
      { name: 'Proteínas (g)', value: Math.round(totalIngProt) },
      { name: 'Carbohidratos (g)', value: Math.round(totalIngCarb) },
      { name: 'Grasas (g)', value: Math.round(totalIngGras) },
    ].filter(d => d.value > 0);

    return { dailyData, kpiData, pieData };

  }, [dieta, comidasPlanificadas, comidasConsumidas]);
};

// --- COMPONENTE PRINCIPAL ---

export const ProgressChartModal = ({ isOpen, onClose, dieta, comidasPlanificadas, comidasConsumidas }: ProgressChartModalProps) => {

  const { dailyData, kpiData, pieData } = useChartData(dieta, comidasPlanificadas, comidasConsumidas);

  const [range, setRange] = useState<'7d' | 'all'>('7d');
  const [showMacros, setShowMacros] = useState({
    calorias: true,
    proteinas: true,
    carbohidratos: false,
    grasas: false,
  });

  const filteredData = useMemo(() => {
    if (range === '7d') {
      return dailyData.slice(-7);
    }
    return dailyData;
  }, [dailyData, range]);

  const handleMacroToggle = (macro: keyof typeof showMacros) => {
    setShowMacros(prev => ({ ...prev, [macro]: !prev[macro] }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold">Progreso de la Dieta</DialogTitle>
          <DialogDescription>
            Visualización de macros planificados vs. ingeridos por día.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* KPIs */}
          {kpiData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Déficit/Superávit Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${kpiData.deficitSuperavitPromedio > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {kpiData.deficitSuperavitPromedio > 0 ? '+' : ''}{kpiData.deficitSuperavitPromedio} Kcal/día
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Días en Objetivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {kpiData.diasEnObjetivo} <span className="text-lg text-muted-foreground">/ {kpiData.totalDias}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Proteína Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {kpiData.proteinaPromedio} <span className="text-lg text-muted-foreground">g/día</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Rango:</span>
                <Button variant={range === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setRange('7d')}>
                  Últimos 7 Días
                </Button>
                <Button variant={range === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setRange('all')}>
                  Toda la Dieta
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium">Macros a mostrar:</span>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(showMacros).map(([macro, checked]) => (
                    <div key={macro} className="flex items-center space-x-2">
                      <Checkbox
                        id={`check-${macro}`}
                        checked={checked}
                        onCheckedChange={() => handleMacroToggle(macro as keyof typeof showMacros)}
                      />
                      <Label htmlFor={`check-${macro}`} className="text-sm capitalize cursor-pointer">
                        {macro === 'calorias' ? 'Calorías' : macro.charAt(0).toUpperCase() + macro.slice(1)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="space-y-6">
            {/* Gráfico de Calorías */}
            {showMacros.calorias && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comparativa de Calorías (Kcal)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={filteredData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="plan_calorias" fill="#8884d8" name="Plan Kcal" />
                      <Bar dataKey="ing_calorias" fill="#82ca9d" name="Ingeridas Kcal" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Macros */}
            {(showMacros.proteinas || showMacros.carbohidratos || showMacros.grasas) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comparativa de Macros (g)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={filteredData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {showMacros.proteinas && (
                        <>
                          <Line type="monotone" dataKey="plan_proteinas" stroke="#8884d8" name="Plan Proteínas" strokeWidth={2} opacity={0.5} strokeDasharray="5 5" />
                          <Line type="monotone" dataKey="ing_proteinas" stroke="#8884d8" name="Ingeridas Proteínas" strokeWidth={2} />
                        </>
                      )}
                      {showMacros.carbohidratos && (
                        <>
                          <Line type="monotone" dataKey="plan_carbohidratos" stroke="#82ca9d" name="Plan Carbohidratos" strokeWidth={2} opacity={0.5} strokeDasharray="5 5" />
                          <Line type="monotone" dataKey="ing_carbohidratos" stroke="#82ca9d" name="Ingeridos Carbohidratos" strokeWidth={2} />
                        </>
                      )}
                      {showMacros.grasas && (
                        <>
                          <Line type="monotone" dataKey="plan_grasas" stroke="#ffc658" name="Plan Grasas" strokeWidth={2} opacity={0.5} strokeDasharray="5 5" />
                          <Line type="monotone" dataKey="ing_grasas" stroke="#ffc658" name="Ingeridas Grasas" strokeWidth={2} />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Torta */}
            {pieData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Desglose Macros Ingeridos (Total)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={(entry) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value}g`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};