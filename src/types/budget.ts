export interface BudgetData {
  Axe_IT: string;
  Annee: string | number;
  Montant: string | number;
  Contrepartie?: string;
  Lib_Long?: string;
  [key: string]: any;
}

export interface DetailedPredictionData {
  year: number;
  actualValue?: number;
  predictedValue: number;
  axe: string;
  isTotal: boolean;
  contrepartie?: string;
  libLong?: string;
}