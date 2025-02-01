import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as XLSX from 'xlsx';
import { useToast } from "@/components/ui/use-toast";
import type { BudgetData } from "@/types/budget";
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
  const [isGeneratingPredictions, setIsGeneratingPredictions] = useState(false);

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

        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log("Données Excel brutes:", jsonData);
        
        setRawExcelData(jsonData);
        localStorage.setItem('rawExcelData', JSON.stringify(jsonData));
        
        setBudgetData(jsonData as BudgetData[]);
        localStorage.setItem('budgetData', JSON.stringify(jsonData));
        
        setPredictions([]);
        localStorage.removeItem('predictions');
        
        setIsGeneratingPredictions(true);
        localStorage.setItem('isGeneratingPredictions', 'true');
        
        const newPredictions = await generatePredictions(jsonData as BudgetData[]);
        console.log("Prédictions générées:", newPredictions);
        
        setPredictions(newPredictions);
        localStorage.setItem('predictions', JSON.stringify(newPredictions));
        setIsGeneratingPredictions(false);
        localStorage.setItem('isGeneratingPredictions', 'false');

        toast({
          title: "Import réussi",
          description: "Les données ont été importées avec succès",
        });
      } catch (error) {
        console.error("Erreur lors de l'import:", error);
        setIsGeneratingPredictions(false);
        localStorage.setItem('isGeneratingPredictions', 'false');
        toast({
          title: "Erreur d'import",
          description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'import",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

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
      </CardContent>
    </Card>
  );
};