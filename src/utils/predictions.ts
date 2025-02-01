import * as tf from '@tensorflow/tfjs';
import type { BudgetData, DetailedPredictionData } from '@/types/budget';

export type { DetailedPredictionData as PredictionData };

export async function generatePredictions(
  historicalData: BudgetData[],
  yearsToPredict: number = 10
): Promise<DetailedPredictionData[]> {
  console.log("Début de la génération des prédictions avec les données:", historicalData);

  const allPredictions: DetailedPredictionData[] = [];
  const currentYear = new Date().getFullYear();

  // Traiter les totaux et les détails
  for (const entry of historicalData) {
    const isTotal = entry.Axe_IT?.startsWith('Total ');
    const axeName = isTotal ? entry.Axe_IT.replace('Total ', '') : entry.Axe_IT;
    
    // Extraire les données historiques
    const dataPoints = [];
    
    // Parcourir toutes les années possibles
    for (let year = 2020; year <= currentYear; year++) {
      const realKey = `ANNEE_${year}`;
      const budgetKey = `BUDGET_${year}`;
      const ecartKey = `ECART_BUDGET_YTD_ET_REEL`;
      const atterissageKey = `ATTERISSAGE_${year}`;
      
      let value = null;
      
      // Priorité : Réel > Atterrissage > Budget
      if (entry[realKey] !== undefined && entry[realKey] !== null && entry[realKey] !== '') {
        value = typeof entry[realKey] === 'string' ? parseFloat(entry[realKey].replace(/[^\d.-]/g, '')) : entry[realKey];
      } else if (entry[atterissageKey] !== undefined && entry[atterissageKey] !== null && entry[atterissageKey] !== '') {
        value = typeof entry[atterissageKey] === 'string' ? parseFloat(entry[atterissageKey].replace(/[^\d.-]/g, '')) : entry[atterissageKey];
      } else if (entry[budgetKey] !== undefined && entry[budgetKey] !== null && entry[budgetKey] !== '') {
        value = typeof entry[budgetKey] === 'string' ? parseFloat(entry[budgetKey].replace(/[^\d.-]/g, '')) : entry[budgetKey];
      }
      
      if (value !== null && !isNaN(value)) {
        dataPoints.push({
          year,
          value
        });
      }
    }

    console.log(`Données historiques pour ${axeName}:`, dataPoints);

    if (dataPoints.length < 2) continue;

    try {
      const predictions = await generatePredictionsForDataset(dataPoints, yearsToPredict);
      predictions.forEach(pred => {
        allPredictions.push({
          ...pred,
          axe: axeName,
          isTotal,
          contrepartie: entry.Contrepartie,
          libLong: entry.Lib_Long
        });
      });
    } catch (error) {
      console.error(`Erreur lors de la génération des prédictions pour ${axeName}:`, error);
    }
  }

  return allPredictions;
}

async function generatePredictionsForDataset(
  dataPoints: { year: number; value: number }[],
  yearsToPredict: number
): Promise<DetailedPredictionData[]> {
  const values = dataPoints.map(d => d.value);
  const years = dataPoints.map(d => d.year);

  // Normaliser les données
  const mean = tf.mean(values);
  const std = tf.moments(values).variance.sqrt();
  const normalizedValues = tf.sub(values, mean).div(std);

  // Créer et entraîner le modèle
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
  
  await model.compile({
    optimizer: tf.train.adam(0.1),
    loss: 'meanSquaredError'
  });

  const xs = tf.linspace(0, dataPoints.length - 1, dataPoints.length);
  await model.fit(xs.reshape([-1, 1]), normalizedValues, {
    epochs: 100,
    verbose: 0
  });

  const predictions: DetailedPredictionData[] = [];

  // Ajouter les données historiques
  dataPoints.forEach(d => {
    predictions.push({
      year: d.year,
      actualValue: d.value,
      predictedValue: d.value,
      axe: '', // sera rempli par la fonction appelante
      isTotal: false // sera rempli par la fonction appelante
    });
  });

  // Générer les prédictions futures
  const lastYear = Math.max(...years);
  for (let i = 1; i <= yearsToPredict; i++) {
    const normalizedPrediction = model.predict(
      tf.tensor2d([dataPoints.length + i - 1], [1, 1])
    ) as tf.Tensor;
    
    const prediction = normalizedPrediction
      .mul(std)
      .add(mean)
      .dataSync()[0];

    predictions.push({
      year: lastYear + i,
      predictedValue: Math.max(0, prediction),
      axe: '', // sera rempli par la fonction appelante
      isTotal: false // sera rempli par la fonction appelante
    });
  }

  // Nettoyer les tenseurs
  model.dispose();
  mean.dispose();
  std.dispose();
  normalizedValues.dispose();
  xs.dispose();

  return predictions;
}