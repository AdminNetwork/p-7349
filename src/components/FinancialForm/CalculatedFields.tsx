
interface CalculatedFieldsProps {
  formValues: {
    budget?: number;
    montantReel?: number;
    regleEn?: number;
    mois?: number;
  };
}

export function CalculatedFields({ formValues }: CalculatedFieldsProps) {
  const budget = formValues.budget || 0;
  const montantReel = formValues.montantReel || 0;
  const regleEn = formValues.regleEn || 0;
  
  // Nouvelle formule qui prend en compte le montant du règlement s'il est supérieur à 0
  const ecartBudgetReel = regleEn > 0 
    ? budget - montantReel - regleEn
    : budget - montantReel;

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Écart Budget vs Montant Réel</p>
        <p className="text-lg font-bold">{ecartBudgetReel.toFixed(2)} €</p>
      </div>
    </div>
  );
}
