import type { BudgetData, DetailedPredictionData } from '@/types/budget';

export type { DetailedPredictionData as PredictionData };

export async function generatePredictions(
  historicalData: BudgetData[],
  yearsToPredict: number = 10
): Promise<DetailedPredictionData[]> {
  console.log("Début de la génération des prédictions avec les données:", historicalData);

  try {
    const response = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        historicalData,
        yearsToPredict
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const predictions = await response.json();
    console.log("Prédictions reçues de l'API Python:", predictions);
    return predictions;
  } catch (error) {
    console.error("Erreur lors de la génération des prédictions:", error);
    throw error;
  }
}