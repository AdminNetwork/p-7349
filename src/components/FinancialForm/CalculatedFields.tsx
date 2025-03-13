
interface CalculatedFieldsProps {
  formValues: {
    budget?: number;
    montantReel?: number;
    mois?: number;
  };
}

export function CalculatedFields({ formValues }: CalculatedFieldsProps) {
  const mois = formValues.mois || 1; // Valeur par défaut si mois n'est pas défini
  const budget = formValues.budget || 0;
  const montantReel = formValues.montantReel || 0;
  
  // Calculer le budget YTD (Year To Date) - exemple simple: budget * (mois / 12)
  const budgetYTD = budget * (mois / 12);
  
  const calculatedFields = {
    ecartBudgetReel: budget - montantReel,
    ecartBudgetAtterissage: budget - montantReel,
    budgetYTD: budgetYTD,
    budgetVsReelYTD: budgetYTD - montantReel,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Écart Budget vs Montant Réel</p>
        <p className="text-lg font-bold">{calculatedFields.ecartBudgetReel.toFixed(2)} €</p>
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Écart Budget vs Atterrissage</p>
        <p className="text-lg font-bold">{calculatedFields.ecartBudgetAtterissage.toFixed(2)} €</p>
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Budget YTD</p>
        <p className="text-lg font-bold">{calculatedFields.budgetYTD.toFixed(2)} €</p>
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Budget vs Réel en YTD</p>
        <p className="text-lg font-bold">{calculatedFields.budgetVsReelYTD.toFixed(2)} €</p>
      </div>
    </div>
  );
}
