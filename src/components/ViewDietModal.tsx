import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dieta, ComidaDieta } from "@/types";
import { useMemo } from "react";

interface ViewDietModalProps {
  isOpen: boolean;
  onClose: () => void;
  dieta: Dieta;
  comidas: ComidaDieta[];
}

// Helper para agrupar comidas por fecha
const groupComidasByDate = (comidas: ComidaDieta[]) => {
  const grouped: Record<string, ComidaDieta[]> = {};
  
  // Ordenar por fecha primero
  const sortedComidas = [...comidas].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  
  for (const comida of sortedComidas) {
    const date = comida.fecha.split("T")[0]; // "YYYY-MM-DD"
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(comida);
  }
  return grouped;
};


export const ViewDietModal = ({ isOpen, onClose, dieta, comidas }: ViewDietModalProps) => {

  // Usamos useMemo para agrupar las comidas solo cuando cambien
  const comidasAgrupadas = useMemo(() => groupComidasByDate(comidas), [comidas]);
  const dias = Object.keys(comidasAgrupadas);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Tu Dieta Actual</DialogTitle>
          <DialogDescription>
            Del {dieta.fecha_inicio} al {dieta.fecha_fin} (Origen: {dieta.origen})
          </DialogDescription>
        </DialogHeader>
        
        {/* Contenedor con Scroll */}
        <div className="flex-1 overflow-y-auto pr-4 space-y-6">
          {dias.length > 0 ? (
            dias.map((fecha, index) => (
              <Card key={fecha}>
                <CardHeader>
                  <CardTitle>Día {index + 1} ({fecha})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {comidasAgrupadas[fecha].map((comida) => (
                    <div key={comida.id} className="p-3 border rounded-md bg-background/50">
                      <p className="font-semibold capitalize">{comida.tipo}</p>
                      <p className="text-sm text-muted-foreground">{comida.descripcion}</p>
                      <p className="text-sm font-medium text-primary">{comida.calorias} kcal</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-10">
              No hay comidas planificadas para esta dieta.
            </p>
          )}
        </div>
        
      </DialogContent>
    </Dialog>
  );
};

