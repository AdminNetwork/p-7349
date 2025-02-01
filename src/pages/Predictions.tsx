import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { PredictionChart } from "@/components/PredictionChart";
import type { PredictionData } from "@/utils/predictions";

export default function Predictions() {
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedPredictions = localStorage.getItem('predictions');
        
        if (!storedPredictions) {
          setError("Veuillez d'abord générer des prédictions dans l'onglet Import");
          return;
        }

        const parsedPredictions: PredictionData[] = JSON.parse(storedPredictions);
        if (!parsedPredictions || parsedPredictions.length === 0) {
          setError("Aucune prédiction disponible");
          return;
        }

        setIsLoading(true);
        setPredictions(parsedPredictions);
        
      } catch (error) {
        console.error("Erreur lors du chargement des prédictions:", error);
        setError(error instanceof Error ? error.message : "Une erreur est survenue");
        toast({
          title: "Erreur",
          description: "Impossible de charger les prédictions",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleExport = () => {
    try {
      if (!predictions.length) {
        throw new Error("Aucune prédiction à exporter");
      }

      const totalPredictions = predictions.filter(p => p.isTotal);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(totalPredictions);
      XLSX.utils.book_append_sheet(wb, ws, "Prédictions Totales");
      XLSX.writeFile(wb, "predictions_totales.xlsx");

      toast({
        title: "Export réussi",
        description: "Les prédictions totales ont été exportées avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'export",
        variant: "destructive",
      });
    }
  };

  const uniqueAxes = predictions
    .filter(p => p.isTotal)
    .reduce((acc, curr) => {
      if (!acc.includes(curr.axe)) {
        acc.push(curr.axe);
      }
      return acc;
    }, [] as string[]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Prédictions Totales</h2>
        {predictions.length > 0 && (
          <Button onClick={handleExport} className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            Exporter les prédictions totales
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Chargement des prédictions totales...</span>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-center py-6 text-red-500">
            <span>{error}</span>
          </CardContent>
        </Card>
      ) : predictions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {uniqueAxes.map(axe => (
            <PredictionChart
              key={`total-${axe}`}
              predictions={predictions}
              axe={axe}
              showDetails={false}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <span>Aucune prédiction totale disponible. Veuillez d'abord générer des prédictions.</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}