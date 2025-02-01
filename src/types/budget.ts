export interface BudgetData {
  Fournisseur: string;
  Axe: string;
  Annee: string | number;
  Montant: string | number;
  [key: string]: any; // Pour permettre d'autres colonnes optionnelles
}