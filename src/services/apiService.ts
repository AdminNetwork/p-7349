
import axios from 'axios';
import type { FinancialFormData } from '@/types/budget';
import type { FormSchema } from '@/components/FinancialForm/formConfig';

// URL de l'API PHP locale
const API_URL = 'http://localhost/api';

export const apiService = {
  // Récupérer toutes les entrées
  async getEntries(): Promise<FinancialFormData[]> {
    try {
      const response = await axios.get(`${API_URL}/crud.php`);
      return response.data;
    } catch (error) {
      console.error('Error fetching entries:', error);
      throw error;
    }
  },

  // Ajouter une nouvelle entrée
  async addEntry(entry: FormSchema): Promise<FinancialFormData> {
    try {
      const response = await axios.post(`${API_URL}/crud.php`, entry);
      return response.data;
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  },

  // Mettre à jour une entrée existante
  async updateEntry(id: number, entry: FormSchema): Promise<FinancialFormData> {
    try {
      const response = await axios.put(`${API_URL}/crud.php?id=${id}`, entry);
      return response.data;
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  },

  // Supprimer une entrée
  async deleteEntry(id: number): Promise<void> {
    try {
      await axios.delete(`${API_URL}/crud.php?id=${id}`);
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  }
};
