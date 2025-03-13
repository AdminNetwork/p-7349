
import axios from 'axios';
import type { FinancialFormData } from '@/types/budget';
import type { FormSchema } from '@/components/FinancialForm/formConfig';

// Remplacez cette URL par celle de votre service API
// Vous pouvez héberger un service simple sur:
// - Azure Functions
// - AWS Lambda
// - Vercel Serverless Functions
// - Netlify Functions
// - Ou tout autre service d'hébergement API
const API_URL = 'https://votre-api.exemple.com/api';

export const apiService = {
  // Récupérer toutes les entrées
  async getEntries(): Promise<FinancialFormData[]> {
    try {
      const response = await axios.get(`${API_URL}/entries`);
      return response.data;
    } catch (error) {
      console.error('Error fetching entries:', error);
      throw error;
    }
  },

  // Ajouter une nouvelle entrée
  async addEntry(entry: FormSchema): Promise<FinancialFormData> {
    try {
      const response = await axios.post(`${API_URL}/entries`, entry);
      return response.data;
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  },

  // Mettre à jour une entrée existante
  async updateEntry(id: number, entry: FormSchema): Promise<FinancialFormData> {
    try {
      const response = await axios.put(`${API_URL}/entries/${id}`, entry);
      return response.data;
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  },

  // Supprimer une entrée
  async deleteEntry(id: number): Promise<void> {
    try {
      await axios.delete(`${API_URL}/entries/${id}`);
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  }
};

// Option alternative : Mode de démonstration avec des données fictives
// Décommentez ce code pour l'utiliser en mode démo sans serveur backend
/*
let demoData: FinancialFormData[] = [
  {
    id: 1,
    codeSociete: "SOC001",
    fournisseur: "Fournisseur Exemple",
    codeArticle: "ART123",
    natureCommande: "Matériel",
    dateArriveeFacture: "2023-05-15",
    typeDocument: "Facture",
    delaisPrevis: 30,
    dateFinContrat: "2023-12-31",
    referenceAffaire: "REF2023-001",
    contacts: "Jean Dupont",
    axeIT1: "IT-DEV",
    axeIT2: "IT-INFRA",
    societeFacturee: "DEMO SA",
    annee: 2023,
    dateReglement: "2023-06-15",
    mois: 5,
    montantReel: 1500,
    budget: 2000,
    montantReglement: 1500,
    ecart_budget_reel: 500,
    budget_vs_reel_ytd: 3000
  }
];

// Service API en mode démonstration
export const demoApiService = {
  async getEntries(): Promise<FinancialFormData[]> {
    // Simulation d'un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...demoData];
  },

  async addEntry(entry: FormSchema): Promise<FinancialFormData> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newEntry: FinancialFormData = {
      ...entry,
      id: demoData.length + 1,
      ecart_budget_reel: (entry.budget || 0) - (entry.montantReel || 0),
      budget_vs_reel_ytd: ((entry.budget || 0) * (entry.mois / 12)) - (entry.montantReel || 0)
    };
    demoData.push(newEntry);
    return newEntry;
  },

  async updateEntry(id: number, entry: FormSchema): Promise<FinancialFormData> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = demoData.findIndex(item => item.id === id);
    if (index === -1) throw new Error("Entry not found");
    
    const updatedEntry: FinancialFormData = {
      ...entry,
      id,
      ecart_budget_reel: (entry.budget || 0) - (entry.montantReel || 0),
      budget_vs_reel_ytd: ((entry.budget || 0) * (entry.mois / 12)) - (entry.montantReel || 0)
    };
    
    demoData[index] = updatedEntry;
    return updatedEntry;
  },

  async deleteEntry(id: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    demoData = demoData.filter(item => item.id !== id);
  }
};
*/
