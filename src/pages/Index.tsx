import { useState } from "react";
import { ImportForm } from "@/components/ImportForm";
import { Statistics } from "@/components/Statistics";
import { RawDataTable } from "@/components/RawDataTable";
import { PredictionChart } from "@/components/PredictionChart";
import type { BudgetData } from "@/types/budget";
import type { PredictionData } from "@/utils/predictions";

export default function Index() {
  const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
  const [rawExcelData, setRawExcelData] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);

  const uniqueCombinations = budgetData.reduce((acc, curr) => {
    const key = `${curr.fournisseur}-${curr.axe}`;
    if (!acc.includes(key)) {
      acc.push(key);
    }
    return acc;
  }, [] as string[]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Prédiction Budgétaire IT</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <ImportForm 
          setBudgetData={setBudgetData}
          setRawExcelData={setRawExcelData}
          setPredictions={setPredictions}
          budgetData={budgetData}
        />
        <Statistics budgetData={budgetData} />
      </div>

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

      <RawDataTable rawExcelData={rawExcelData} />
    </div>
  );
}