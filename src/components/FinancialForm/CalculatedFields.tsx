

interface CalculatedFieldsProps {
  formValues: {
    budget?: number;
    montantReel?: number;
    mois?: number;
  };
}

export function CalculatedFields({ formValues }: CalculatedFieldsProps) {
  const calculatedFields = {
    ecartBudgetReel: (formValues.budget || 0) - (formValues.montantReel || 0),
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Écart Budget vs Montant Réel</p>
        <p className="text-lg font-bold">{calculatedFields.ecartBudgetReel.toFixed(2)} €</p>
      </div>
    </div>
  );
}

