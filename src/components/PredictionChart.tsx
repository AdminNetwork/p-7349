import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PredictionData } from '@/utils/predictions';

interface PredictionChartProps {
  predictions: PredictionData[];
  axe: string;
}

export function PredictionChart({ predictions, axe }: PredictionChartProps) {
  const filteredData = predictions
    .filter(p => p.axe === axe)
    .sort((a, b) => a.year - b.year);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">
          Prédictions pour l'axe {axe}
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