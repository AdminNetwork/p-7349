import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PredictionData } from '@/utils/predictions';

interface PredictionChartProps {
  predictions: PredictionData[];
  fournisseur: string;
  axe: string;
}

export function PredictionChart({ predictions, fournisseur, axe }: PredictionChartProps) {
  const filteredData = predictions.filter(
    p => p.fournisseur === fournisseur && p.axe === axe
  ).sort((a, b) => a.year - b.year);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">
          Prédictions pour {fournisseur} - {axe}
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
                name="Prédictions"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}