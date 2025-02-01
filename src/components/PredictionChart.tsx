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
        return a.contrepartie?.localeCompare(b.contrepartie || '') || 0;
      }
      return a.year - b.year;
    });

  console.log("Filtered data:", filteredData);

  const formatEuro = (value: number) => 
    new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

  const barData = showDetails ? filteredData.map(d => ({
    contrepartie: d.contrepartie || '',
    libLong: d.libLong || '',
    Réel: d.actualValue || 0,
    Budget: d.predictedValue || 0,
    year: d.year
  })) : [];

  console.log("Bar data:", barData);

  const CustomizedAxisTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          fill="#666"
          transform="rotate(-45)"
          style={{ fontSize: '10px' }}
        >
          <tspan x={0} dy="0">{payload.value}</tspan>
        </text>
      </g>
    );
  };

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
                  tick={<CustomizedAxisTick />}
                />
                <YAxis 
                  tickFormatter={formatEuro}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number) => formatEuro(value)}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `${data.contrepartie}\n${data.libLong}\nAnnée: ${data.year}`;
                    }
                    return '';
                  }}
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