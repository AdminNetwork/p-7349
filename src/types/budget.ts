
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
  codeSociete: string;
  fournisseur: string;
  codeArticle: string;
  natureCommande: string;
  dateArriveeFacture: string;
  typeDocument: string;
  delaisPrevis: number;
  dateFinContrat: string;
  referenceAffaire: string;
  contacts: string;
  axeIT1: string;
  axeIT2: string;
  societeFacturee: string;
  annee: number;
  dateReglement: string;
  mois: string;
  montantReel: number;
  budget: number;
  montantReglement: number; // Renamed from regleEn
  ecart_budget_reel: number;
  budget_vs_reel_ytd: number;
}

export interface CalculatedFields {
  ecart_budget_reel: number;
  budget_vs_reel_ytd: number;
}
