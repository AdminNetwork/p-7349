
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialFormData } from "@/types/budget";
import { FinancialForm } from "@/components/FinancialForm/FinancialForm";
import { EntriesList } from "@/components/FinancialForm/EntriesList";
import type { FormSchema } from "@/components/FinancialForm/formConfig";

export default function Interface() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<FinancialFormData[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadEntries = async () => {
    try {
      const response = await fetch('http://localhost/api/crud.php');
      const data = await response.json();
      setEntries(data);
    } catch (error) {
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
      if (editingId !== null) {
        await fetch('http://localhost/api/crud.php', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...values, id: editingId }),
        });

        toast({
          title: "Succès",
          description: "Les données ont été mises à jour avec succès",
        });
      } else {
        await fetch('http://localhost/api/crud.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        toast({
          title: "Succès",
          description: "Les nouvelles données ont été enregistrées",
        });
      }

      await loadEntries();
      setEditingId(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'opération",
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
      await fetch(`http://localhost/api/crud.php?id=${id}`, {
        method: 'DELETE',
      });

      toast({
        title: "Succès",
        description: "Les données ont été supprimées avec succès",
      });

      await loadEntries();
    } catch (error) {
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
          <FinancialForm onSubmit={handleSubmit} editingId={editingId} />
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
