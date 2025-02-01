import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import * as XLSX from 'xlsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BudgetData {
  fournisseur: string
  axe: string
  annee: string
  montant: number
}

export default function Index() {
  const [budgetData, setBudgetData] = useState<BudgetData[]>([])
  const [rawExcelData, setRawExcelData] = useState<any[]>([])
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log("Fichier sélectionné:", file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        
        // Récupérer la première feuille du classeur
        const firstSheetName = workbook.SheetNames[0]
        console.log("Nom de la première feuille:", firstSheetName)
        
        const worksheet = workbook.Sheets[firstSheetName]

        if (!worksheet) {
          throw new Error("Impossible de lire la première feuille du fichier Excel")
        }

        // Convertir le tableau croisé en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        console.log("Données brutes importées:", jsonData)
        setRawExcelData(jsonData)

        // Transformation des données pour le graphique
        const formattedData: BudgetData[] = jsonData.map((row: any) => ({
          fournisseur: row.Fournisseur || '',
          axe: row.Axe || '',
          annee: row.Annee?.toString() || '',
          montant: parseFloat(row.Montant) || 0
        }))

        setBudgetData(formattedData)
        toast({
          title: "Import réussi",
          description: `${formattedData.length} lignes importées depuis la feuille "${firstSheetName}"`,
        })
      } catch (error) {
        console.error("Erreur lors de l'import:", error)
        toast({
          title: "Erreur d'import",
          description: "Le format du fichier n'est pas correct",
          variant: "destructive",
        })
      }
    }
    reader.readAsBinaryString(file)
  }

  // Agrégation des données par axe pour le graphique
  const chartData = budgetData.reduce((acc: any[], curr) => {
    const existingData = acc.find(item => item.axe === curr.axe)
    if (existingData) {
      existingData.montant += curr.montant
    } else {
      acc.push({ axe: curr.axe, montant: curr.montant })
    }
    return acc
  }, [])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Prédiction Budgétaire IT</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
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
                  <BarChart width={600} height={300} data={chartData}>
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

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Nombre de fournisseurs:</span>
                <span className="font-semibold">
                  {new Set(budgetData.map(d => d.fournisseur)).size}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Nombre d'axes IT:</span>
                <span className="font-semibold">
                  {new Set(budgetData.map(d => d.axe)).size}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Budget total:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  }).format(budgetData.reduce((sum, d) => sum + d.montant, 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {rawExcelData.length > 0 && (
        <Card className="col-span-7 mt-4">
          <CardHeader>
            <CardTitle>Aperçu des données brutes</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(rawExcelData[0]).map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawExcelData.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value: any, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {typeof value === 'number' 
                            ? new Intl.NumberFormat('fr-FR').format(value)
                            : value?.toString() || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}