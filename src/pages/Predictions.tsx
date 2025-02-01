import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { PredictionChart } from "@/components/PredictionChart";
import { generatePredictions } from "@/utils/predictions";
import type { PredictionData } from "@/utils/predictions";
import type { BudgetData } from "@/types/budget";

export default function Predictions() {
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedData = localStorage.getItem('budgetData');
        const storedRawData = localStorage.getItem('rawExcelData');
        
        console.log("Tentative de chargement des données depuis localStorage:", { storedData, storedRawData });
        
        if (!storedData || !storedRawData) {
          console.log("Aucune donnée trouvée dans localStorage");
          setError("Veuillez d'abord importer des données dans l'onglet Import");
          return;
        }

        const budgetData: BudgetData[] = JSON.parse(storedData);
        const parsedRawData = JSON.parse(storedRawData);
        
        if (!budgetData || budgetData.length === 0) {
          console.log("Données budgétaires invalides ou vides");
          setError("Les données importées sont vides ou invalides");
          return;
        }
        
        setIsLoading(true);
        setError(null);
        setRawData(parsedRawData);
        
        console.log("Génération des prédictions avec les données:", budgetData);
        const newPredictions = await generatePredictions(budgetData);
        
        if (!newPredictions || newPredictions.length === 0) {
          throw new Error("Aucune prédiction n'a pu être générée");
        }
        
        console.log("Nouvelles prédictions générées:", newPredictions);
        setPredictions(newPredictions);
        
        toast({
          title: "Prédictions générées",
          description: "Les prédictions ont été générées avec succès",
        });
      } catch (error) {
        console.error("Erreur lors de la génération des prédictions:", error);
        setError(error instanceof Error ? error.message : "Une erreur est survenue lors de la génération des prédictions");
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Impossible de générer les prédictions",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const exportPredictions = () => {
    try {
      if (!predictions.length || !rawData.length) {
        throw new Error("Aucune donnée à exporter");
      }

      console.log("Début de l'export des prédictions");
      const wb = XLSX.utils.book_new();
      
      const formattedData = rawData.map(row => {
        const matchingPredictions = predictions.filter(
          p => p.fournisseur === row.Fournisseur && 
              p.axe === row.Axe &&
              p.year > parseInt(row.Annee)
        );
        
        const predictionsByYear: { [key: string]: number } = {};
        matchingPredictions.forEach(p => {
          predictionsByYear[`Prediction_${p.year}`] = p.predictedValue;
        });
        
        return {
          ...row,
          ...predictionsByYear
        };
      });

      console.log("Données formatées pour l'export:", formattedData);
      
      const ws = XLSX.utils.json_to_sheet(formattedData);
      XLSX.utils.book_append_sheet(wb, ws, "Prédictions");
      XLSX.writeFile(wb, "predictions_budgetaires.xlsx");

      toast({
        title: "Export réussi",
        description: "Les prédictions ont été exportées avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast({
        title: "Erreur d'export",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'export des prédictions",
        variant: "destructive",
      });
    }
  };

  const uniqueCombinations = predictions.reduce((acc, curr) => {
    const key = `${curr.fournisseur}-${curr.axe}`;
    if (!acc.includes(key)) {
      acc.push(key);
    }
    return acc;
  }, [] as string[]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Prédictions Budgétaires</h2>
        {predictions.length > 0 && (
          <Button onClick={exportPredictions} className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            Exporter les prédictions
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Génération des prédictions en cours...</span>
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
          {uniqueCombinations.map(combo => {
            const [fournisseur, axe] = combo.split('-');
            return (
              <PredictionChart
                key={combo}
                predictions={predictions}
                fournisseur={fournisseur}
                axe={axe}
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <span>Aucune prédiction disponible. Veuillez d'abord importer des données.</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}