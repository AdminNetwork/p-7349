import { useState, useEffect } from "react";
import { ImportForm } from "@/components/ImportForm";
import { RawDataTable } from "@/components/RawDataTable";
import type { BudgetData } from "@/types/budget";
import type { PredictionData } from "@/utils/predictions";

export default function Index() {
  const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
  const [rawExcelData, setRawExcelData] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);

  useEffect(() => {
    const storedBudgetData = localStorage.getItem('budgetData');
    const storedRawData = localStorage.getItem('rawExcelData');
    
    if (storedBudgetData) {
      setBudgetData(JSON.parse(storedBudgetData));
    }
    
    if (storedRawData) {
      setRawExcelData(JSON.parse(storedRawData));
    }
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Prédiction Budgétaire IT</h2>
      </div>
      
      <div className="grid gap-4">
        <ImportForm 
          setBudgetData={setBudgetData}
          setRawExcelData={setRawExcelData}
          setPredictions={setPredictions}
          budgetData={budgetData}
        />
      </div>

      <RawDataTable rawExcelData={rawExcelData} />
    </div>
  );
}