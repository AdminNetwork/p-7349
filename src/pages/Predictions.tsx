import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { PredictionChart } from "@/components/PredictionChart";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import type { PredictionData } from '@/utils/predictions';

export default function Predictions() {
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const isGenerating = localStorage.getItem('isGeneratingPredictions') === 'true';
        const savedProgress = localStorage.getItem('predictionProgress');
        
        if (isGenerating) {
          setIsLoading(true);
          setProgress(savedProgress ? parseInt(savedProgress) : 0);
          
          const interval = setInterval(() => {
            setProgress(prev => {
              const newProgress = prev + 1;
              if (newProgress >= 90) {
                clearInterval(interval);
                return prev;
              }
              localStorage.setItem('predictionProgress', newProgress.toString());
              return newProgress;
            });
          }, 500);

          const checkInterval = setInterval(() => {
            const stillGenerating = localStorage.getItem('isGeneratingPredictions') === 'true';
            if (!stillGenerating) {
              clearInterval(interval);
              clearInterval(checkInterval);
              setProgress(100);
              localStorage.setItem('predictionProgress', '100');
              setTimeout(() => {
                setIsLoading(false);
                loadPredictions();
              }, 500);
            }
          }, 500);

          return () => {
            clearInterval(interval);
            clearInterval(checkInterval);
          };
        } else {
          loadPredictions();
        }
      } catch (error) {
        handleError(error);
      }
    };

    loadData();
  }, [toast]);

  const loadPredictions = () => {
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

    setPredictions(parsedPredictions);
  };

  const handleError = (error: any) => {
    console.error("Erreur lors du chargement des prédictions:", error);
    setError(error instanceof Error ? error.message : "Une erreur est survenue");
    setIsLoading(false);
    toast({
      title: "Erreur",
      description: "Impossible de charger les prédictions",
      variant: "destructive",
    });
  };

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

  const filteredAxes = uniqueAxes.filter(axe => 
    axe.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {predictions.length > 0 && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un axe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
            <Progress value={progress} className="w-[60%]" />
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Génération des prédictions en cours...</span>
            </div>
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
          {filteredAxes.map(axe => (
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