
import axios from 'axios';
import type { FinancialFormData } from '@/types/budget';
import type { FormSchema } from '@/components/FinancialForm/formConfig';

const API_URL = 'http://localhost:3001/api'; // Remplacez par l'URL de votre API Node.js

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
