import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">
          {showDetails ? `Détails pour l'axe ${axe}` : `Prédictions pour l'axe ${axe} (Total)`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year"
                type="number"
                domain={['auto', 'auto']}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => 
                  new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  }).format(value)
                }
                labelFormatter={(label) => `Année: ${label}`}
              />
              <Legend />
              {showDetails ? (
                detailGroups.map((group, index) => (
                  <Line
                    key={group}
                    type="monotone"
                    dataKey="predictedValue"
                    data={filteredData.filter(d => (d.contrepartie || d.libLong) === group)}
                    name={group}
                    stroke={`hsl(${index * 360 / detailGroups.length}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={true}
                  />
                ))
              ) : (
                <>
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
                    name="Prédictions"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}