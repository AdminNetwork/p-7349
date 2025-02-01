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
    for (let year = 2020; year <= currentYear + yearsToPredict; year++) {
      const realKey = `ANNEE_${year}`;
      const budgetKey = `BUDGET_${year}`;
      const atterissageKey = `ATTERISSAGE_${year}`;
      
      let actualValue = null;
      let predictedValue = null;
      let hasBudget = false;
      
      // Pour les valeurs réelles
      if (entry[realKey] !== undefined && entry[realKey] !== null && entry[realKey] !== '') {
        actualValue = typeof entry[realKey] === 'string' ? parseFloat(entry[realKey].replace(/[^\d.-]/g, '')) : entry[realKey];
      }
      
      // Vérifier d'abord s'il existe une valeur de budget
      if (entry[budgetKey] !== undefined && entry[budgetKey] !== null && entry[budgetKey] !== '') {
        predictedValue = typeof entry[budgetKey] === 'string' ? parseFloat(entry[budgetKey].replace(/[^\d.-]/g, '')) : entry[budgetKey];
        hasBudget = true;
      } 
      // Sinon, vérifier l'atterrissage
      else if (entry[atterissageKey] !== undefined && entry[atterissageKey] !== null && entry[atterissageKey] !== '') {
        predictedValue = typeof entry[atterissageKey] === 'string' ? parseFloat(entry[atterissageKey].replace(/[^\d.-]/g, '')) : entry[atterissageKey];
        hasBudget = true;
      }
      
      // Si nous avons une valeur réelle ou une prévision
      if (actualValue !== null || predictedValue !== null) {
        dataPoints.push({
          year,
          actualValue,
          predictedValue: hasBudget ? predictedValue : actualValue,
          hasBudget
        });
      }
    }

    console.log(`Données historiques pour ${axeName}:`, dataPoints);

    if (dataPoints.length < 2) continue;

    try {
      // Filtrer les points pour l'entraînement (exclure les années avec budget)
      const trainingPoints = dataPoints.filter(point => !point.hasBudget);
      
      // Générer les prédictions uniquement pour les années futures sans budget
      const predictions = await generatePredictionsForDataset(trainingPoints, dataPoints, yearsToPredict);
      
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
  trainingPoints: { year: number; actualValue: number | null; predictedValue: number; hasBudget: boolean }[],
  allDataPoints: { year: number; actualValue: number | null; predictedValue: number; hasBudget: boolean }[],
  yearsToPredict: number
): Promise<DetailedPredictionData[]> {
  // Utiliser uniquement les points sans budget pour l'entraînement
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

  // Ajouter toutes les données historiques
  allDataPoints.forEach(d => {
    predictions.push({
      year: d.year,
      actualValue: d.actualValue || undefined,
      predictedValue: d.predictedValue,
      axe: '', // sera rempli par la fonction appelante
      isTotal: false // sera rempli par la fonction appelante
    });
  });

  // Générer les prédictions uniquement pour les années futures sans données de budget
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

      predictions.push({
        year: lastYear + i,
        predictedValue: Math.max(0, prediction),
        axe: '', // sera rempli par la fonction appelante
        isTotal: false // sera rempli par la fonction appelante
      });
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