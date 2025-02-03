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
  const maxPredictionYear = 2030;

  // Traiter les totaux et les détails
  for (const entry of historicalData) {
    const isTotal = entry.Axe_IT?.startsWith('Total ');
    const axeName = isTotal ? entry.Axe_IT.replace('Total ', '') : entry.Axe_IT;
    
    // Extraire les données historiques et budgétées
    const dataPoints = [];
    
    // Années historiques (2021-2024)
    for (let year = 2021; year <= 2024; year++) {
      const realKey = `ANNEE_${year}`;
      if (entry[realKey] !== undefined && entry[realKey] !== null && entry[realKey] !== '') {
        const value = typeof entry[realKey] === 'string' ? 
          parseFloat(entry[realKey].replace(/[^\d.-]/g, '')) : 
          entry[realKey];
        
        dataPoints.push({
          year,
          actualValue: value,
          predictedValue: value,
          hasBudget: false
        });
      }
    }

    // Budget et atterrissage 2024
    if (entry['BUDGET_2024'] !== undefined && entry['BUDGET_2024'] !== null) {
      const budget2024 = typeof entry['BUDGET_2024'] === 'string' ? 
        parseFloat(entry['BUDGET_2024'].replace(/[^\d.-]/g, '')) : 
        entry['BUDGET_2024'];

      const atterrissage2024 = entry['ATTERISSAGE_2024'] !== undefined ? 
        (typeof entry['ATTERISSAGE_2024'] === 'string' ? 
          parseFloat(entry['ATTERISSAGE_2024'].replace(/[^\d.-]/g, '')) : 
          entry['ATTERISSAGE_2024']) : 
        budget2024;

      dataPoints.push({
        year: 2024,
        actualValue: null,
        predictedValue: atterrissage2024,
        hasBudget: true
      });
    }

    // Budget 2025
    if (entry['BUDGET_2025'] !== undefined && entry['BUDGET_2025'] !== null) {
      const budget2025 = typeof entry['BUDGET_2025'] === 'string' ? 
        parseFloat(entry['BUDGET_2025'].replace(/[^\d.-]/g, '')) : 
        entry['BUDGET_2025'];

      dataPoints.push({
        year: 2025,
        actualValue: null,
        predictedValue: budget2025,
        hasBudget: true
      });
    }

    // Plan 2026
    if (entry['PLAN_2026'] !== undefined && entry['PLAN_2026'] !== null) {
      const plan2026 = typeof entry['PLAN_2026'] === 'string' ? 
        parseFloat(entry['PLAN_2026'].replace(/[^\d.-]/g, '')) : 
        entry['PLAN_2026'];

      dataPoints.push({
        year: 2026,
        actualValue: null,
        predictedValue: plan2026,
        hasBudget: true
      });
    }

    console.log(`Données historiques pour ${axeName}:`, dataPoints);

    if (dataPoints.length < 2) continue;

    try {
      // Filtrer les points pour l'entraînement (exclure les années avec budget)
      const trainingPoints = dataPoints.filter(point => !point.hasBudget);
      
      // Générer les prédictions pour toutes les années futures
      const predictions = await generatePredictionsForDataset(trainingPoints, dataPoints, maxPredictionYear - currentYear);
      
      predictions.forEach(pred => {
        allPredictions.push({
          ...pred,
          axe: axeName,
          isTotal,
          contrepartie: entry.CONTRE_PARTIE,
          libLong: entry.Contrepartie_et_lib_long
        });
      });
    } catch (error) {
      console.error(`Erreur lors de la génération des prédictions pour ${axeName}:`, error);
    }
  }

  return allPredictions;
}

async function generatePredictionsForDataset(
  trainingPoints: { year: number; actualValue: number | null; predictedValue: number; hasBudget: boolean }[],
  allDataPoints: { year: number; actualValue: number | null; predictedValue: number; hasBudget: boolean }[],
  yearsToPredict: number
): Promise<DetailedPredictionData[]> {
  const values = trainingPoints.map(d => d.predictedValue);
  const years = trainingPoints.map(d => d.year);

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

  const xs = tf.linspace(0, trainingPoints.length - 1, trainingPoints.length);
  await model.fit(xs.reshape([-1, 1]), normalizedValues, {
    epochs: 100,
    verbose: 0
  });

  const predictions: DetailedPredictionData[] = [];

  // Ajouter toutes les données historiques et budgétées
  allDataPoints.forEach(d => {
    predictions.push({
      year: d.year,
      actualValue: d.actualValue || undefined,
      predictedValue: d.predictedValue,
      axe: '', // sera rempli par la fonction appelante
      isTotal: false // sera rempli par la fonction appelante
    });
  });

  // Générer les prédictions pour les années futures sans données
  const lastYear = Math.max(...allDataPoints.map(d => d.year));
  const lastDataPoint = allDataPoints.find(d => d.year === lastYear);
  
  if (!lastDataPoint?.hasBudget) {
    for (let i = 1; i <= yearsToPredict; i++) {
      const normalizedPrediction = model.predict(
        tf.tensor2d([trainingPoints.length + i - 1], [1, 1])
      ) as tf.Tensor;
      
      const prediction = normalizedPrediction
        .mul(std)
        .add(mean)
        .dataSync()[0];

      if (lastYear + i <= 2030) {
        predictions.push({
          year: lastYear + i,
          predictedValue: Math.max(0, prediction),
          axe: '', // sera rempli par la fonction appelante
          isTotal: false // sera rempli par la fonction appelante
        });
      }
    }
  }

  // Nettoyer les tenseurs
  model.dispose();
  mean.dispose();
  std.dispose();
  normalizedValues.dispose();
  xs.dispose();

  return predictions;
}