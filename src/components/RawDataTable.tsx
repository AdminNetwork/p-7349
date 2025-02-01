import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from 'xlsx';

interface RawDataTableProps {
  rawExcelData: any[];
}

export const RawDataTable = ({ rawExcelData }: RawDataTableProps) => {
  const { toast } = useToast();

  const handleExportRawData = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(rawExcelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Données Brutes");
      XLSX.writeFile(workbook, "donnees_brutes.xlsx");
      
      toast({
        title: "Export réussi",
        description: "Les données brutes ont été exportées avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export des données",
        variant: "destructive",
      });
    }
  };

  if (rawExcelData.length === 0) return null;

  return (
    <Card className="col-span-7 mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Aperçu des données brutes</CardTitle>
        <Button onClick={handleExportRawData} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exporter les données brutes
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {Object.keys(rawExcelData[0] || {}).map((header) => (
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
  );
};