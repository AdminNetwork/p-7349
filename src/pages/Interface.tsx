
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialFormData } from "@/types/budget";
import { FinancialForm } from "@/components/FinancialForm/FinancialForm";
import { EntriesList } from "@/components/FinancialForm/EntriesList";
import type { FormSchema } from "@/components/FinancialForm/formConfig";
import { apiService } from "@/services/apiService";

export default function Interface() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<FinancialFormData[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer les données
  const loadEntries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Chargement des données...");
      const data = await apiService.getEntries();
      console.log("Données récupérées:", data);
      setEntries(data);
    } catch (err) {
      console.error('Erreur de chargement:', err);
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de récupérer les données. Vérifiez que votre API Node.js est en cours d'exécution.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleSubmit = async (values: FormSchema) => {
    try {
      setIsLoading(true);
      
      // Initialisation des champs numériques à 0 s'ils sont undefined
      const preparedData = {
        ...values,
        montantReel: values.montantReel ?? 0,
        budget: values.budget ?? 0,
        montantReglement: values.montantReglement ?? 0,
        delaisPrevis: values.delaisPrevis ?? 0
      };

      console.log('Données préparées:', preparedData);

      if (editingId !== null) {
        // Mise à jour d'une entrée existante
        await apiService.updateEntry(editingId, preparedData);
        toast({
          title: "Succès",
          description: "Les données ont été mises à jour avec succès",
        });
      } else {
        // Insertion d'une nouvelle entrée
        await apiService.addEntry(preparedData);
        toast({
          title: "Succès",
          description: "Les nouvelles données ont été enregistrées",
        });
      }

      await loadEntries();
      setEditingId(null);
    } catch (err) {
      console.error('Erreur de soumission:', err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Une erreur est survenue lors de l'opération",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (entry: FinancialFormData) => {
    if (entry.id) {
      setEditingId(entry.id);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsLoading(true);
      
      await apiService.deleteEntry(id);

      toast({
        title: "Succès",
        description: "Les données ont été supprimées avec succès",
      });

      await loadEntries();
    } catch (err) {
      console.error('Erreur de suppression:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les données",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur de connexion!</strong>
          <span className="block sm:inline"> {error}</span>
          <p className="mt-2">
            Assurez-vous que votre serveur Node.js est en cours d'exécution et accessible.
          </p>
        </div>
      )}
      
      {isLoading && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Données Financières</CardTitle>
        </CardHeader>
        <CardContent>
          <FinancialForm 
            onSubmit={handleSubmit} 
            editingId={editingId}
            entries={entries} 
          />
        </CardContent>
      </Card>

      <EntriesList
        entries={entries}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
