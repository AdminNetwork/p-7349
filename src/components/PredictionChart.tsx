import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
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
      if (showDetails) {
        const searchMatch = (p.contrepartie?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (p.libLong?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        return !p.isTotal && p.axe === axe && (searchQuery === "" || searchMatch);
      }
      return p.isTotal && p.axe === axe;
    })
    .sort((a, b) => {
      if (showDetails) {
        return a.year - b.year || (a.contrepartie?.localeCompare(b.contrepartie || '') || 0);
      }
      return a.year - b.year;
    });

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
          {showDetails ? `Détails pour l'axe ${axe}` : `Prédictions pour l'axe ${axe} (Total)`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showDetails ? (
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
                    <TableHead>Contrepartie</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Réel</TableHead>
                    <TableHead className="text-right">Budget/Prévision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <TableRow key={`${item.year}-${item.contrepartie}-${index}`}>
                      <TableCell>{item.year}</TableCell>
                      <TableCell>{item.contrepartie}</TableCell>
                      <TableCell>{item.libLong}</TableCell>
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
        ) : (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={filteredData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 100,
                  bottom: 5
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year"
                  type="number"
                  domain={['auto', 'auto']}
                />
                <YAxis 
                  tickFormatter={formatEuro}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number) => formatEuro(value)}
                  labelFormatter={(label) => `Année: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actualValue"
                  stroke="#8884d8"
                  name="Valeurs réelles"
                  strokeWidth={2}
                  dot={true}
                />
                <Line
                  type="monotone"
                  dataKey="predictedValue"
                  stroke="#82ca9d"
                  name="Budget/Prévisions"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}