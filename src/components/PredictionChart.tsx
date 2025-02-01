import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { PredictionData } from '@/utils/predictions';

interface PredictionChartProps {
  predictions: PredictionData[];
  axe: string;
  showDetails?: boolean;
}

export function PredictionChart({ predictions, axe, showDetails = false }: PredictionChartProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  console.log("Rendering PredictionChart for axe:", axe, "showDetails:", showDetails);
  console.log("Predictions data:", predictions);

  const filteredData = predictions
    .filter(p => {
      const searchMatch = (p.contrepartie?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                        (p.libLong?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      return !p.isTotal && p.axe === axe && (searchQuery === "" || searchMatch);
    })
    .sort((a, b) => a.year - b.year || (a.contrepartie?.localeCompare(b.contrepartie || '') || 0));

  console.log("Filtered data:", filteredData);

  const formatEuro = (value: number) => 
    new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">
          {showDetails ? `Détails pour l'axe ${axe}` : `Totaux pour l'axe ${axe}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative w-full">
            <Input
              placeholder="Rechercher par contrepartie ou libellé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Année</TableHead>
                  <TableHead>Contrepartie et Libellé</TableHead>
                  <TableHead className="text-right">Réel</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={`${item.year}-${item.contrepartie}-${index}`}>
                    <TableCell>{item.year}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.contrepartie}</div>
                        <div className="text-sm text-muted-foreground">{item.libLong}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.actualValue ? formatEuro(item.actualValue) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.predictedValue ? formatEuro(item.predictedValue) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}