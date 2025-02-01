import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from 'xlsx';
import { PredictionChart } from "@/components/PredictionChart";
import { generatePredictions } from "@/utils/predictions";
import type { PredictionData } from "@/utils/predictions";
import type { BudgetData } from "@/types/budget";

export default function Predictions() {
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedData = localStorage.getItem('budgetData');
    const storedRawData = localStorage.getItem('rawExcelData');
    
    if (storedData && storedRawData) {
      const budgetData: BudgetData[] = JSON.parse(storedData);
      setRawData(JSON.parse(storedRawData));
      
      const generateAndSetPredictions = async () => {
        setIsLoading(true);
        try {
          const newPredictions = await generatePredictions(budgetData);
          setPredictions(newPredictions);
          console.log("Prédictions générées:", newPredictions);
        } catch (error) {
          console.error("Erreur lors de la génération des prédictions:", error);
          toast({
            title: "Erreur",
            description: "Impossible de générer les prédictions",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      generateAndSetPredictions();
    }
  }, [toast]);

  const exportPredictions = () => {
    try {
      // Créer un nouveau workbook
      const wb = XLSX.utils.book_new();
      
      // Transformer les prédictions en format tabulaire
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

      // Créer une worksheet avec les données
      const ws = XLSX.utils.json_to_sheet(formattedData);
      
      // Ajouter la worksheet au workbook
      XLSX.utils.book_append_sheet(wb, ws, "Prédictions");
      
      // Sauvegarder le fichier
      XLSX.writeFile(wb, "predictions_budgetaires.xlsx");

      toast({
        title: "Export réussi",
        description: "Les prédictions ont été exportées avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export des prédictions",
        variant: "destructive",
      });
    }
  };

  // Grouper les prédictions par fournisseur et axe pour l'affichage
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

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Génération des prédictions en cours...</span>
          </CardContent>
        </Card>
      )}

      {predictions.length > 0 && (
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
      )}
    </div>
  );
}