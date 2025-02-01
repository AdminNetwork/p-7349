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
  console.log("Rendering PredictionChart for axe:", axe, "showDetails:", showDetails);
  console.log("Predictions data:", predictions);

  const filteredData = predictions
    .filter(p => {
      if (showDetails) {
        return !p.isTotal && p.axe === axe;
      }
      return p.isTotal && p.axe === axe;
    })
    .sort((a, b) => {
      if (showDetails) {
        // Sort by contrepartie for detailed view
        const contrepartieA = `${a.contrepartie || ''} ${a.libLong || ''}`.trim();
        const contrepartieB = `${b.contrepartie || ''} ${b.libLong || ''}`.trim();
        return contrepartieA.localeCompare(contrepartieB);
      }
      return a.year - b.year;
    });

  console.log("Filtered data:", filteredData);

  // Formatter pour les montants en euros
  const formatEuro = (value: number) => 
    new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

  // Pour le graphique en barres, nous devons restructurer les données
  const barData = showDetails ? filteredData.map(d => ({
    contrepartie: `${d.contrepartie || ''} ${d.libLong || ''}`.trim(),
    Réel: d.actualValue || 0,
    Budget: d.predictedValue || 0,
    year: d.year
  })) : [];

  console.log("Bar data:", barData);

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
              <BarChart 
                data={barData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 100,
                  bottom: 100
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="contrepartie" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{
                    fontSize: 10,
                    width: 200,
                    wordWrap: 'break-word'
                  }}
                />
                <YAxis 
                  tickFormatter={formatEuro}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number) => formatEuro(value)}
                  labelFormatter={(label) => `Contrepartie: ${label}`}
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
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}