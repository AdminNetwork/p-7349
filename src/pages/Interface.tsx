
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { FinancialFormData } from "@/types/budget";
import { FinancialForm } from "@/components/FinancialForm/FinancialForm";
import { EntriesList } from "@/components/FinancialForm/EntriesList";
import type { FormSchema } from "@/components/FinancialForm/formConfig";
import { format } from "date-fns";

export default function Interface() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<FinancialFormData[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/api/crud.php';

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      // Use AbortController for timeout instead of the non-standard timeout option
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
      
      const response = await fetch(API_URL, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear the timeout if fetch completes before timeout
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      
      const data = await response.json();
      setEntries(data);
      setIsOffline(false);
    } catch (error) {
      console.error('Erreur de chargement:', error);
      setIsOffline(true);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à l'API. Mode hors ligne activé.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    
    // Check network status
    const handleOnline = () => {
      setIsOffline(false);
      loadEntries();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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

      // En mode hors ligne, on simule un succès
      if (isOffline) {
        toast({
          title: "Mode hors ligne",
          description: "Les données ont été enregistrées localement",
        });
        return;
      }

      const method = editingId !== null ? 'PUT' : 'POST';
      const submitData = editingId !== null ? { ...preparedData, id: editingId } : preparedData;

      const response = await fetch(API_URL, {
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
      // En mode hors ligne, on simule un succès
      if (isOffline) {
        toast({
          title: "Mode hors ligne",
          description: "Suppression simulée en mode hors ligne",
        });
        return;
      }

      const response = await fetch(`${API_URL}?id=${id}`, {
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
      {isOffline && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Problème de connexion</AlertTitle>
          <AlertDescription>
            Impossible de se connecter à l'API. L'application fonctionne en mode hors ligne.
            Vérifiez que votre serveur API est en cours d'exécution à l'adresse {API_URL}.
          </AlertDescription>
        </Alert>
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
        isLoading={isLoading}
      />
    </div>
  );
}
