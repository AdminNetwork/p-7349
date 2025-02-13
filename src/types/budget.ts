
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

export interface FinancialFormData {
  id?: number;
  axeIT: string;
  groupe2: string;
  contrePartie: string;
  libContrePartie: string;
  annee: number;
  mois: number;
  montantReel: number;
  budget: number;
  atterissage: number;
  plan: number;
  ecart_budget_reel: number;
  ecart_budget_atterissage: number;
  budget_ytd: number;
  budget_vs_reel_ytd: number;
}

export interface CalculatedFields {
  ecart_budget_reel: number;
  ecart_budget_atterissage: number;
  budget_ytd: number;
  budget_vs_reel_ytd: number;
}
