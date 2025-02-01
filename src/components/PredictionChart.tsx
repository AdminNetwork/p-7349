import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import type { PredictionData } from '@/utils/predictions';

interface PredictionChartProps {
  predictions: PredictionData[];
  axe: string;
  showDetails?: boolean;
}

export function PredictionChart({ predictions, axe, showDetails = false }: PredictionChartProps) {
  const filteredData = predictions
    .filter(p => {
      if (showDetails) {
        return !p.isTotal && p.axe === axe;
      }
      return p.isTotal && p.axe === axe;
    })
    .sort((a, b) => a.year - b.year);

  const detailGroups = showDetails
    ? [...new Set(filteredData.map(d => d.contrepartie || d.libLong))]
    : [];

  // Formatter pour les montants en euros
  const formatEuro = (value: number) => 
    new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(value);

  // Pour le graphique en barres, nous devons restructurer les données
  const barData = showDetails ? filteredData.map(d => ({
    group: `${d.contrepartie || ''} ${d.libLong || ''}`.trim(),
    Réel: d.actualValue || 0,
    Budget: d.predictedValue || 0,
    year: d.year
  })) : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">
          {showDetails ? `Détails pour l'axe ${axe}` : `Prédictions pour l'axe ${axe} (Total)`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {showDetails ? (
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="group" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{fontSize: 10}}
                />
                <YAxis 
                  tickFormatter={formatEuro}
                />
                <Tooltip 
                  formatter={(value: number) => formatEuro(value)}
                  labelFormatter={(label) => `Groupe: ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="Réel" 
                  fill="#8884d8" 
                  name="Valeurs réelles"
                />
                <Bar 
                  dataKey="Budget" 
                  fill="#82ca9d" 
                  name="Budget/Prévisions"
                />
              </BarChart>
            ) : (
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year"
                  type="number"
                  domain={['auto', 'auto']}
                />
                <YAxis tickFormatter={formatEuro} />
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
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}