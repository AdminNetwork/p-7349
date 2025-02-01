import * as tf from '@tensorflow/tfjs';
import type { BudgetData, DetailedPredictionData } from '@/types/budget';

export type { DetailedPredictionData as PredictionData };

export async function generatePredictions(
  historicalData: BudgetData[],
  yearsToPredict: number = 10
): Promise<DetailedPredictionData[]> {
  console.log("Début de la génération des prédictions avec les données:", historicalData);

  const yearColumns = Object.keys(historicalData[0] || {}).filter(key => 
    key.startsWith('ANNEE_') && !isNaN(parseInt(key.split('_')[1]))
  );

  console.log("Colonnes d'années trouvées:", yearColumns);

  // Séparer les totaux et les détails
  const totalLines = historicalData.filter(entry => entry.Axe_IT?.startsWith('Total '));
  const detailLines = historicalData.filter(entry => !entry.Axe_IT?.startsWith('Total '));

  console.log("Nombre de lignes totales:", totalLines.length);
  console.log("Nombre de lignes détaillées:", detailLines.length);

  const allPredictions: DetailedPredictionData[] = [];

  // Traiter les totaux
  for (const entry of totalLines) {
    const axeName = entry.Axe_IT.replace('Total ', '');
    const dataPoints = yearColumns.map(col => ({
      year: parseInt(col.split('_')[1]),
      value: typeof entry[col] === 'string' 
        ? parseFloat(entry[col].replace(/[^\d.-]/g, ''))
        : entry[col]
    })).filter(point => !isNaN(point.value));

    if (dataPoints.length < 2) continue;

    try {
      const predictions = await generatePredictionsForDataset(dataPoints, yearsToPredict);
      
      predictions.forEach(pred => {
        allPredictions.push({
          ...pred,
          axe: axeName,
          isTotal: true
        });
      });
    } catch (error) {
      console.error(`Erreur lors de la génération des prédictions pour ${axeName}:`, error);
    }
  }

  // Traiter les détails
  for (const entry of detailLines) {
    const dataPoints = yearColumns.map(col => ({
      year: parseInt(col.split('_')[1]),
      value: typeof entry[col] === 'string' 
        ? parseFloat(entry[col].replace(/[^\d.-]/g, ''))
        : entry[col]
    })).filter(point => !isNaN(point.value));

    if (dataPoints.length < 2) continue;

    try {
      const predictions = await generatePredictionsForDataset(dataPoints, yearsToPredict);
      
      predictions.forEach(pred => {
        allPredictions.push({
          ...pred,
          axe: entry.Axe_IT,
          isTotal: false,
          contrepartie: entry.Contrepartie,
          libLong: entry.Lib_Long
        });
      });
    } catch (error) {
      console.error(`Erreur lors de la génération des prédictions détaillées pour ${entry.Axe_IT}:`, error);
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