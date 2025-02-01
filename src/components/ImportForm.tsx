import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { useToast } from "@/components/ui/use-toast";
import type { BudgetData } from "@/types/budget";

interface ImportFormProps {
  setBudgetData: (data: BudgetData[]) => void;
  setRawExcelData: (data: any[]) => void;
  setPredictions: (data: any[]) => void;
  budgetData: BudgetData[];
}

export const ImportForm = ({ setBudgetData, setRawExcelData, setPredictions, budgetData }: ImportFormProps) => {
  const { toast } = useToast();

  const cleanExcelData = (data: any[]): any[] => {
    return data
      .filter(row => {
        const hasValidData = Object.values(row).some(value => 
          value !== null && value !== undefined && value !== ''
        );
        return hasValidData;
      })
      .map(row => {
        const cleanedRow: any = {};
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value === 'string') {
            cleanedRow[key.trim()] = value.trim();
          } else if (typeof value === 'number') {
            cleanedRow[key.trim()] = value;
          } else if (value === null || value === undefined) {
            cleanedRow[key.trim()] = '';
          } else {
            cleanedRow[key.trim()] = value.toString().trim();
          }
        });
        return cleanedRow;
      });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("Fichier sélectionné:", file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const firstSheetName = workbook.SheetNames[0];
        console.log("Nom de la première feuille:", firstSheetName);
        
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          throw new Error("Impossible de lire la première feuille du fichier Excel");
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
        });
        
        const cleanedData = cleanExcelData(jsonData);
        console.log("Données brutes après nettoyage:", cleanedData);
        
        // Sauvegarder les données brutes
        setRawExcelData(cleanedData);
        localStorage.setItem('rawExcelData', JSON.stringify(cleanedData));

        const formattedData: BudgetData[] = cleanedData
          .filter(row => row.Fournisseur && row.Axe && row.Montant)
          .map((row: any) => ({
            fournisseur: row.Fournisseur?.toString().trim() || '',
            axe: row.Axe?.toString().trim() || '',
            annee: row.Annee?.toString().trim() || '',
            montant: typeof row.Montant === 'number' 
              ? row.Montant 
              : parseFloat(row.Montant?.toString().replace(/[^\d.-]/g, '')) || 0
          }));

        console.log("Données formatées:", formattedData);
        
        // Sauvegarder les données formatées
        setBudgetData(formattedData);
        localStorage.setItem('budgetData', JSON.stringify(formattedData));
        
        // Réinitialiser les prédictions
        setPredictions([]);
        localStorage.removeItem('predictions');
        
        toast({
          title: "Import réussi",
          description: `${formattedData.length} lignes valides importées depuis la feuille "${firstSheetName}"`,
        });
      } catch (error) {
        console.error("Erreur lors de l'import:", error);
        toast({
          title: "Erreur d'import",
          description: "Le format du fichier n'est pas correct",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Import des Données</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="mb-4"
        />
        {budgetData.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Répartition par Axe IT</h3>
            <div className="w-full overflow-x-auto">
              <BarChart width={600} height={300} data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="axe" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="montant" fill="#8884d8" name="Montant" />
              </BarChart>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};