import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as XLSX from 'xlsx';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { BudgetData } from "@/types/budget";
import { PredictionChart } from "@/components/PredictionChart";
import { generatePredictions } from "@/utils/predictions";
import type { PredictionData } from "@/utils/predictions";
import { useState } from "react";

interface ImportFormProps {
  setBudgetData: (data: BudgetData[]) => void;
  setRawExcelData: (data: any[]) => void;
  setPredictions: (data: any[]) => void;
  budgetData: BudgetData[];
}

export const ImportForm = ({ setBudgetData, setRawExcelData, setPredictions, budgetData }: ImportFormProps) => {
  const { toast } = useToast();
  const [predictions, setPredictionsLocal] = useState<PredictionData[]>([]);
  const [isGeneratingPredictions, setIsGeneratingPredictions] = useState(false);

  const cleanExcelData = (data: any[]): any[] => {
    return data
      .filter(row => {
        const hasValidData = Object.values(row).some(value => 
          value !== null && value !== undefined && value !== ''
        );
        return hasValidData;
      })
      .map(row => {
        const cleanedRow: any = {};
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value === 'string') {
            cleanedRow[key.trim()] = value.trim();
          } else if (typeof value === 'number') {
            cleanedRow[key.trim()] = value;
          } else if (value === null || value === undefined) {
            cleanedRow[key.trim()] = '';
          } else {
            cleanedRow[key.trim()] = value.toString().trim();
          }
        });
        return cleanedRow;
      });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("Fichier sélectionné:", file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          throw new Error("Impossible de lire la première feuille du fichier Excel");
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
        });
        
        console.log("Données Excel brutes:", jsonData);
        
        const cleanedData = cleanExcelData(jsonData);
        console.log("Données nettoyées:", cleanedData);
        
        setRawExcelData(cleanedData);
        localStorage.setItem('rawExcelData', JSON.stringify(cleanedData));

        const formattedData: BudgetData[] = cleanedData
          .map((row: any) => ({
            fournisseur: row.Fournisseur?.toString().trim() || '',
            axe: row.Axe?.toString().trim() || '',
            annee: row.Annee?.toString().trim() || '',
            montant: typeof row.Montant === 'number' 
              ? row.Montant 
              : parseFloat(row.Montant?.toString().replace(/[^\d.-]/g, '')) || 0
          }))
          .filter(row => 
            row.fournisseur && 
            row.axe && 
            row.annee && 
            !isNaN(row.montant) && 
            row.montant !== 0
          );
        
        console.log("Données formatées pour les prédictions:", formattedData);
        
        if (formattedData.length === 0) {
          throw new Error("Aucune donnée valide n'a été trouvée dans le fichier. Assurez-vous que les colonnes Fournisseur, Axe, Annee et Montant sont présentes et contiennent des valeurs valides.");
        }
        
        setBudgetData(formattedData);
        localStorage.setItem('budgetData', JSON.stringify(formattedData));
        
        setPredictions([]);
        setPredictionsLocal([]);
        localStorage.removeItem('predictions');
        
        toast({
          title: "Import réussi",
          description: "",
        });

        // Générer automatiquement les prédictions après l'import
        await handleGeneratePredictions(formattedData);
      } catch (error) {
        console.error("Erreur lors de l'import:", error);
        toast({
          title: "Erreur d'import",
          description: error instanceof Error ? error.message : "Le format du fichier n'est pas correct",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleGeneratePredictions = async (data: BudgetData[]) => {
    try {
      console.log("Début de la génération des prédictions avec les données:", data);
      setIsGeneratingPredictions(true);
      
      if (!data || data.length === 0) {
        throw new Error("Aucune donnée disponible pour générer les prédictions");
      }
      
      const newPredictions = await generatePredictions(data);
      console.log("Prédictions générées:", newPredictions);
      
      setPredictionsLocal(newPredictions);
      setPredictions(newPredictions);
      localStorage.setItem('predictions', JSON.stringify(newPredictions));
    } catch (error) {
      console.error("Erreur lors de la génération des prédictions:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de générer les prédictions",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPredictions(false);
    }
  };

  const handleExportPredictions = () => {
    try {
      if (!predictions.length) {
        throw new Error("Aucune prédiction à exporter");
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(predictions);
      XLSX.utils.book_append_sheet(wb, ws, "Prédictions");
      XLSX.writeFile(wb, "predictions_budgetaires.xlsx");

      toast({
        title: "Export réussi",
        description: "Les prédictions ont été exportées avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'export",
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import des Données</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="mb-4"
        />
        
        {predictions.length > 0 && (
          <>
            <div className="flex justify-end mb-4">
              <Button 
                onClick={handleExportPredictions}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter les prédictions
              </Button>
            </div>
            
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
          </>
        )}
      </CardContent>
    </Card>
  );
};