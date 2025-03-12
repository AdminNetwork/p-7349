
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
  axeIT1: string;
  axeIT2: string;
  typeDocument: string;
  referenceAffaire: string;
  fournisseur: string;
  codeSociete: string;
  codeArticle: string;
  natureCommande: string;
  dateArriveeFacture: string;
  delaisPrevis: number;
  dateFinContrat: string;
  contacts: string;
  annee: number;
  annee_plan: number;
  mois: string;
  montantReel: number;
  budget: number;
  regleEn: number;
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
