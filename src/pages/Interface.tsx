
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialFormData } from "@/types/budget";
import { FinancialForm } from "@/components/FinancialForm/FinancialForm";
import { EntriesList } from "@/components/FinancialForm/EntriesList";
import type { FormSchema } from "@/components/FinancialForm/formConfig";
import { format } from "date-fns";

export default function Interface() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<FinancialFormData[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadEntries = async () => {
    try {
      const response = await fetch('http://localhost/api/crud.php');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error('Erreur de chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleSubmit = async (values: FormSchema) => {
    try {
      // Formatage des dates pour l'API
      const dateFinContrat = values.dateFinContrat ? format(values.dateFinContrat, 'yyyy-MM-dd') : null;
      const dateReglement = values.dateReglement ? format(values.dateReglement, 'yyyy-MM-dd') : null;
      
      // Initialisation des champs numériques à 0 s'ils sont undefined
      const preparedData = {
        ...values,
        dateFinContrat,
        dateReglement,
        montantReel: values.montantReel ?? 0,
        budget: values.budget ?? 0,
        regleEn: values.regleEn ?? 0,
        delaisPrevis: values.delaisPrevis ?? 0,
      };

      console.log('Données préparées:', preparedData); // Debug log

      const method = editingId !== null ? 'PUT' : 'POST';
      const submitData = editingId !== null ? { ...preparedData, id: editingId } : preparedData;

      const response = await fetch('http://localhost/api/crud.php', {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la soumission');
      }

      const result = await response.json();
      console.log('Réponse du serveur:', result); // Debug log

      toast({
        title: "Succès",
        description: editingId !== null 
          ? "Les données ont été mises à jour avec succès"
          : "Les nouvelles données ont été enregistrées",
      });

      await loadEntries();
      setEditingId(null);
    } catch (error) {
      console.error('Erreur de soumission:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'opération",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (entry: FinancialFormData) => {
    if (entry.id) {
      setEditingId(entry.id);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`http://localhost/api/crud.php?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      toast({
        title: "Succès",
        description: "Les données ont été supprimées avec succès",
      });

      await loadEntries();
    } catch (error) {
      console.error('Erreur de suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les données",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
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
