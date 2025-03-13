
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialFormData } from "@/types/budget";
import { FinancialForm } from "@/components/FinancialForm/FinancialForm";
import { EntriesList } from "@/components/FinancialForm/EntriesList";
import type { FormSchema } from "@/components/FinancialForm/formConfig";
import sql from 'mssql';

export default function Interface() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<FinancialFormData[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Configuration pour la connexion SQL Server
  const sqlConfig = {
    user: 'JEMSPROD',
    password: '*EL*KTafPGm8qC',
    server: 'svinmssql001.groupedehon.com',
    port: 1433,
    database: 'MDMPROD',
    options: {
      encrypt: true, 
      trustServerCertificate: true,
      enableArithAbort: true
    }
  };

  // Fonction pour récupérer les données
  const loadEntries = async () => {
    try {
      console.log("Tentative de connexion à SQL Server...");
      
      // Connexion à SQL Server
      await sql.connect(sqlConfig);
      console.log("Connexion réussie!");
      
      // Exécution de la requête
      const result = await sql.query`SELECT * FROM DataWarehouse.budget_entries ORDER BY id DESC`;
      
      console.log("Données récupérées:", result.recordset);
      setEntries(result.recordset);
      setConnectionError(null);
    } catch (error) {
      console.error('Erreur de chargement:', error);
      setConnectionError(error instanceof Error ? error.message : "Erreur inconnue");
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à la base de données SQL Server directement. CORS ou restrictions réseau peuvent bloquer la connexion.",
        variant: "destructive",
      });
    } finally {
      // Fermer la connexion
      await sql.close();
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleSubmit = async (values: FormSchema) => {
    try {
      // Initialisation des champs numériques à 0 s'ils sont undefined
      const preparedData = {
        ...values,
        montantReel: values.montantReel ?? 0,
        budget: values.budget ?? 0,
        montantReglement: values.montantReglement ?? 0,
        delaisPrevis: values.delaisPrevis ?? 0
      };

      console.log('Données préparées:', preparedData); // Debug log

      // Connexion à SQL Server
      await sql.connect(sqlConfig);

      if (editingId !== null) {
        // Mise à jour d'une entrée existante
        await sql.query`
          UPDATE DataWarehouse.budget_entries 
          SET codeSociete = ${preparedData.codeSociete},
              fournisseur = ${preparedData.fournisseur},
              codeArticle = ${preparedData.codeArticle},
              natureCommande = ${preparedData.natureCommande},
              dateArriveeFacture = ${preparedData.dateArriveeFacture},
              typeDocument = ${preparedData.typeDocument},
              delaisPrevis = ${preparedData.delaisPrevis},
              dateFinContrat = ${preparedData.dateFinContrat},
              referenceAffaire = ${preparedData.referenceAffaire},
              contacts = ${preparedData.contacts},
              axeIT1 = ${preparedData.axeIT1},
              axeIT2 = ${preparedData.axeIT2},
              societeFacturee = ${preparedData.societeFacturee},
              annee = ${preparedData.annee},
              dateReglement = ${preparedData.dateReglement},
              mois = ${getMonthLabel(preparedData.mois)},
              montantReel = ${preparedData.montantReel},
              budget = ${preparedData.budget},
              montantReglement = ${preparedData.montantReglement}
          WHERE id = ${editingId}
        `;

        toast({
          title: "Succès",
          description: "Les données ont été mises à jour avec succès",
        });
      } else {
        // Insertion d'une nouvelle entrée
        await sql.query`
          INSERT INTO DataWarehouse.budget_entries (
            codeSociete, fournisseur, codeArticle, natureCommande, dateArriveeFacture,
            typeDocument, delaisPrevis, dateFinContrat, referenceAffaire, contacts,
            axeIT1, axeIT2, societeFacturee, annee, dateReglement, mois,
            montantReel, budget, montantReglement
          ) VALUES (
            ${preparedData.codeSociete},
            ${preparedData.fournisseur},
            ${preparedData.codeArticle},
            ${preparedData.natureCommande},
            ${preparedData.dateArriveeFacture},
            ${preparedData.typeDocument},
            ${preparedData.delaisPrevis},
            ${preparedData.dateFinContrat},
            ${preparedData.referenceAffaire},
            ${preparedData.contacts},
            ${preparedData.axeIT1},
            ${preparedData.axeIT2},
            ${preparedData.societeFacturee},
            ${preparedData.annee},
            ${preparedData.dateReglement},
            ${getMonthLabel(preparedData.mois)},
            ${preparedData.montantReel},
            ${preparedData.budget},
            ${preparedData.montantReglement}
          )
        `;

        toast({
          title: "Succès",
          description: "Les nouvelles données ont été enregistrées",
        });
      }

      await loadEntries();
      setEditingId(null);
    } catch (error) {
      console.error('Erreur de soumission:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'opération",
        variant: "destructive",
      });
    } finally {
      await sql.close();
    }
  };

  const handleEdit = (entry: FinancialFormData) => {
    if (entry.id) {
      setEditingId(entry.id);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      // Connexion à SQL Server
      await sql.connect(sqlConfig);
      
      // Suppression de l'entrée
      await sql.query`DELETE FROM DataWarehouse.budget_entries WHERE id = ${id}`;

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
    } finally {
      await sql.close();
    }
  };

  // Fonction pour convertir le numéro de mois en libellé
  const getMonthLabel = (monthNumber: number): string => {
    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return months[(monthNumber - 1) % 12];
  };

  return (
    <div className="space-y-6">
      {connectionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur de connexion!</strong>
          <span className="block sm:inline"> {connectionError}</span>
          <p className="mt-2">
            Note: La connexion directe SQL Server depuis le navigateur peut être 
            bloquée par CORS ou d'autres restrictions réseau. Envisagez d'utiliser un backend.
          </p>
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
