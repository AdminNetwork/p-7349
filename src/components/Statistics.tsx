import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BudgetData } from "@/types/budget";

interface StatisticsProps {
  budgetData: BudgetData[];
}

export const Statistics = ({ budgetData }: StatisticsProps) => {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Statistiques</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Nombre de fournisseurs:</span>
            <span className="font-semibold">
              {new Set(budgetData.map(d => d.fournisseur)).size}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Nombre d'axes IT:</span>
            <span className="font-semibold">
              {new Set(budgetData.map(d => d.axe)).size}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Budget total:</span>
            <span className="font-semibold">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
              }).format(budgetData.reduce((sum, d) => sum + d.montant, 0))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};