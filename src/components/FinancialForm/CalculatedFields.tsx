
interface CalculatedFieldsProps {
  formValues: {
    budget?: number;
    montantReel?: number;
    atterissage?: number;
    mois?: number;
  };
}

export function CalculatedFields({ formValues }: CalculatedFieldsProps) {
  const mois = formValues.mois || 1; // Valeur par défaut si mois n'est pas défini
  
  const calculatedFields = {
    ecartBudgetReel: (formValues.budget || 0) - (formValues.montantReel || 0),
    ecartBudgetAtterrissage: (formValues.budget || 0) - (formValues.atterissage || 0),
    budgetYTD: formValues.budget ? (formValues.budget * mois) / 12 : 0,
    budgetVsReelYTD: (formValues.budget ? (formValues.budget * mois) / 12 : 0) - (formValues.montantReel || 0),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Écart Budget vs Montant Réel</p>
        <p className="text-lg font-bold">{calculatedFields.ecartBudgetReel.toFixed(2)} €</p>
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Écart Budget vs Atterrissage</p>
        <p className="text-lg font-bold">{calculatedFields.ecartBudgetAtterrissage.toFixed(2)} €</p>
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">BUDGET YTD</p>
        <p className="text-lg font-bold">{calculatedFields.budgetYTD.toFixed(2)} €</p>
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Budget vs Réel en YTD</p>
        <p className="text-lg font-bold">{calculatedFields.budgetVsReelYTD.toFixed(2)} €</p>
      </div>
    </div>
  );
}
